from werkzeug.utils import secure_filename
from moviepy import VideoFileClip, vfx
from signage_server_app import app
from datetime import datetime
from flask import request
from tinydb import TinyDB
from pathlib import Path
from PIL import Image
import random
import string
import json
import yaml
import os


curdir = os.path.dirname(os.path.realpath(__file__))

# Only listen to these endpoints
endpoints = ["displays", "content", "playlists"]
# Load item templates to use when checking for valid items
with open(os.path.join(curdir, "data", "item_templates.yaml"), 'r') as f:
    item_templates = yaml.load(f.read(), Loader=yaml.SafeLoader)

# Open the database
db = TinyDB(os.path.join(curdir, "data", "db.json"))


@app.route("/api/<endpoint>", methods=["GET", "POST"])
@app.route("/api/<endpoint>/<int:item_id>", methods=["GET", "PUT", "DELETE"])
def handle_endpoint(endpoint, item_id=None, tries=1):
    # Make sure a valid endpoint was called
    if endpoint in endpoints:
        # Wrap everything in try/except to handle possible JSONDecoderErrors from TinyDB
        try:
            # Prep the table
            table = db.table(endpoint)
            # Perform different logic depending on HTTP request method
            if request.method == "GET":
                # Return single item if item ID provided, else all items
                if item_id is not None:
                    # Get item from table using item_id
                    result = table.get(doc_id=item_id)
                    # Add ID to item if found
                    if result is not None:
                        result['id'] = item_id
                    return dict(status="SUCCESS", item=result)
                else:
                    results = list()
                    # Get all items from table
                    for row in table.all():
                        temp = row.copy()
                        # Add ID to each item
                        temp['id'] = row.doc_id
                        results.append(temp)
                    return dict(status="SUCCESS", items=results)
            elif request.method == "POST":
                # Get the data of the request
                if request.content_type.startswith("application/json"):
                    data = request.json
                else:
                    data = process_file(file_obj=request.files['file'])
                    data['name'] = request.form.get('name')
                if valid_item(item=data, template=item_templates[endpoint]):
                    # Insert data into table and get new item ID back
                    item_id = table.insert(data)
                    # Add item ID to response data
                    data['id'] = item_id
                    return dict(status="SUCCESS", item=data)
                else:
                    return dict(status="FAILED", message="Invalid item!"), 403
            elif request.method == "PUT":
                # Get the data of the request
                if request.content_type.startswith("application/json"):
                    data = request.json
                else:
                    old_file = table.get(doc_id=item_id)
                    data = process_file(file_obj=request.files['file'], old_file=old_file)
                    data['name'] = request.form.get('name')
                if valid_item(item=data, template=item_templates[endpoint]):
                    # Make sure 'id' is not in the item before updating in the table
                    temp = data.copy()
                    try:
                        _ = temp.pop('id')
                    except KeyError:
                        pass
                    # Update the item in the table
                    try:
                        _ = table.update(temp, doc_ids=[item_id])
                        # If this was a content item or playlist, then referential data needs to be handled
                        if endpoint in ("content", "playlists"):
                            handle_referential_data(item_id=item_id, table_name=endpoint, action="update")
                        return dict(status="SUCCESS", item=data)
                    except KeyError:
                        return dict(status="FAILED", message=f"Item ID {item_id} not found in table '{endpoint}'"), 403
                else:
                    return dict(status="FAILED", message="Invalid item!"), 403
            elif request.method == "DELETE":
                # Remove the item from the table
                try:
                    # Need to remove files if deleting content
                    if endpoint == "content":
                        try:
                            content_item = table.get(doc_id=item_id)
                            os.remove(os.path.join(curdir, "static", "thumbnails", content_item['thumb'].split("/")[-1]))
                            os.remove(os.path.join(curdir, "static", "content", content_item['file'].split("/")[-1]))
                        except:
                            pass
                    _ = table.remove(doc_ids=[item_id])
                    # If this was a content item or playlist, then referential data needs to be handled
                    if endpoint in ("content", "playlists"):
                        handle_referential_data(item_id=item_id, table_name=endpoint, action="delete")
                    return dict(status="SUCCESS")
                except KeyError:
                    return dict(status="FAILED", message=f"Item ID {item_id} not found in table '{endpoint}'"), 403
            else:
                return dict(status="FAILED", message=f"Invalid HTTP method: {request.method}"), 404
        except json.decoder.JSONDecodeError:
            # Retry
            if tries < 3:
                return handle_endpoint(endpoint=endpoint, item_id=item_id, tries=tries+1)
            else:
                return dict(status="FAILED", message="Failed to get data from database."), 500
    else:
        return dict(status="FAILED", message=f"Invalid endpoint: {endpoint}"), 404


def valid_item(item, template):
    # Check if item is legit using a template recursively
    item_valid = True
    if item is None:
        return True
    elif isinstance(template, dict):
        if not isinstance(item, dict):
            return False
        for key in template:
            try:
                item_valid = valid_item(item=item[key], template=template[key])
            except KeyError:
                item_valid = False
            if not item_valid:
                break
    elif isinstance(template, list):
        if not isinstance(item, list):
            return False
        if len(item) > 0:
            item_valid = valid_item(item=item[0], template=template[0])
    else:
        item_valid = isinstance(item, type(template))
    return item_valid


