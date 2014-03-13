import json, os, datetime, time, gspread, re, string, StringIO, gzip
from flask import render_template, send_file, jsonify, request, make_response
from config import app, db, get_flagged, EMAIL_HANDLE_REGEX, SUBJECT_LIST, G_DRIVE_USER, G_DRIVE_PASS

class DeepEncoder(json.JSONEncoder):
    def default(self, obj):
        if type(obj) in (datetime.datetime, datetime.date):
            return obj.isoformat()
        try:
            return super(DeepEncoder, self).default(obj)
        except TypeError, te:
            return obj.__dict__

def gzip_data(data, compresslevel=6):
    gzip_buffer = StringIO.StringIO()
    gzip_file = gzip.GzipFile(mode='wb', compresslevel=compresslevel, fileobj=gzip_buffer)
    gzip_file.write(data)
    gzip_file.close()
    gzipped_data = gzip_buffer.getvalue()
    return gzipped_data

def check_table():
    query = """ CREATE TABLE IF NOT EXISTS email_responses
    (
        subject         text NOT NULL,
        sender          varchar(100) NOT NULL,
        date_sent       timestamp NOT NULL,
        responder       varchar(100) NOT NULL,
        date_responded  timestamp NOT NULL,
        response_time   float4 NOT NULL,
        email_class     varchar(25) NOT NULL,
        flagged         bool,
        drip            bool NOT NULL
    );"""
    db.engine.execute(query)

def insert_response(message):
    query = """ INSERT INTO email_responses 
    (subject, sender, date_sent, responder, date_responded, response_time, email_class, flagged, drip) VALUES 
    ('%s', '%s', '%s', '%s', '%s', %s, '%s', %s, %s); 
    """ % (
        string.replace(message['subject'], "'", "''"),
        string.replace(message['sender'], "'", "''"),
        message['dateSent'],
        string.replace(message['responder'], "'", "''"),
        message['dateResponded'],
        message['responseTime'],
        message['emailClass'],
        message['flagged'],
        message['drip']
    )
    db.engine.execute(query)

# Serve up the angular app
@app.route('/') 
@app.route('/upload/<sh>/<ws>/')
def index(sh=None, ws=None):
    return render_template('index.html')

@app.route('/fetch_data', methods=['GET', 'POST'])
def fetch_data():
    data = json.loads(request.data)
    start_date = datetime.datetime.strptime(data['start'], "%Y-%m-%d")
    end_date = datetime.datetime.strptime(data['end'], "%Y-%m-%d")

    res = db.engine.execute("SELECT * FROM email_responses WHERE date_responded >= '%s' AND date_responded <= '%s'" % (start_date, end_date))

    messages = []
    
    for r in res:
        messages.append({ 
            'subject': r[0],
            'sender': r[1],
            'dateSent': r[2],
            'responder': r[3],
            'dateResponded': r[4],
            'responseTime': r[5],
            'emailClass': r[6],
            'flagged': r[7],
            'drip': r[8]
        })

    kwargs = {}
    if request.args.get('pretty') in ['1', 'true']:
        kwargs = dict(sort_keys=True, indent=2)
    res = json.dumps(messages, cls=DeepEncoder, **kwargs)
    response = make_response(gzip_data(res))
    response.headers['Content-Encoding'] = 'gzip'
    return response

@app.route('/upload_data', methods=['POST'])
def upload_data():
    check_table()
    data = json.loads(request.data)
    username = G_DRIVE_USER
    password = G_DRIVE_PASS
    spreadsheet = data['spreadsheet']
    worksheet = data['worksheet']

    conn = gspread.login(username, password)

    sh = conn.open(spreadsheet)
    ws = sh.worksheet(worksheet)

    emails = ws.get_all_records()

    # Remove any duplicate emails from spreadsheet
    remove_dup_emails = [dict(e) for e in set(tuple(i.items()) for i in emails)]
    emails = remove_dup_emails;

    flagged_emails = get_flagged()

    # Filter and load into the DB

    #### Added data for each email ####
    # 1) responseTime: the time between the dateSent and the dateResponded in minutes
    # 2) emailClass:
    #    - 'internal': (both emails contain EMAIL_HANDLE_REGEX)
    #    - 'their-response': (only the sender email contains EMAIL_HANDLE_REGEX)
    #    - 'our-response': (only the responder email contains EMAIL_HANDLE_REGEX)
    #    - 'other': (neither email contains EMAIL_HANDLE_REGEX)
    # 3) flagged: true if one of the email addresses in the message response object is in flagged_emails
    # 4) drip: true if the subject line is in SUBJECT_LIST (uses the subject line)

    for e in emails:
        if e['dateSent'] != 'dateSent':
            # calculate responseTime (difference between date sent and date responded to)
            e['dateSent'] = datetime.datetime.strptime(e['dateSent'], "%m/%d/%Y %H:%M:%S")
            e['dateResponded'] = datetime.datetime.strptime(e['dateResponded'], "%m/%d/%Y %H:%M:%S")
            responseTime = e['dateResponded'] - e['dateSent']
            e['responseTime'] = (responseTime.days * 24 * 60) + (float(responseTime.seconds) / 60)

            # add emailClass
            if re.findall(EMAIL_HANDLE_REGEX, e['sender']):
                if re.findall(EMAIL_HANDLE_REGEX, e['responder']):
                    e['emailClass'] = 'internal'
                else:
                    e['emailClass'] = 'their-response'
            elif re.findall(EMAIL_HANDLE_REGEX, e['responder']):
                e['emailClass'] = 'our-response'
            else:
                e['emailClass'] = 'other'

            # Remove "Re: " from the subject lines 
            if re.findall(r'^Re:', e['subject']) or re.findall(r'^RE:', e['subject']):
                e['subject'] = e['subject'][3:].strip()

            # add flags
            if e['sender'] in flagged_emails or e['responder'] in flagged_emails:
                e['flagged'] = True
            else:
                e['flagged'] = False

            # add drip
            if e['subject'] in SUBJECT_LIST:
                e['drip'] = True
            else:
                e['drip'] = False

            insert_response(e)

    kwargs = {}
    if request.args.get('pretty') in ['1', 'true']:
        kwargs = dict(sort_keys=True, indent=2)
    res = json.dumps(emails, cls=DeepEncoder, **kwargs)
    response = make_response(gzip_data(res))
    response.headers['Content-Encoding'] = 'gzip'
    return response

if __name__ == '__main__':
    app.run(debug=True)
