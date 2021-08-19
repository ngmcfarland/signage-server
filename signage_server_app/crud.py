from signage_server_app import app
from flask import request
from tinydb import TinyDB
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
def handle_endpoint(endpoint, item_id=None):
    # Make sure a valid endpoint was called
    if endpoint in endpoints:
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
            data = request.json
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
            data = request.json
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
                    return dict(status="SUCCESS", item=data)
                except KeyError:
                    return dict(status="FAILED", message=f"Item ID {item_id} not found in table '{endpoint}'"), 403
            else:
                return dict(status="FAILED", message="Invalid item!"), 403
        elif request.method == "DELETE":
            # Remove the item from the table
            try:
                _ = table.remove(doc_ids=[item_id])
                return dict(status="SUCCESS")
            except KeyError:
                return dict(status="FAILED", message=f"Item ID {item_id} not found in table '{endpoint}'"), 403
        else:
            return dict(status="FAILED", message=f"Invalid HTTP method: {request.method}"), 404
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