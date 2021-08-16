from flask import request, render_template, flash, session, Markup, redirect, url_for
from signage_server_app import app
import json
import os

curdir = os.path.dirname(os.path.realpath(__file__))


# --- HTML Pages ---

@app.route("/")
@app.route("/displays")
def displays():
    # Returns a page showing all active displays
    return render_template("displays.html")


@app.route("/displays/<display_name>")
def display(display_name):
    # Returns a specific display based on the provided display name
    return render_template("display.html", display_name=display_name)


@app.route("/admin/login")
def admin_login():
    # Returns a login page
    return render_template("admin_login.html")


@app.route("/admin/displays")
def admin_displays():
    # Returns a page with a table for adding, editing, or removing displays
    if not session.get("logged_in"):
        return redirect(url_for("admin_login"))
    return render_template("admin_displays.html")


@app.route("/admin/content")
def admin_content():
    # Returns a page with a table for adding, editing, or removing content
    if not session.get("logged_in"):
        return redirect(url_for("admin_login"))
    return render_template("admin_content.html")


@app.route("/admin/playlists")
def admin_playlists():
    # Returns a page with a table for adding, editing, or removing playlists
    if not session.get("logged_in"):
        return redirect(url_for("admin_login"))
    return render_template("admin_playlists.html")


# --- API Calls ---

@app.route('/health')
def health():
    # Generic health check for testing purposes
    return json.dumps({'healthy': True})