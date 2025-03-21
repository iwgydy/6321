const crypto = require('crypto');
const fetch = require('node-fetch'); // ต้องติดตั้ง node-fetch ถ้ายังไม่มี

module.exports = {
  config: {
    name: "spamngl",
    version: "1.1.0",
    description: "ยิงข้อความไปยัง NGL.Link แบบกำหนดจำนวนครั้ง",
    usage: "/spamngl <ชื่อผู้ใช้> <จำนวนครั้ง> <ข้อความ>",
    aliases: ["nglspammer", "spam"],
  },

  run: async ({ api, event, args }) => {
    const { senderID } = event;

    // ตรวจสอบการป้อนข้อมูล
    if (args.length < 3 || isNaN(args[1])) {
      return api.sendMessage(senderID, `
╔═════[ ⚡ SPAM SYSTEM ⚡ ]═════╗
║ ❌  ERROR: INVALID INPUT!    ║
║ 🔧 ใช้: /spamngl <user> <จำนวน> <msg> ║
║ 📡 ตัวอย่าง: /spamngl jnl84780 10 สวัสดี ║
╚══════════════════════════════╝
      `);
    }

    const user = args[0];
    const maxAmount = parseInt(args[1]); // จำนวนครั้งที่ต้องการยิง
    const message = args.slice(2).join(" ");
    let currentAmount = 0;

    // ฟังก์ชันสำหรับรับเวลา
    const getTimeNow = () => {
      const date = new Date();
      return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    };

    // ส่งข้อความเริ่มต้น
    await api.sendMessage(senderID, `
╔═════[ 🚀 SPAM CORE ACTIVATED 🚀 ]═════╗
║ 🎯 เป้าหมาย: ${user}                 ║
║ ✉️ ข้อความ: ${message}               ║
║ 🔢 จำนวน: ${maxAmount} ครั้ง          ║
║ ⚡ ระบบเริ่มยิงอัตโนมัติ...          ║
║ 👾 Created by โทมัส                  ║
╚══════════════════════════════════════╝
    `);

    // ฟังก์ชัน Spam
    const Spam_Ngl = async () => {
      while (currentAmount < maxAmount) {
        try {
          const deviceId = crypto.randomBytes(30).toString('hex');
          const url = 'https://ngl.link/api/submit';
          const headers = {
            'accept': '*/*',
            'accept-language': 'th-TH,th;q=0.9',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'origin': 'https://ngl.link',
            'referer': `https://ngl.link/${user}`,
            'sec-fetch-mode': 'cors',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'x-requested-with': 'XMLHttpRequest'
          };
          const body = `username=${user}&question=${message}&deviceId=${deviceId}&gameSlug=&referrer=`;

          const response = await fetch(url, {
            method: "POST",
            headers,
            body,
            mode: "cors"
          });

          if (response.status === 200) {
            currentAmount++;
          } else {
            await new Promise(resolve => setTimeout(resolve, 25000)); // รอ 25 วินาทีถ้าเกินลิมิต
          }
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // รอ 5 วินาทีถ้ามีข้อผิดพลาด
        }
      }

      // เมื่อยิงครบจำนวน
      const time_now = getTimeNow();
      await api.sendMessage(senderID, `
╔═════[ 🎉 MISSION COMPLETE 🎉 ]════╗
║ ✅ ยิงครบ: ${currentAmount}/${maxAmount} ครั้ง ║
║ 🎯 เป้าหมาย: ${user}             ║
║ ✉️ ข้อความ: ${message}           ║
║ ⏰ เสร็จสิ้น: ${time_now}         ║
║ 👾 Created by โทมัส              ║
╚══════════════════════════════════╝
      `);
    };

    // เริ่มการยิง
    Spam_Ngl();
  }
};
