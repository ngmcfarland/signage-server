from signage_server_app import app, db
from flask import request
import json
import os


curdir = os.path.dirname(os.path.realpath(__file__))

# Only listen to these endpoints
endpoints = ["displays", "content", "playlists"]
# Load item templates to use when checking for valid items
with open(os.path.join(curdir, "data", "item_templates.json"), 'r') as f:
    item_templates = json.loads(f.read())


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
                for row in table:
                    temp = row.copy()
                    # Add ID to each item
                    temp['id'] = row.doc_id
                    results.append(temp)
                return dict(status="SUCCESS", items=results)
        elif request.method == "POST":
            # Get the data of the request
            data = request.json
            if valid_item(item=data):
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
            if valid_item(item=data):
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


def valid_item(item):
    # Check if item is legit here    
    return True