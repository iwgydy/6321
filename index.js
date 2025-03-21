const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const app = express();
app.use(bodyParser.json());

const API_URL = 'https://bots.easy-peasy.ai/bot/9bc091b4-8477-4844-8b53-a354244f53e8/api';
const API_KEY = '5528a40e-e4cc-4414-bb01-995f43a55949';
const headers = {
  'content-type': 'application/json',
  'x-api-key': API_KEY
};

const VERIFY_TOKEN = 'mysecretoken';
const PAGE_ACCESS_TOKEN = '';

global.autoReplyEnabled = false;
global.users = new Set();
global.botStartTime = new Date();
global.processedMessages = new Set();

const commands = new Map();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.config.name, command);
}

function sendTypingIndicator(sender, action = 'typing_on') {
  return new Promise((resolve, reject) => {
    request({
      url: 'https://graph.facebook.com/v19.0/me/messages',
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: 'POST',
      json: {
        recipient: { id: sender },
        sender_action: action
      }
    }, (error, response, body) => {
      if (error) reject(error);
      else if (body.error) reject(body.error);
      else resolve();
    });
  });
}

async function sendMessage(sender, text) {
  try {
    await sendTypingIndicator(sender, 'typing_on');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return new Promise((resolve, reject) => {
      request({
        url: 'https://graph.facebook.com/v19.0/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
          recipient: { id: sender },
          message: { text: text },
        }
      }, async (error, response, body) => {
        if (error) reject(error);
        else if (body.error) reject(body.error);
        else {
          await sendTypingIndicator(sender, 'typing_off');
          resolve(body);
        }
      });
    });
  } catch (error) {
    console.log(`Error in sendMessage: ${error.message}`);
  }
}

async function sendVideo(sender, videoUrl) {
  try {
    console.log(`Preparing to send video to ${sender}: ${videoUrl}`);
    await sendTypingIndicator(sender, 'typing_on');
    const messageData = {
      attachment: {
        type: "video",
        payload: {
          url: videoUrl,
          is_reusable: true
        }
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      request({
        url: 'https://graph.facebook.com/v19.0/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
          recipient: { id: sender },
          message: messageData,
        }
      }, (error, response, body) => {
        if (error) reject(error);
        else if (body.error) reject(body.error);
        else resolve(body);
      });
    });
    
    await sendTypingIndicator(sender, 'typing_off');
    console.log(`Video sent successfully to ${sender}: ${videoUrl}`);
    return response;
  } catch (error) {
    console.log(`Error in sendVideo: ${error.message}`);
    await sendTypingIndicator(sender, 'typing_off');
    throw error;
  }
}

async function sendAudio(sender, audioUrl) {
  try {
    console.log(`Preparing to send audio to ${sender}: ${audioUrl}`);
    await sendTypingIndicator(sender, 'typing_on');
    const messageData = {
      attachment: {
        type: "audio",
        payload: {
          url: audioUrl,
          is_reusable: true
        }
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      request({
        url: 'https://graph.facebook.com/v19.0/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
          recipient: { id: sender },
          message: messageData,
        }
      }, (error, response, body) => {
        if (error) reject(error);
        else if (body.error) reject(body.error);
        else resolve(body);
      });
    });
    
    await sendTypingIndicator(sender, 'typing_off');
    console.log(`Audio sent successfully to ${sender}: ${audioUrl}`);
    return response;
  } catch (error) {
    console.log(`Error in sendAudio: ${error.message}`);
    await sendTypingIndicator(sender, 'typing_off');
    throw error;
  }
}

async function uploadAttachment(sender, filePath) {
  try {
    const form = new FormData();
    form.append('recipient', JSON.stringify({ id: sender }));
    form.append('message', JSON.stringify({
      attachment: {
        type: "image",
        payload: { is_reusable: true }
      }
    }));
    form.append('filedata', fs.createReadStream(filePath));

    const response = await axios.post(
      'https://graph.facebook.com/v19.0/me/messages?access_token=' + PAGE_ACCESS_TOKEN,
      form,
      { headers: form.getHeaders() }
    );

    console.log(`Image uploaded successfully to ${sender}`);
    return response.data;
  } catch (error) {
    console.log(`Error uploading image: ${error.message}`);
    throw error;
  }
}

async function callBotAPI(sender, message) {
  try {
    const response = await axios.post(API_URL, {
      message: message,
      history: [],
      stream: false,
      include_sources: false
    }, { headers, timeout: 10000 });
    
    const reply = response.data.bot?.text || "ไม่ได้รับคำตอบจาก API";
    await sendMessage(sender, reply);
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    await sendMessage(sender, "❌ ไม่สามารถติดต่อ API ได้");
  }
}

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong token');
  }
});

app.post('/webhook', async (req, res) => {
  const entries = req.body.entry;
  if (!entries || !entries[0] || !entries[0].messaging) {
    console.log('Webhook received on port 443!');
    return res.send('Webhook received!');
  }

  let messaging_events = entries[0].messaging;
  for (let event of messaging_events) {
    let sender = event.sender.id;
    global.users.add(sender);

    if (event.message && event.message.text && event.message.mid) {
      let messageId = event.message.mid;
      if (global.processedMessages.has(messageId)) {
        console.log(`Skipping duplicate message ID: ${messageId}`);
        continue;
      }
      global.processedMessages.add(messageId);

      let text = event.message.text.trim();
      console.log(`Received message from ${sender}: ${text} (MID: ${messageId})`);

      if (text.startsWith('/')) {
        const args = text.slice(1).split(' ');
        const commandName = args[0].toLowerCase();
        const commandArgs = args.slice(1);
        
        const command = commands.get(commandName);
        if (command) {
          try {
            await command.run({ 
              api: { sendMessage, sendVideo, sendAudio, uploadAttachment }, 
              event: { senderID: sender, text, messageId }, 
              args: commandArgs, 
              autoReplyEnabled: global.autoReplyEnabled,
              commands,
              sendTypingIndicator
            });
          } catch (error) {
            console.log(`Error running command ${commandName}: ${error.message}`);
            await sendMessage(sender, "❌ เกิดข้อผิดพลาดในการรันคำสั่ง");
          }
        } else {
          await sendMessage(sender, "❌ ไม่รู้จักคำสั่งนี้");
        }
      } else {
        await callBotAPI(sender, text);
      }
    }
  }
  res.sendStatus(200);
});

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// HTTPS Server configuration
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/sujwodjnxnavwwck.vipv2boxth.xyz/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/sujwodjnxnavwwck.vipv2boxth.xyz/fullchain.pem')
};

// Start HTTP server on port 3000
app.listen(3000, () => console.log('Server is running on port 3000'));

// Start HTTPS server on port 443
https.createServer(options, app).listen(443, () => {
  console.log('Webhook server running on port 443 (HTTPS)');
});
