const https = require('https');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');

const app = express();
app.use(bodyParser.json());

// การตั้งค่า HTTPS โดยใช้ Let's Encrypt certificates
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/sujwodjnxnavwwck.vipv2boxth.xyz/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/sujwodjnxnavwwck.vipv2boxth.xyz/fullchain.pem')
};

// API configuration for all bots
const BOTS = {
  friend: {
    API_URL: 'https://bots.easy-peasy.ai/bot/9bc091b4-8477-4844-8b53-a354244f53e8/api',
    API_KEY: '5528a40e-e4cc-4414-bb01-995f43a55949'
  },
  lover: {
    API_URL: 'https://bots.easy-peasy.ai/bot/75c584ca-25a4-4b85-8d4d-31cf40ed01ae/api',
    API_KEY: '3df1ec92-324a-44ff-bbc9-55add33842fa'
  },
  sister: {
    API_URL: 'https://bots.easy-peasy.ai/bot/cccb9d31-6f20-4550-bbd7-7d125d76680c/api',
    API_KEY: 'd9a1294a-0c77-489b-9ba8-c09dc8039518'
  },
  brother: {
    API_URL: 'https://bots.easy-peasy.ai/bot/f789b0e4-5e58-4f9b-8241-d5b8e8e33a7f/api',
    API_KEY: '9c3eb2d5-34ae-47ed-a8f6-3732c157ad1c'
  },
  sister2: {
    API_URL: 'https://bots.easy-peasy.ai/bot/78484977-0062-4560-8dd0-a4cec104a69e/api',
    API_KEY: '0e98b7f5-3ea7-4166-9089-0cced9de7e34'
  },
  brother2: {
    API_URL: 'https://bots.easy-peasy.ai/bot/36e79163-0e87-4590-8de0-ed7164299f1c/api',
    API_KEY: '355e1823-6fca-49e7-9b09-6067274ba060'
  }
};

const headers = (botType) => ({
  'content-type': 'application/json',
  'x-api-key': BOTS[botType].API_KEY
});

const VERIFY_TOKEN = 'mysecretoken';
const PAGE_ACCESS_TOKEN = 'EAA69YPCejwEBO7C9mqFloc55x3wrytcTLZAjg6ZAWf7IvXTisxjBtFvi0cMH1FQoVQ45aOqxI0qCDCBbxRf1vlo0cY7qDQaeWlgkmM7ZANEbBCHhkGPGB2N6vJ3g0Qk4oQhYE47fwspRKAEqp8SmHh3ZBhmQNqbyA7POIsbtIaZAkbFDMGZAbOGVBm5wDI5bnjOAZDZD';

global.autoReplyEnabled = false;
global.users = new Set();
global.botStartTime = new Date();
global.processedMessages = new Set();

const DATA_FILE = path.join(__dirname, 'df.json');

let userData = {};
if (fs.existsSync(DATA_FILE)) {
  userData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} else {
  userData = { users: {} };
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

const userHistory = new Map();
const lastMessageTime = {};

function saveUserData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

function getUserData(sender) {
  if (!userData.users[sender]) {
    userData.users[sender] = {
      selectedBot: 'friend'
    };
    saveUserData();
  }
  return userData.users[sender];
}

function getUserHistory(sender, botType) {
  const userKey = `${sender}:${botType}`;
  if (!userHistory.has(userKey)) {
    userHistory.set(userKey, []);
  }
  return userHistory.get(userKey);
}

function updateUserHistory(sender, botType, newHistory) {
  const userKey = `${sender}:${botType}`;
  userHistory.set(userKey, newHistory);
}

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
    const user = getUserData(sender);
    const botType = user.selectedBot;
    const history = getUserHistory(sender, botType);

    history.push({ type: 'human', text: message });

    const response = await axios.post(BOTS[botType].API_URL, {
      message: message,
      history: history,
      stream: false,
      include_sources: false
    }, { headers: headers(botType), timeout: 10000 });

    const reply = response.data.bot?.text || "ไม่ได้รับคำตอบจาก API";
    history.push({ type: 'ai', text: reply });
    updateUserHistory(sender, botType, history);

    await sendMessage(sender, reply);
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    await sendMessage(sender, "❌ ไม่สามารถติดต่อ API ได้");
  }
}

const inactiveMessages = {
  friend: "เฮ้! ไม่ได้คุยกันนานเลยนะ คิดถึงจัง",
  lover: "ที่รัก ไม่ได้คุยกันนานเลยนะ คิดถึงมากๆ เลย",
  sister: "พี่จ๋า ไม่ได้คุยกันนานเลยนะ คิดถึงพี่จัง",
  brother: "พี่ชาย ไม่ได้คุยกันนานเลยนะ คิดถึงพี่มากๆ เลย",
  sister2: "น้องสาว ไม่ได้คุยกันนานเลยนะ คิดถึงน้องจัง",
  brother2: "น้องชาย ไม่ได้คุยกันนานเลยนะ คิดถึงน้องมากๆ เลย"
};

async function checkInactiveUsers() {
  const now = Date.now();
  for (const sender of global.users) {
    const lastTime = lastMessageTime[sender] || 0;
    if (now - lastTime > 86400000) {
      const user = getUserData(sender);
      const botType = user.selectedBot;
      const message = inactiveMessages[botType];
      await sendMessage(sender, message);
      lastMessageTime[sender] = now;
    }
  }
}

setInterval(checkInactiveUsers, 3600000);

commands.set('selectbot', {
  config: {
    name: 'selectbot'
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;
    if (!args[0]) {
      return api.sendMessage(senderID, 'กรุณาระบุประเภทบอท: /selectbot friend หรือ /selectbot lover หรือ /selectbot sister หรือ /selectbot brother หรือ /selectbot sister2 หรือ /selectbot brother2');
    }

    const botType = args[0].toLowerCase();
    if (!BOTS[botType]) {
      return api.sendMessage(senderID, 'ประเภทบอทไม่ถูกต้อง โปรดเลือก: /selectbot friend (เพื่อน) | /selectbot lover (แฟน) | /selectbot sister (น้องสาว) | /selectbot brother (น้องชาย) | /selectbot sister2 (พี่สาว) | /selectbot brother2 (พี่ชาย)');
    }

    const user = getUserData(senderID);
    user.selectedBot = botType;
    saveUserData();

    const botName = botType === 'friend' ? 'ฟิวเพื่อน' : botType === 'lover' ? 'ฟิวแฟน' : botType === 'sister' ? 'ฟิวน้องสาว' : botType === 'brother' ? 'ฟิวน้องชาย' : botType === 'sister2' ? 'ฟิวพี่สาว' : 'ฟิวพี่ชาย';
    await api.sendMessage(senderID, `เลือกบอท ${botName} แล้ว! ลองคุยได้เลย 😊`);
  }
});

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong token');
  }
});

app.post('/webhook', async (req, res) => {
  console.log('Webhook received!');
  const entries = req.body.entry;
  if (!entries || !entries[0] || !entries[0].messaging) {
    return res.sendStatus(200);
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

      lastMessageTime[sender] = Date.now();

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
  res.send('Webhook received!');
});

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// รันเซิร์ฟเวอร์ด้วย HTTPS บนพอร์ต 443
https.createServer(options, app).listen(443, () => {
  console.log('Webhook server running on port 443 (HTTPS)');
});
