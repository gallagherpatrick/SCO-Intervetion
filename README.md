## SCO Intervention App

### Description
The GK SCO Intervention app is a nodejs application that uses Kafkajs libraries to connect to Apache Kafka and consume messages from the application to notify users of when interventions are needed at a SCO. The application is a nodejs application that takes the messages sent from the Kafka server and sends them through a websocket to the frontend application. 

### Software
**npm: 11.6.2**
**node: v22.20.0**

### How to
The GK SCO intervention app should run along side your Kafka instance on the same server for best results. It consumes the messages from kafka and pipes those into a websocket for the front end to consume.

Ensure you have the versions of npm and nodejs above installed on your server or higher

After you have cloned the repo

Update the ipAdd variable (/public/script.js) with the IP/Hostname of the server that you are running the nodejs server on.

Run **npm install** from the command line to install all dependincies

After that is finished run **npm run dev** to start the server

## NoVNC configuration on SCO

On your GK Selfcheckout you will need to install 3 tools WSL NoVNC and Tightvnc

TightVNC: https://www.tightvnc.com/download.php

### WSL/NoVNC

Open a CMD window with admin rights

**wsl --install -d Ubuntu-22.04**

After a reboot let windows finish installing packages

Pick a username and password

Open a new CMD window with admin rights after successful install

**cd /**

**wsl**

**git clone https://github.com/novnc/noVNC.git**

**cd noVNC**

**openssl req -new -x509 -days 365 -nodes -out self.pem -keyout self.pem**

**./utils/novnc_proxy --vnc ***HOSTIP***:5900**
