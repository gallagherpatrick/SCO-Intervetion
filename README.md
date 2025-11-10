## SCO Intervention App

### Description
The GK SCO Intervention app is a nodejs application that uses Kafkajs libraries to connect to Apache Kafka and consume messages from the application to notify users of when interventions are needed at a SCO. The application is a nodejs application that takes the messages sent from the Kafka server and sends them through a websocket to the frontend application. 

### Software
**npm: 11.6.2**
**node: v22.20.0**

### How to
The GK SCO intervention app should run along side your Kafka instance on the same server for best results. It consumes the messages from kafka and pipes those into a websocket for the front end to consume.

After you have cloned this repo

Update the wsUri variable (/public/script.js) with the IP/Hostname of the system the application is being served on.

Run **npm install** from the command line to install all dependincies

After that is finished run **npm run dev** to start the server
