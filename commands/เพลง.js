const axios = require('axios');

module.exports = {
  config: {
    name: "music",
    description: "ค้นหาและส่งเพลงจาก API สุดล้ำ พร้อมรายละเอียดเวลาและขนาด",
    usage: "/music <ชื่อเพลง>",
  },

  run: async ({ api, event, args }) => {
    const { sendMessage, sendAudio } = api;
    const { senderID } = event;

    if (!args.length) {
      return sendMessage(senderID, `
⚠️ **SYSTEM ALERT** ⚠️
🔴 กรุณาระบุชื่อเพลง!
📡 ตัวอย่าง: /music เธอ
      `);
    }

    const query = encodeURIComponent(args.join(" "));
    const searchUrl = `http://de01.uniplex.xyz:1636/api/search?query=${query}`;
    const startTime = Date.now(); // เริ่มจับเวลา

    try {
      await sendMessage(senderID, `
🌌 **MUSIC CORE ACTIVATED** 🌌
🔍 ระบบกำลังสแกนหา: "${args.join(" ")}"
⚡ STATUS: Processing...
      `);

      const response = await axios.get(searchUrl);
      const data = response.data;

      if (data.status !== "success" || !data.downloadUrl) {
        return sendMessage(senderID, `
💥 **ERROR DETECTED** 💥
❌ ไม่พบเพลงในฐานข้อมูล
📡 ลองตรวจสอบชื่อเพลงอีกครั้ง!
      `);
      }

      const audioUrl = data.downloadUrl;

      // ดาวน์โหลดไฟล์เพื่อคำนวณขนาด
      const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(audioResponse.data, 'binary');
      const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2); // ขนาดไฟล์ใน MB
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2); // เวลาที่ใช้ในวินาที

      await sendMessage(senderID, `
🎧 **AUDIO LOCKED ON** 🎧
✅ เพลง "${args.join(" ")}" พร้อมแล้ว!
📊 **ข้อมูลเพิ่มเติม**:
⏱️ เวลาที่ใช้: ${totalTime} วินาที
💾 ขนาดไฟล์: ${fileSizeMB} MB
🌠 กำลังส่งสัญญาณดาวน์โหลด...
      `);

      await sendAudio(senderID, audioUrl);

      await sendMessage(senderID, `
🚀 **TRANSMISSION COMPLETE** 🚀
🎶 เพลงถูกส่งถึงคุณแล้ว!
⏱️ ใช้เวลา: ${totalTime} วินาที | 💿 ขนาด: ${fileSizeMB} MB
💾 สนุกกับการฟังนะ!
      `);
    } catch (error) {
      console.log(`⚠️ Error in music command: ${error.message}`);
      await sendMessage(senderID, `
🛑 **SYSTEM CRASH** 🛑
🔧 เกิดข้อผิดพลาดขณะประมวลผล
📢 รายละเอียด: ${error.message}
🔄 ลองใหม่อีกครั้ง!
      `);
    }
  },
};
