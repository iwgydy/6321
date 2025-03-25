const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
  config: {
    name: 'setweatheralert'
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    // ตรวจสอบการป้อนค่าจากผู้ใช้
    if (args.length < 2) {
      return api.sendMessage(senderID, '⚠️ กรุณาระบุเมืองและช่วงเวลา เช่น /setweatheralert นครพนม 1h');
    }

    const city = args[0];
    const interval = args[1].toLowerCase();
    let intervalMs;

    // แปลงช่วงเวลาเป็นมิลลิวินาที
    try {
      if (interval.endsWith('m')) {
        intervalMs = parseInt(interval.slice(0, -1)) * 60 * 1000; // นาที
      } else if (interval.endsWith('h')) {
        intervalMs = parseInt(interval.slice(0, -1)) * 60 * 60 * 1000; // ชั่วโมง
      } else if (interval.endsWith('d')) {
        intervalMs = parseInt(interval.slice(0, -1)) * 24 * 60 * 60 * 1000; // วัน
      } else {
        throw new Error('ช่วงเวลาไม่ถูกต้อง');
      }
    } catch (error) {
      return api.sendMessage(senderID, '⚠️ ช่วงเวลาไม่ถูกต้อง กรุณาใช้รูปแบบเช่น 1m (นาที), 1h (ชั่วโมง), 1d (วัน)');
    }

    // จัดการไฟล์ bid.json
    const BID_FILE = path.join(__dirname, 'bid.json');
    let bidData = { alerts: {} };

    if (fs.existsSync(BID_FILE)) {
      try {
        bidData = JSON.parse(fs.readFileSync(BID_FILE, 'utf8'));
      } catch (error) {
        return api.sendMessage(senderID, '❌ เกิดข้อผิดพลาดในการอ่านไฟล์ bid.json');
      }
    }

    if (!bidData.alerts[senderID]) {
      bidData.alerts[senderID] = [];
    }

    // ลบการตั้งค่าเดิมสำหรับเมืองนี้ (ถ้ามี)
    const existingIndex = bidData.alerts[senderID].findIndex(alert => alert.city === city);
    if (existingIndex !== -1) {
      bidData.alerts[senderID].splice(existingIndex, 1);
    }

    // เพิ่มการตั้งค่าใหม่
    bidData.alerts[senderID].push({ city, intervalMs, lastSent: 0 });

    try {
      fs.writeFileSync(BID_FILE, JSON.stringify(bidData, null, 2));
    } catch (error) {
      return api.sendMessage(senderID, '❌ เกิดข้อผิดพลาดในการบันทึกไฟล์ bid.json');
    }

    api.sendMessage(senderID, `✅ ตั้งค่าแจ้งเตือนสภาพอากาศสำหรับ ${city} ทุกๆ ${interval} แล้ว`);

    // ดึงข้อมูลสภาพอากาศจาก API
    try {
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/weather?q=${encodeURIComponent(city)}`);
      const weatherData = response.data;

      // ส่งข้อความแจ้งเตือนสภาพอากาศ
      api.sendMessage(senderID, `🌤 สภาพอากาศปัจจุบันใน ${city}: ${weatherData.weather[0].description}`);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      api.sendMessage(senderID, '❌ ไม่สามารถดึงข้อมูลสภาพอากาศได้ กรุณาลองใหม่อีกครั้ง');
    }
  }
};
