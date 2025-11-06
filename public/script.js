const wsUri = 'ws://192.168.2.172:8181';
let websocket;
let pingInterval;
let reconnectTimeout;

// const message = {
//     "messageId": "37d594f9-9052-44f7-a1de-de1b196976a0",
//     "creationTimestamp": "2025-10-08T15:52:28.993-0400",
//     "tenantId": "001",
//     "businessUnitId": "2460",
//     "deviceId": "104",
//     "deviceType": "SCO",
//     "deviceGroup": "defaultGroup",
//     "eventName": "sales_restrictions_age_restriction",
//     "eventState": "RESOLVED",
//     "eventRetained": true,
//     "eventRetainedTimeout": "2025-10-08T15:57:28.993-0400",
//     "requiredAge": "21",
//     "blockingFlag": true
// }

function connectWebSocket() {
  websocket = new WebSocket(wsUri);

  websocket.addEventListener("open", () => {
    console.log("✅ WebSocket connected to server.");

    // Clear reconnection attempt
    clearTimeout(reconnectTimeout);

    // Start periodic pings (every 30 seconds)
    pingInterval = setInterval(() => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  });

  websocket.addEventListener("message", (e) => {
    try {
      const message = JSON.parse(e.data);
      console.log("📨 Received:", message);
      htmlRenderer(message);
      statusUpdater(message);
    } catch (err) {
      console.error("JSON Parsing error:", err.message);
    }
  });

  websocket.addEventListener("close", () => {
    console.warn("⚠️ WebSocket disconnected. Retrying in 3 seconds...");
    clearInterval(pingInterval);
    reconnectTimeout = setTimeout(connectWebSocket, 3000);
  });

  websocket.addEventListener("error", (err) => {
    console.error("❌ WebSocket error:", err.message);
    websocket.close();
  });
}

// Start connection
connectWebSocket();

/* ---------------------------------------------------------
   DOM RENDERING LOGIC
--------------------------------------------------------- */

function statusUpdater(data) {
  const eventNameHtml = document.getElementById(`eventName-${data.deviceId}`);
  if (!eventNameHtml) return;

  const confirmationBtnHtml = `<button id="confirmation-button-${data.deviceId}" class="btn btn-primary" onClick="onClickConfirmation(${data.deviceId})">Confirm</button>`

  const eventStateHtml = document.getElementById(`eventState-${data.deviceId}`);
  const statusCircleHtml = document.getElementById(`statusCircle-${data.deviceId}`);

  // Update event name + color
  switch (data.eventName) {
    case "running":
      eventNameHtml.innerHTML = data.eventName;
      statusCircleHtml.className = "bg-success rounded-circle d-inline-block me-auto";
      break;
    case "stopping":
    case "sales_restrictions_age_restriction":
    case "help_request":
      eventNameHtml.innerHTML = data.eventName;
      statusCircleHtml.className = "bg-danger rounded-circle d-inline-block";
      break;
    case "state":
      eventNameHtml.innerHTML = "";
      statusCircleHtml.className = "bg-danger rounded-circle d-inline-block";
      break;
    default:
      eventNameHtml.innerHTML = data.eventName;
      statusCircleHtml.className = "bg-success rounded-circle d-inline-block me-auto";
  }

  // Update event state + color
  switch (data.eventState) {
    case "offline":
    case "OPEN":
      eventStateHtml.innerHTML = data.eventState;
      statusCircleHtml.className = "bg-danger rounded-circle d-inline-block me-auto";
      if (document.getElementById(`confirmation-button-${data.deviceId}`) == null) {
        statusCircleHtml.insertAdjacentHTML("afterend", confirmationBtnHtml);
      }
      break;
    case "RESOLVED":
      eventStateHtml.innerHTML = data.eventState;
      statusCircleHtml.className = "bg-success rounded-circle d-inline-block me-auto";
      break;
    default:
      eventStateHtml.innerHTML = "";
      statusCircleHtml.className = "bg-success rounded-circle d-inline-block me-auto";
  }

  clearState(data);
}

function clearState(data){
  const eventStateHtml = document.getElementById(`eventState-${data.deviceId}`);
  const eventNameHtml = document.getElementById(`eventName-${data.deviceId}`);
  const statusCircleHtml = document.getElementById(`statusCircle-${data.deviceId}`);

  switch(data.eventState) {
    case "offline":
    case "RESOLVED":
      setTimeout(() => {
        eventStateHtml.innerHTML = "";
        eventNameHtml.innerHTML = "";
        statusCircleHtml.className = "bg-success rounded-circle d-inline-block me-auto";
        if(document.getElementById(`confirmation-button-${data.deviceId}`).id == `confirmation-button-${data.deviceId}`){
          document.getElementById(`confirmation-button-${data.deviceId}`).remove();
        }
      }, 100000);
    break;
    default:
      console.log('Default');
  }
}

function htmlRenderer(data) {
  if (!data.deviceId) return;
  if (document.getElementById(`deviceId-${data.deviceId}`)) return;

  const deviceId = data.deviceId;
  const deviceContainerHtml = document.querySelector('#deviceContainer');
  const deviceIdHtml = document.createElement('h2');
  const eventNameHtml = document.createElement('p');
  const eventStateHtml = document.createElement('h4');
  const statusCircleHtml = document.createElement('span');
  const evntNameStatusHtml = document.createElement('div');
  const deviceIdContHtml = document.createElement('div');
  const noVNCHtml = document.createElement('iframe');

  noVNCHtml.src = `http://192.168.152.22:6080/vnc.html?autoconnect=1&password=trustNO1&resize=scale`;
  noVNCHtml.frameBorder = "0";
  noVNCHtml.height = "167";
  noVNCHtml.width = "310";
  noVNCHtml.title = "noVNC";
  noVNCHtml.className = 'pe-2'

  deviceIdHtml.id = `deviceId-${deviceId}`;
  eventNameHtml.id = `eventName-${deviceId}`;
  eventStateHtml.id = `eventState-${deviceId}`;
  statusCircleHtml.id = `statusCircle-${deviceId}`;
  evntNameStatusHtml.id = `evntNameStatus-${deviceId}`;
  deviceContainerHtml.id = `deviceIdContainer-${deviceId}`;

  deviceIdHtml.className = `me-4`;
  eventNameHtml.className = `me-2`;
  statusCircleHtml.className = `bg-success rounded-circle d-inline-block me-auto`;
  evntNameStatusHtml.className = `d-flex align-items-center mt-2 fw-bold`;
  deviceIdContHtml.className = `d-flex align-items-center border-bottom`;
  statusCircleHtml.style = "width: 1rem; height: 1rem;";

  deviceIdHtml.innerHTML = `SCO: ${deviceId}`;
  eventNameHtml.innerHTML = `Event Name ${deviceId}`;
  eventStateHtml.innerHTML = `Event State ${deviceId}`;

  deviceContainerHtml.appendChild(deviceIdContHtml);
  deviceIdContHtml.appendChild(deviceIdHtml);
  deviceIdContHtml.appendChild(statusCircleHtml);
  deviceContainerHtml.appendChild(evntNameStatusHtml);
  evntNameStatusHtml.appendChild(eventNameHtml);
  deviceContainerHtml.appendChild(eventStateHtml);
  deviceContainerHtml.appendChild(noVNCHtml);
}

function onClickConfirmation (data) {
  console.log("Clicked: ", data);
  const eventNameHtml = document.getElementById(`eventName-${data}`);
  const eventStateHtml = document.getElementById(`eventState-${data}`);
  const statusCircleHtml = document.getElementById(`statusCircle-${data}`);
  const confirmationBtnHtml = document.getElementById(`confirmation-button-${data}`);

  eventNameHtml.innerHTML = '';
  eventStateHtml.innerHTML = '';

  statusCircleHtml.className = 'bg-success rounded-circle d-inline-block me-auto';

  confirmationBtnHtml.remove();
}

async function ageRestrictionRequest () {
  try {
    const response = await fetch('/age-restriction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({message: "hello"})
    });
    if(!response.ok) {
      throw new Error(`HTTP error! Status: ${JSON.stringify(response.status)}`);
    }
    const data = await response.json();
    console.log(`Data: ${JSON.stringify(data)}`);
    return data
  } catch (error) {
    console.error(`Fetch error: ${JSON.stringify(error.message)}`);

    return null
  }
}

// htmlRenderer(message);
// statusUpdater(message);
