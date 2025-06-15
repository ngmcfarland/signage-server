# Signage Server

![Preview](https://github.com/ngmcfarland/signage-server/blob/main/signage_server_app/docs/Signage_Server_Preview.png)

Signage Server is a self-contained digital signage application written in Bootstrap and Python Flask. The application is designed to run on a local network and provides a clean interface for adding image and video content to be displayed on various displays remotely. 

## Features

* Easy to setup and get started
* Admin interface provided at http://localhost:5000/admin
* Supports the display of images (JPEG, PNG, WEBP, GIF) and videos (MP4, MOV, WEBM) using a browser
* Supports the creation of content "playlists" for cycling through multiple images and/or videos
* Manage multiple displays from a central webpage
* Runs on Windows, MacOS, Linux, and Raspberry PI

## Installation

Clone the repo and then install the Python requirements.

```
$ pip install -r requirements.txt
```

## Usage

### Admin Server

Linux, Raspberry PI, and MacOS

```
# From project root

$ ./start_server.sh
```

Windows

```
# From project root

$ start_server.bat
```

Once the admin server is running, open a web browser and go to:

[http://localhost:8080/admin](http://localhost:8080/admin)

The default password is 'password'. This can be changed in the following file:

[signage-server/signage_server_app/data/credentials.yaml](https://github.com/ngmcfarland/signage-server/blob/main/signage_server_app/data/credentials.yaml)

Once logged in, you can create displays, upload content, create playlists, and publish content/playlists to displays.

### Displays

Displays are viewed using a web browser on any device that's on the the same network as the server. To view a display on the same host as the server open a web browser and go to:

[http://localhost:8080](http://localhost:8080)

Then select which display you want to view.

By setting the web browser to full screen or kiosk mode, a fully functional digital display can be managed using the admin webpage on another device (even your phone).

### Other Devices

The displays and admin pages can also be accessed from any device on the same network. Find the IP address of the host where teh server is running and replace "localhost" with that IP in the URLs above. For example:

```
http://192.168.1.10:8080/admin
```

Advanced users can set up a DNS address for this IP address and also use a load balancer like [NGINX](https://www.nginx.com/) to allow HTTP or HTTPS access on the default ports (80 and 443 respectively).

## Developers

The production server runs using Waitress, but a development server can also be run using Flask for testing:

Linux, Raspberry PI, and MacOS

```
# From project root

$ ./start_dev_server.sh
```

Windows

```
# From project root

$ start_dev_server.bat
```