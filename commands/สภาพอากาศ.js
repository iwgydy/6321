const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'setweatheralert'
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;
    if (args.length < 2) {
      return api.sendMessage(senderID, 'กรุณาระบุเมืองและช่วงเวลา เช่น /setweatheralert นครพนม 1h');
    }

    const city = args[0];
    const interval = args[1].toLowerCase();
    let intervalMs;

    // แปลงช่วงเวลาเป็นมิลลิวินาที
    if (interval.endsWith('m')) {
      intervalMs = parseInt(interval.slice(0, -1)) * 60 * 1000; // นาที
    } else if (interval.endsWith('h')) {
      intervalMs = parseInt(interval.slice(0, -1)) * 60 * 60 * 1000; // ชั่วโมง
    } else if (interval.endsWith('d')) {
      intervalMs = parseInt(interval.slice(0, -1)) * 24 * 60 * 60 * 1000; // วัน
    } else {
      return api.sendMessage(senderID, 'ช่วงเวลาไม่ถูกต้อง กรุณาใช้รูปแบบเช่น 1m (นาที), 1h (ชั่วโมง), 1d (วัน)');
    }

    // จัดการไฟล์ bid.json
    const BID_FILE = path.join(__dirname, 'bid.json');
    let bidData = {};
    if (fs.existsSync(BID_FILE)) {
      bidData = JSON.parse(fs.readFileSync(BID_FILE, 'utf8'));
    } else {
      bidData = { alerts: {} };
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
    fs.writeFileSync(BID_FILE, JSON.stringify(bidData, null, 2));

    await api.sendMessage(senderID, `ตั้งค่าแจ้งเตือนสภาพอากาศสำหรับ ${city} ทุกๆ ${interval} แล้ว (แทนที่การตั้งค่าเดิมถ้ามี)`);
  }
};
