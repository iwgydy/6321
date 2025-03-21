const axios = require('axios');

module.exports = {
  config: {
    name: "music",
    description: "ค้นหาและส่งเพลงจาก API ด้วยพลังไฮเทค",
    usage: "/music <ชื่อเพลง>"
  },

  run: async ({ api, event, args }) => {
    const { sendMessage, sendAudio } = api;
    const { senderID } = event;

    if (!args.length) {
      return sendMessage(senderID, `
╔═════[ ⚡ MUSIC SYSTEM ⚡ ]═════╗
║ ❌  ERROR: NO QUERY DETECTED!  ║
║ 🔧 กรุณาระบุชื่อเพลง          ║
║ 📡 ตัวอย่าง: /music เธอ       ║
╚══════════════════════════════╝
      `);
    }

    const query = encodeURIComponent(args.join(" "));
    const searchUrl = `http://de01.uniplex.xyz:1636/api/search?query=${query}`;

    try {
      await sendMessage(senderID, `
╔═════[ 🎵 MUSIC CORE 🎵 ]═════╗
║ 🚀 ระบบกำลังสแกนหาเพลง...   ║
║ 🔍 คำสั่ง: ${args.join(" ")}  ║
║ ⚡ Powered by โทมัส ║
╚══════════════════════════════╝
      `);

      const response = await axios.get(searchUrl);
      const data = response.data;

      if (data.status !== "success" || !data.downloadUrl) {
        return sendMessage(senderID, `
╔═════[ ⚠️ SYSTEM ALERT ⚠️ ]════╗
║ ❌ 404: MUSIC NOT FOUND!      ║
║ 📡 ไม่พบเพลงในฐานข้อมูล      ║
║ 🔄 ลองค้นหาด้วยคำอื่น        ║
╚══════════════════════════════╝
        `);
      }

      const audioUrl = data.downloadUrl;
      await sendMessage(senderID, `
╔═════[ 🎧 AUDIO DETECTED 🎧 ]════╗
║ ✅ เพลงพร้อมแล้ว!               ║
║ 🎵 ชื่อไฟล์: ${data.filename}   ║
║ ⚡ กำลังส่งสัญญาณ音波...       ║
╚═══════════════════════════════╝
      `);

      await sendAudio(senderID, audioUrl);
      await sendMessage(senderID, `
╔═════[ 🎶 MISSION COMPLETE 🎶 ]════╗
║ ✅ การส่งเพลงสำเร็จ!             ║
║ 🚀 สนุกกับดนตรีสุดล้ำได้เลย!    ║
║ ⚡ MUSIC SYSTEM v1.0 - โทมัส       ║
╚═════════════════════════════════╝
      `);
    } catch (error) {
      console.log(`[ERROR] Music Command Failed: ${error.message}`);
      await sendMessage(senderID, `
╔═════[ 💥 SYSTEM CRASH 💥 ]════╗
║ ❌ CRITICAL ERROR DETECTED!   ║
║ 📢 รายละเอียด: ${error.message} ║
║ 🔧 กรุณาลองใหม่ภายหลัง       ║
╚══════════════════════════════╝
      `);
    }
  }
};
