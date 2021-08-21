from flask import request, render_template, flash, session, Markup, redirect, url_for
from signage_server_app import app
import json
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


### TEMPORARY ###
no_login = True


# --- HTML Pages ---

@app.route("/")
@app.route("/displays", methods=["GET"])
def displays():
    # Returns a page showing all active displays
    return render_template("displays.html")


@app.route("/<endpoint>/<int:item_id>", methods=["GET"])
def preview(endpoint, item_id):
    # Returns a preview of an item based on the ID and the endpoint
    if endpoint in endpoints:
        endpoint = endpoint[:-1] if endpoint[-1] == "s" else endpoint
        return render_template(f"{endpoint}.html", item_id=item_id, **snippets)
    else:
        return "Page not found", 404


@app.route("/admin/login", methods=["GET"])
def admin_login():
    # Returns a login page
    return render_template("admin_login.html", **snippets)


@app.route("/admin", methods=["GET"])
@app.route("/admin/<endpoint>", methods=["GET"])
def admin(endpoint="displays"):
    # Returns an admin page for the appropriate endpoint
    if not no_login and not session.get("logged_in"):
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