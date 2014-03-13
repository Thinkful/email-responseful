//////////////////////////////////////////////////////////////////////////
////////////////////////////// Script Body ///////////////////////////////
//////////////////////////////////////////////////////////////////////////

function runAnalysis() {
    // Set variables
    var startDate = getDaysAgo(7); // last week
    var endDate = getDaysAgo(0); // today
    var emailAddress = '';

    // Establish connection to spreadsheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    today = new Date();
    var newSheetName = "Responseful-" + today.toDateString();
    ss.insertSheet(newSheetName);

    // Craft and run query (Thanks to GmailMeter!)
    var query = 'after:' + startDate + ' before:' + endDate;
    query += " in:anywhere -label:sms -label:call-log -label:chats -label:spam -filename:ics -from:unknown@example.com";
    query += " -from:maestro.bounces.google.com -from:unified-notifications.bounces.google.com -from:docs.google.com";
    query += " -from:group.calendar.google.com -from:apps-scripts-notifications@google.com";
    query += " -from:sites.bounces.google.com -from:noreply -from:notify -from:notification";

    var threads = GmailApp.search(query);

    ss.appendRow(['subject','sender','dateSent','responder','dateResponded']);
  
    // Batch Email analysis
    var BATCH_SIZE = 100;
    var threadCount = threads.length;

    for(var i = 0; i < threadCount; i += BATCH_SIZE) {
        logThreads(ss, threads.slice(i, i + BATCH_SIZE));
    }

    sendEmail(emailAddress, ss);
}

//////////////////////////////////////////////////////////////////////////
//////////////////////////// Helper Functions ////////////////////////////
//////////////////////////////////////////////////////////////////////////

// Log each thread in a batch
function logThreads(ss, threads) {
    threads.forEach(function(thread) {
        logOneThread(ss, thread);
        Utilities.sleep(1000); // Make Google happy
    });
}

// Log the data from one thread into the spreadsheet
function logOneThread(ss, thread) {
    var messages = thread.getMessages()
    var data = {
        subject: '',
        sender: '',
        dateSent: null,
        responder: '',
        dateResponded: null
    };
    var info = [];
    for(var j = 0; j < messages.length; j++) {
        info = [];
        if(j == 0) { // set thread starter info
            data.subject = messages[j].getSubject();
            data.sender = stripEmail(messages[j].getFrom());
            data.dateSent = messages[j].getDate();
        }
        else {
            //// Add check to ensure responder != sender? (could do in python too) ////
          if(data.sender != messages[j].getFrom()) {
            data.responder = stripEmail(messages[j].getFrom())
            data.dateResponded = messages[j].getDate();
            info.push(data.subject);
            info.push(data.sender);
            info.push(data.dateSent);
            info.push(data.responder);
            info.push(data.dateResponded);
            ss.appendRow(info); // add row to spreadsheet
            data.sender = data.responder;
            data.dateSent = data.dateResponded;
          }
        }
    }
}

// Craft command and send email
function sendEmail(emailAddress, ss){
    var emailBody = "<h2>Responseful</h2> "
    emailBody += "Response data for this week is ready!<br>"
    emailBody += "<a href='http://localhost:5000/upload/" + ss.getName() + "/" + ss.getActiveSheet().getName() + "'>Insert The data into the DB!</a><br>"
    emailBody += "Spreadsheet: " + ss.getName() + "<br>"
    emailBody += "Worksheet: " + ss.getActiveSheet().getName() + "<br>"
    GmailApp.sendEmail(emailAddress, "This Week's Response Analysis Data", emailBody, { htmlBody: emailBody })
}

// Get a date n days ago, formatted for a gmail query (negative values will give you future dates)
function getDaysAgo(n) {
    date = new Date;
    if(n != 0) {
        date.setDate(date.getDate() - n);
    }
    day = String(date.getDate());
    month = String(date.getMonth() + 1);
    year = String(date.getFullYear());

    if(day.length < 2) {
        day = '0' + day;
    }

    if(month.length < 2) {
        month = '0' + month;
    }

    return year + '/' + month + '/' + day; // Gmail query uses yyyy/mm/dd format
}

// Strip gmail email to basic email format (i.e. 'a@b.com <a@b.com>' becomes 'a@b.com' -- Thanks to GmailMeter!)
function stripEmail(email) {
    email = email.replace(/"[^"]*"/g,'');
    if (email.match(/</) != null) email = email.match(/<([^>]*)/)[1];
    return email;
}