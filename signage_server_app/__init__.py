from pathlib import Path
from flask import Flask
import os

curdir = os.path.dirname(os.path.realpath(__file__))

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 # Don't cache CSS or JS files
app.secret_key = os.urandom(12)

# Prep the database
db_file = os.path.join(curdir, "data", "db.json")
Path(os.path.join(curdir, "data")).mkdir(parents=True, exist_ok=True) # Make sure data dir exists
if not os.path.exists(db_file):
    # Create empty DB file if it doesn't already exist
    with open(db_file, 'w'):
        pass

# Create content and thumbnail directories if they don't exist
Path(os.path.join(curdir, "static", "content")).mkdir(parents=True, exist_ok=True)
Path(os.path.join(curdir, "static", "thumbnails")).mkdir(parents=True, exist_ok=True)

# Import the main router that handles the HTML pages
import signage_server_app.router

# Import the APIs that handle CRUD operations
import signage_server_app.crud