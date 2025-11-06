const { Kafka } = require('kafkajs');
const { WebSocketServer } = require('ws');
const EventEmitter = require('events');
const express = require('express');

const app = express();
const wss = new WebSocketServer({ host: '192.168.2.172', port: 8181 });
const emitter = new EventEmitter();
emitter.setMaxListeners(15);

/**
 * Publishes public directory to Port 3000
 */
app.use(express.static('public'));
app.listen(3000, () => console.log('HTTP server running on port 3000'));

/**
 * Kafka configuration
 */
const kafka = new Kafka({
  clientId: 'racetrac',
  brokers: ['127.0.0.1:9092'],
  connectionTimeout: 10000,
  requestTimeout: 60000,
  retry: {
    initialRetryTime: 500,
    retries: 10,
    factor: 0.2,
  },
});

const topic = 'store.events';
let lastMessage = null; // Cache the last message in memory

// Main, long-running Kafka consumer
const consumer = kafka.consumer({
  groupId: 'racetrac-streamer',
  heartbeatInterval: 3000,
  sessionTimeout: 30000,
  rebalanceTimeout: 60000,
});

const producer = kafka.producer({
  groupId: 'racetrac-streamer',
  heartbeatInterval: 3000,
  sessionTimeout: 30000,
  rebalanceTimeout: 60000,
});


/**
 * Utility: Fetch the latest Kafka message (for initial client load only)
 */
async function fetchLastKafkaMessage() {
  const admin = kafka.admin();
  await admin.connect();

  try {
    const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
    if (metadata.topics.length === 0) {
      console.warn(`Topic "${topic}" not found`);
      return null;
    }

    const offsets = await admin.fetchTopicOffsets(topic);
    const partitionOffsets = offsets.map(({ partition, high }) => ({
      partition,
      offset: Math.max(parseInt(high, 10) - 1, 0),
    }));

    const tempConsumer = kafka.consumer({
      groupId: `fetcher-${Date.now()}`,
    });
    await tempConsumer.connect();
    await tempConsumer.subscribe({ topic, fromBeginning: false });

    let messageValue = null;
    const runPromise = new Promise((resolve) => {
      tempConsumer.run({
        eachMessage: async ({ partition, message }) => {
          messageValue = message.value.toString();
          console.log(`Fetched last message from partition ${partition}:`, messageValue);
          resolve();
        },
      });
    });

    for (const { partition, offset } of partitionOffsets) {
      tempConsumer.seek({ topic, partition, offset: offset.toString() });
    }

    await runPromise;
    await tempConsumer.disconnect();
    return messageValue;
  } catch (err) {
    console.error('Error fetching last Kafka message:', err);
    return null;
  } finally {
    await admin.disconnect();
  }
}

/**
 * Kafka Consumer for real-time streaming
 */
async function startKafkaConsumer() {
  try {
    await consumer.connect();
    console.log('Connected to Kafka broker');
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      autoCommit: true,
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value.toString();
        lastMessage = value; // Update cache

        console.log(`Streaming Kafka message:`, value);

        // Broadcast to all connected WebSocket clients
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(value);
          }
        });
      },
    });
  } catch (err) {
    console.error('Kafka Consumer Error:', err);
    // Attempt reconnect
    setTimeout(() => {
      console.log('Reconnecting Kafka consumer...');
      startKafkaConsumer().catch(console.error);
    }, 5000);
  }
}

/**
 * WebSocket Handling
 */
wss.on('connection', async (ws) => {
  console.log('WebSocket client connected');

  // Send the most recent Kafka message first
  try {
    if (!lastMessage) {
      lastMessage = await fetchLastKafkaMessage();
    }
    if (lastMessage) {
      ws.send(lastMessage);
      console.log('Sent latest Kafka message to new client');
    } else {
      console.log('No previous message found in topic.');
    }
  } catch (err) {
    console.error('Error fetching last Kafka message:', err);
  }

  ws.on('close', () => console.log('WebSocket client disconnected'));
});

/**
 * Start the persistent Kafka consumer
 */
startKafkaConsumer();

/**
 * Graceful shutdown handlers
 */
process.on('unhandledRejection', async (err) => {
  console.error('Unhandled Rejection:', err);
  try {
    await consumer.disconnect();
  } finally {
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('Disconnecting Kafka consumer...');
  try {
    await consumer.disconnect();
  } finally {
    process.exit();
  }
});

async function ageRestrictionMessage() {
  try {
    await producer.connect();
    await producer.send({
      topic: 'store.commands',
      messages: [{
        "tenantId" : "002",
        "businessUnitId" : "2721",
        "deviceId": "111",
        "deviceType": "SCO",
        "deviceGroup": "Default",
        "eventState": "RESOLVED",
        "eventName": "sales_restrictions_age_restriction"
      }]
    })
    console.log("Message sent Successfully");
  } catch(error) {
    console.log(error);
    console.error(`Error sending message: ${JSON.stringify(error)}`);
  }
}

app.post('/age-restriction', (req, res) => {
  // console.log(req);
  ageRestrictionMessage();
  res.status(201).json({message: "Success"});
});

