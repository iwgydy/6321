const axios = require('axios');

module.exports = {
  config: {
    name: "sms",
    version: "1.0.0",
    description: "ส่ง SMS สแปมตามจำนวนครั้งที่กำหนดแบบเร็วสุด",
    usage: "/sms <เบอร์ 10 หลัก> <จำนวนครั้ง>",
    aliases: ["sendsms", "spam"],
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    if (args.length < 2) {
      return api.sendMessage(senderID, `
✨ **คำสั่งเทพ SMS Spam** ✨
❌ รูปแบบไม่ถูกต้อง!
📜 ใช้: /sms <เบอร์ 10 หลัก> <จำนวนครั้ง>
💡 ตัวอย่าง: /sms 0987456321 50
      `);
    }

    const phone = args[0];
    const count = parseInt(args[1]);
    const startTime = Date.now();

    if (!/^\d{10}$/.test(phone)) {
      return api.sendMessage(senderID, `
⚠️ **ERROR DETECTED** ⚠️
📞 เบอร์โทรต้องเป็นตัวเลข 10 หลักเท่านั้น!
💢 ตัวอย่าง: 0987456321
      `);
    }
    if (isNaN(count) || count < 1) {
      return api.sendMessage(senderID, `
⚠️ **INVALID INPUT** ⚠️
🔢 จำนวนครั้งต้องเป็นตัวเลขและมากกว่า 0!
      `);
    }
    if (count > 500) {
      return api.sendMessage(senderID, `
🚫 **LIMIT EXCEEDED** 🚫
🔟 จำนวนครั้งต้องไม่เกิน 500!
      `);
    }

    const apiUrl = `http://de01.uniplex.xyz:1636/api/sms?phone=${phone}&count=${count}`;
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
    };

    try {
      // ส่งข้อความเริ่มต้น
      await api.sendMessage(senderID, `
🔥 **เริ่มการสแปม SMS สุดเท่** 🔥
📞 เป้าหมาย: ${phone}
🎯 จำนวนครั้ง: ${count}
⚡ ความเร็ว: สูงสุด (API เดียว)
👾 **ยิงโดย**: โทมัส
      `);

      // เรียก API ครั้งเดียว
      const response = await axios.get(apiUrl, { headers });
      const data = response.data;

      if (data.status !== "success") {
        throw new Error("API รายงานสถานะไม่สำเร็จ");
      }

      // ส่งข้อความสรุป
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      await api.sendMessage(senderID, `
🎉 **ผลการสแปม SMS สุดเจ๋ง** 🎉
📞 เบอร์: ${data.phone}
✅ ส่งสำเร็จ: ${data.success_count}/${data.total_count} ครั้ง
⏰ ใช้เวลาทั้งหมด: ${data.time_taken} วินาที (จาก API) | ${totalTime} วินาที (รวม)
💥 สถานะ: เสร็จสิ้นภารกิจ!
      `);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดใหญ่:", error.message);
      return api.sendMessage(senderID, `
💥 **SYSTEM FAILURE** 💥
❌ ไม่สามารถสแปม SMS ได้!
📢 เหตุผล: ${error.message}
⏲️ ลองใหม่ภายหลัง!
      `);
    }
  }
};
