from flask import request, render_template, flash, session, redirect, url_for
from signage_server_app import app
from datetime import datetime
from markupsafe import Markup
from .crud import db
import json
import yaml
import os

curdir = os.path.dirname(os.path.realpath(__file__))
# HTML Snippets
snippets = dict()
for file in os.listdir(os.path.join(curdir, "templates", "snippets")):
    if file.endswith(".html"):
        with open(os.path.join(curdir, "templates", "snippets", file), 'r') as f:
            snippets[os.path.splitext(file)[0]] = Markup(f.read())

# Only listen to these endpoints
endpoints = ["displays", "content", "playlists"]


# --- HTML Pages ---

@app.route("/")
@app.route("/displays", methods=["GET"])
def displays():
    # Returns a page showing all active displays
    return render_template("displays.html", **snippets)


@app.route("/<endpoint>/<int:item_id>", methods=["GET"])
def preview(endpoint, item_id):
    # Returns a preview of an item based on the ID and the endpoint
    if endpoint in endpoints:
        endpoint = endpoint[:-1] if endpoint[-1] == "s" else endpoint
        return render_template(f"{endpoint}.html", item_id=item_id, **snippets)
    else:
        return "Page not found", 404


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "GET":
        # Returns a login page
        return render_template("admin_login.html", **snippets)
    elif request.method == "POST":
        # Check the password and allow user to proceed if correct
        with open(os.path.join(curdir, "data", "credentials.yaml"), 'r') as f:
            config = yaml.load(f.read(), Loader=yaml.SafeLoader)
        if request.form['password'] == config['password']:
            # Successful login
            session['logged_in'] = True
            endpoint = session.get("target_endpoint") if session.get("target_endpoint") else "displays"
            return dict(status="SUCCESS", endpoint=f"/admin/{endpoint}")
        else:
            # Wrong password
            return dict(status="FAILED", message="Invalid password.")



@app.route("/admin", methods=["GET"])
@app.route("/admin/<endpoint>", methods=["GET"])
def admin(endpoint="displays"):
    # Returns an admin page for the appropriate endpoint
    if not session.get("logged_in"):
        session['target_endpoint'] = endpoint
        return redirect(url_for("admin_login"))
    elif endpoint in endpoints:
        return render_template(f"admin_{endpoint}.html", **snippets)
    else:
        return "Page not found", 404


# --- API Calls ---

@app.route('/health')
def health():
    # Generic health check for testing purposes
    return json.dumps({'healthy': True})


@app.route("/updateDisplayContent", methods=["POST"])
def update_display_content():
    """ Update the content showing on a display. Requires 'displayId' and 'contentId' in request body. """
    data = request.json
    if 'displayId' not in data or 'contentId' not in data:
        return "Must include 'displayId' and 'contentId'!", 404
    displays = db.table("displays")
    content = db.table("content")
    display_obj = displays.get(doc_id=data['displayId'])
    content_obj = content.get(doc_id=data['contentId']) if data['contentId'] else None
    if display_obj:
        updated_obj = dict(showing=content_obj,
                           fadeTime=data.get("fadeTime", display_obj['fadeTime']),
                           updated=datetime.utcnow().isoformat()[:-3] + "Z")
        return displays.update(updated_obj, doc_ids=[data['displayId']])
    else:
        return "Display not found!", 404


@app.route("/playYoutubeVideo", methods=["POST"])
def play_youtube_video():
    """ Play a YouTube video on a display. """
    data = request.json
    if 'displayId' not in data or 'youtubeUrl' not in data or data['youtubeUrl'] == "":
        return "Must include 'displayId' and 'youtubeUrl'!", 404
    displays = db.table("displays")
    display_obj = displays.get(doc_id=data['displayId'])
    # Create a temporary content object with the YouTube info
    if "watch" in data['youtubeUrl']:
        # https://www.youtube.com/watch?v=pUaKcFI4BZY
        video_id = data['youtubeUrl'].split("=")[-1]
    else:
        # https://www.youtube.com/embed/pUaKcFI4BZY?controls=0
        video_id = data['youtubeUrl'].split("/")[-1].split("?")[0]
    content_obj = {
        "duration": 100,  # Currently only used by playlists, so this doesn't matter
        "file": f"https://www.youtube.com/embed/{video_id}",
        "name": f"Temporary YouTube Video ({video_id})",
        "resolution": "unknown",
        "size": 0,
        "thumb": "/static/thumbnails/youtube.png",
        "type": "youtube"
    }
    if display_obj:
        updated_obj = dict(showing=content_obj,
                           updated=datetime.utcnow().isoformat()[:-3] + "Z")
        return displays.update(updated_obj, doc_ids=[data['displayId']])
    else:
        return "Display not found!", 404
