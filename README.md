# Responseful by Thinkful #

## Description ##

Email analytics for any gmail account
* Measure email response delay – the amount of time it takes to you to send or receive responses to your email.
* Show changes to response delay over time
* Optionally filter messages by date and business hours
* Show number of emails, number responded to and who was corresponded with.
* Show impact of delays in your responding to an email on a custom defined metric.

## How We Use This ##

We care a lot about responding to emails quickly, but we had no idea the impact a fast response would be for students or potential students. So we built Responseful to measure it.

First, we looked at how our response rate compared to those emailing us, then we looked for correlations between a delay in our response rate to a decrease or increase in our own key performance indicators for our business. The results were staggering (and proprietary). Creating the tools to make more data-driven decisions about our startup is key to our success, and we want everyone to have this one. Please tell us how you use it!

## Inspiration ##
Inspired by [Gmail Meter](http://gmailmeter.com/) – thanks to [Shuttlecloud](http://shuttlecloud.com/) for the initial direction! Check out their code [here](https://sites.google.com/site/nnillixxsource/Vialard/GmailMeter).

## Setup Steps ##

1) Run setup.sh to install dependencies and setup environment (must have virtualenv installed)

2) Set up the database:
* Make sure you have postgres installed (you can run psql --version)
* Navigate to the root directory of Responseful and run setup.sh (you can run `bash setup.sh`). This file will create a database called `responseful`, unless you change the variable in the setup.sh file to another value.
    
3) Set up your configure file (config.py). The configure file needs several things:
* DATABASE_URL: The url for the postgres database set up by setup.sh
* FLAG_DATABASE_URL: The url for the database you wish to get your flagged emails from
* EMAIL_HANDLE_REGEX: Your company's email handle, as a regex (i.e. [company] if your email is example@[company].com). Used to flag internal emails and determine who is responding (you or them)
* SUBJECT_LIST: A list of subjects (strings) you wish you check against the subjects in your emails
* G_DRIVE_USER: Your google drive email
* G_DRIVE_PASS: Your google drive password

4) Set up the Google script:
* Create a new spreadsheet in Google drive, under the email account you wish to gather data from. Give the sheet a name (it defaults to Untiltied Spreadsheet).
* Create a new script (Tools -> Script Editor -> Blank Project -> Paste in the google script)
* add your email (or the email you want results to be sent to) in the `emailAddress` variable at the top of the script
* Run the script. You can run it as many times as you want, ajusting the dates at the top to get emails from x to y days ago. Duplicates will be removed before messages are inserted into the database.
    
5) Start the application starting your virtual environment (`source venv/bin/activate`) and running `python webstart.py` from the command line in the root directory of the Responseful app.

6) Check your email (the one from the googleScript `emailAddress` variable). follow the link in the email and press upload. Your emails will be pulled, analyzed, and inserted into a database (this may take a while, depending on how many emails you pulled). You'll be taken to the dashboard where you can see the data in action!

## Dashboard Usage ##

At the dashboard, you can filter emails between specific dates and look at the collected data to identify trends and the effectiveness of your company's email response habits. You can filter out emails that were sent outside of business hours, to get a better sense of your response rate during the day.

## Troubleshooting ##

1) The email never arrived
* Check your email address for typos in the Google script
* Google scripts have a timeout at 6 minutes. If you try to mine too many emails at one time, it might come up with the error "exceeded maximum execution time". Try making the range between your emails smaller, and running the script multiple times to get a bigger range. Don't worry about capturing emails more than once, duplicates are removed before the data is inserted into the database.
