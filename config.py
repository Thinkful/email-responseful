from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine

##### Responseful Configuration File #####

# the URL for the Responseful database
DATABASE_URL = '' # format is something like postgres://postgres@localhost/responseful

# the url for the database for pulling email flagging data
FLAG_DATABASE_URL= ''

# your company's email handle (i.e. <company> if your email is example@<company>.com)
EMAIL_HANDLE_REGEX = r''

# Your list of subjects to check for (ex. drip campaign) can go here
SUBJECT_LIST = []

# The google drive credentials for getting your spreadsheet data
G_DRIVE_USER = ''
G_DRIVE_PASS = ''

def get_flagged():
    """
    Insert a call to your own database here. This method should return a list of emails that should be flagged as 'true'.
    """

    # flagged_emails = []

    # Craft query to database
    # query = """
    # ####################################
    # ####################################
    # ####### YOUR QUERY GOES HERE #######
    # ####################################
    # ####################################
    # """

    # res = flag_engine.execute(query)

    # Insert your flagged emails into flagged_emails

    # return flagged_emails

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
db = SQLAlchemy(app)
if FLAG_DATABASE_URL != '':
    flag_engine = create_engine(FLAG_DATABASE_URL)