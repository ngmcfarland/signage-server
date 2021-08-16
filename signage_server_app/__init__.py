from flask import Flask
import os

curdir = os.path.dirname(os.path.realpath(__file__))

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 # Don't cache CSS or JS files
app.secret_key = os.urandom(12)

# Import the main router that handles the HTML pages
import signage_server_app.router