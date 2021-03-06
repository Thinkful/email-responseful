#!/bin/sh

# Create the Virtual Environment
virtualenv venv
source venv/bin/activate 
pip install -r requirements.txt

export RESPONSEFUL_TABLE="responseful"
echo "Set variable RESPONSEFUL_TABLE to " $RESPONSEFUL_TABLE;

export RESPONSEFUL_USER="postgres"
echo "Set variable RESPONSEFUL_USER to " $RESPONSEFUL_USER;

# Create the database
echo "Deleting any existing database " $RESPONSEFUL_TABLE
dropdb --if-exists $RESPONSEFUL_TABLE
if [ `echo $?` -ne 0 ]; then echo "Last cmd failed! Aborting."; exit 100; fi

echo "Creating empty db " $RESPONSEFUL_TABLE
createdb -U $RESPONSEFUL_USER -T template0 $RESPONSEFUL_TABLE
if [ `echo $?` -ne 0 ]; then echo "Last cmd failed! Aborting."; exit 100; fi

echo "Database was created successfully!"