def handle_referential_data(item_id, table_name, action="update"):
    # Playlists hold references to content, and displays hold references content or playlists
    # For an updated content item or playlist, go through and update any references
    try:
        table = db.table(table_name)
        if action == "update":
            new_item = table.get(doc_id=item_id)
            new_item['id'] = item_id
        else:
            # It was deleted
            new_item = None
        if table_name == "playlists":
            # Check to see if any displays are showing this playlist and update/delete if necessary
            displays_table = db.table("displays")
            displays_to_be_updated = list()
            for display in displays_table:
                if display['showing'] is not None and display['showing']['type'] == "playlist" and display['showing']['id'] == item_id:
                    displays_to_be_updated.append(display.doc_id)
            if len(displays_to_be_updated) > 0:
                updated = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
                if action == "update":
                    _ = displays_table.update(dict(showing=new_item, updated=updated), doc_ids=displays_to_be_updated)
                elif action == "delete":
                    _ = displays_table.update(dict(showing=None, updated=updated), doc_ids=displays_to_be_updated)
        elif table_name == "content":
            # Check to see if any displays are showing this content and update/delete if necessary
            displays_table = db.table("displays")
            displays_to_be_updated = list()
            for display in displays_table:
                if display['showing'] is not None and display['showing']['type'] in ("image", "video") and display['showing']['id'] == item_id:
                    displays_to_be_updated.append(display.doc_id)
            if len(displays_to_be_updated) > 0:
                updated = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
                if action == "update":
                    _ = displays_table.update(dict(showing=new_item, updated=updated), doc_ids=displays_to_be_updated)
                elif action == "delete":
                    _ = displays_table.update(dict(showing=None, updated=updated), doc_ids=displays_to_be_updated)
            # Check to see if any playlists are showing this content and update/delete if necessary
            playlists_table = db.table("playlists")
            updated_playlists = list()
            for playlist in playlists_table:
                tracks_to_be_updated = list()
                for i,track in enumerate(playlist['tracks']):
                    if track['track']['id'] == item_id:
                        tracks_to_be_updated.append(i)
                if len(tracks_to_be_updated) > 0:
                    for j in sorted(tracks_to_be_updated, reverse=True):
                        if action == "update":
                            playlist['tracks'][j]['track'] = new_item
                            if new_item['type'] == "video":
                                playlist['tracks'][j]['duration'] = new_item['duration']
                        elif action == "delete":
                            _ = playlist['tracks'].pop(j)
                    _ = playlists_table.update(playlist, doc_ids=[playlist.doc_id])
                    updated_playlists.append(playlist.doc_id)
            # If any playlists were updated, call this function again so that displays can be checked again
            for playlist_id in updated_playlists:
                handle_referential_data(item_id=playlist_id, table_name="playlists", action="update")
    except Exception as e:
        print(f"ERROR: {e}")



def allowed_file(filename):
    # Return True if file extension in list of allowed file types
    return Path(filename).suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov']


def process_file(file_obj, old_file=None):
    # Make sure file is allowed
    if not allowed_file(file_obj.filename) or file_obj.mimetype.split("/")[0] not in ("image", "video"):
        return None
    # Use a random prefix to ensure a unique file name
    random_prefix = ''.join(random.choice(string.ascii_lowercase) for i in range(10))
    # Per best practice, use the Werkzeug secure_filename function to protect against malicious file names
    file_name = f"{random_prefix}_{secure_filename(file_obj.filename)}"
    file_path = os.path.join(curdir, "static", "content", file_name)
    # Prep the return object
    info = dict(file=f"/static/content/{file_name}")
    # Get file info and create thumbnails
    if file_obj.mimetype.split("/")[0] == "image":
        # Save the file
        file_obj.save(file_path)
        # Get file info
        info['type'] = "image"
        image = Image.open(file_path)
        info['resolution'] = f"{image.size[0]}x{image.size[1]}"
        info['duration'] = None
        info['size'] = os.path.getsize(file_path)
        # Create thumbnail
        info['thumb'] = f"/static/thumbnails/{file_name}"
        thumb_path = os.path.join(curdir, "static", "thumbnails", file_name)
        thumbnail = image.resize((int((50/image.height)*image.width), 50), Image.Resampling.LANCZOS)
        thumbnail.save(thumb_path)
    elif file_obj.mimetype.split("/")[0] == "video":
        # Save the file
        file_obj.save(file_path)
        # Get file info
        info['type'] = "video"
        with VideoFileClip(file_path) as clip:
            info['resolution'] = f"{clip.w}x{clip.h}"
            info['duration'] = int(clip.duration)
            info['size'] = os.path.getsize(file_path)
            # Create thumbnail
            info['thumb'] = f"/static/thumbnails/{os.path.splitext(file_name)[0]}.png"
            thumb_path = os.path.join(curdir, "static", "thumbnails", f"{os.path.splitext(file_name)[0]}.png")
            resize_clip = clip.with_effects([vfx.Resize(height=50)])
            resize_clip.save_frame(thumb_path, t=min(2, info['duration']))
    else:
        # Only accept images or videos
        return None
    # Remove old file if necessary
    if old_file is not None:
        old_file_path = os.path.join(curdir, "static", "content", old_file['file'].split("/")[-1])
        old_thumb_path = os.path.join(curdir, "static", "thumbnails", old_file['thumb'].split("/")[-1])
        for path in (old_file_path, old_thumb_path):
            try:
                os.remove(path)
            except:
                pass
    # Return file info
    return info