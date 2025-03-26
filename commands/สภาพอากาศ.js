const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Path to store user preferences
const DATA_FILE = path.join(__dirname, '../kds.json');
// Temporary directory for GIF
const TEMP_DIR = path.join(__dirname, '../temp');
const GIF_URL = 'https://i.pinimg.com/originals/49/cd/d8/49cdd838e8c6d7fe5e2dd55deead5567.gif';
const GIF_PATH = path.join(TEMP_DIR, 'weather.gif');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Load or initialize kds.json
let userData = {};
if (fs.existsSync(DATA_FILE)) {
  userData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} else {
  userData = { users: {} };
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

function saveUserData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
}

// Download GIF if it doesn't exist
async function downloadGif() {
  if (!fs.existsSync(GIF_PATH)) {
    const response = await axios({
      url: GIF_URL,
      method: 'GET',
      responseType: 'stream'
    });
    const writer = fs.createWriteStream(GIF_PATH);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}

module.exports = {
  config: {
    name: 'สภาพอากาศ'
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;
    const city = args[0] || 'นครพนม'; // Default city
    const intervalStr = args[1] || '1นาที'; // Default interval
    const dayOffsetStr = args[2] || '0วัน'; // Default to today (0 days)

    // Parse interval (e.g., "5นาที", "2ชั่วโมง", "10วัน")
    const intervalMatch = intervalStr.match(/^(\d+)(นาที|ชั่วโมง|วัน)$/);
    let intervalMs;
    if (intervalMatch) {
      const value = parseInt(intervalMatch[1]);
      const unit = intervalMatch[2];
      if (unit === 'นาที') intervalMs = value * 60000;
      else if (unit === 'ชั่วโมง') intervalMs = value * 3600000;
      else if (unit === 'วัน') intervalMs = value * 86400000;
    } else {
      intervalMs = 60000; // Default to 1 minute if invalid
    }

    // Parse day offset (e.g., "2วัน" -> 2)
    const dayOffsetMatch = dayOffsetStr.match(/^(\d+)วัน$/);
    const dayOffset = dayOffsetMatch ? parseInt(dayOffsetMatch[1]) : 0;

    // Function to send weather update with GIF
    const sendWeatherUpdate = async () => {
      try {
        const response = await axios.get(`https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(city)}`);
        const weatherData = response.data['0']; // Use first entry

        if (weatherData && weatherData.forecast) {
          const forecast = weatherData.forecast[dayOffset] || weatherData.forecast[0]; // Fallback to today
          const current = weatherData.current;

          const textMessage = `
🌌✨ **สถานีอากาศไฮเทค: ${weatherData.location.name}** ✨🌌
📡 **ข้อมูลวันที่:** ${forecast.date} (${forecast.day})
------------------------------------------------
${dayOffset === 0 ? `🌡️ **อุณหภูมิขณะนี้:** ${current.temperature}°C (รู้สึกเหมือน ${current.feelslike}°C)` : ''}
${dayOffset === 0 ? `☁️ **สภาพท้องฟ้าขณะนี้:** ${current.skytext}` : ''}
${dayOffset === 0 ? `💧 **ความชื้นขณะนี้:** ${current.humidity}%` : ''}
${dayOffset === 0 ? `🌬️ **ความเร็วลมขณะนี้:** ${current.windspeed}` : ''}
------------------------------------------------
📅 **พยากรณ์${dayOffset === 0 ? 'วันนี้' : `อีก ${dayOffset} วัน`}:**
   ➡️ **ต่ำสุด:** ${forecast.low}°C | **สูงสุด:** ${forecast.high}°C
   ➡️ **สภาพ:** ${forecast.skytextday} | **โอกาสฝน:** ${forecast.precip}%
------------------------------------------------
⚙️ **ระบบอัจฉริยะ:** อัปเดตทุก ${intervalStr}
          `;

          // Send text message
          await api.sendMessage(senderID, textMessage);

          // Ensure GIF is downloaded
          await downloadGif();

          // Send GIF using uploadAttachment
          await api.uploadAttachment(senderID, GIF_PATH);
        } else {
          await api.sendMessage(senderID, '❌ **ERROR 404:** ไม่พบข้อมูลสภาพอากาศสำหรับเมืองนี้');
        }
      } catch (error) {
        console.log(`Weather API or GIF Error: ${error.message}`);
        await api.sendMessage(senderID, '❌ **SYSTEM FAILURE:** ไม่สามารถดึงข้อมูลสภาพอากาศหรือส่ง GIF ได้');
      }
    };

    // Stop weather updates if requested
    if (args[0] && args[0].toLowerCase() === 'ปิด') {
      if (global.weatherIntervals && global.weatherIntervals[senderID]) {
        clearInterval(global.weatherIntervals[senderID]);
        delete global.weatherIntervals[senderID];
        delete userData.users[senderID];
        saveUserData();
        await api.sendMessage(senderID, '🛑 **SHUTDOWN COMPLETE:** หยุดการแจ้งเตือนสภาพอากาศแล้ว');
      } else {
        await api.sendMessage(senderID, '⚠️ **WARNING:** ไม่มีการแจ้งเตือนสภาพอากาศที่ทำงานอยู่');
      }
      return;
    }

    // Initialize global.weatherIntervals if it doesn't exist
    if (!global.weatherIntervals) {
      global.weatherIntervals = {};
    }

    // If already running for this user, inform them
    if (global.weatherIntervals[senderID]) {
      await api.sendMessage(senderID, '⚠️ **SYSTEM ACTIVE:** การแจ้งเตือนสภาพอากาศกำลังทำงานอยู่แล้ว ใช้ "/สภาพอากาศ ปิด" เพื่อหยุด');
      return;
    }

    // Save user preferences to kds.json
    userData.users[senderID] = {
      city: city,
      interval: intervalStr,
      intervalMs: intervalMs,
      dayOffset: dayOffset
    };
    saveUserData();

    // Send initial weather update with GIF
    await sendWeatherUpdate();

    // Set up interval for updates
    const intervalId = setInterval(sendWeatherUpdate, intervalMs);
    global.weatherIntervals[senderID] = intervalId;

    await api.sendMessage(senderID, `
🚀 **WEATHER SYSTEM ONLINE**
📍 **เมือง:** ${city}
⏱️ **อัปเดตทุก:** ${intervalStr}
📅 **วันที่เลือก:** ${dayOffset === 0 ? 'วันนี้' : `อีก ${dayOffset} วัน`}
✅ ระบบเริ่มทำงานแล้ว! ใช้ "/สภาพอากาศ ปิด" เพื่อหยุด
    `);
  }
};
