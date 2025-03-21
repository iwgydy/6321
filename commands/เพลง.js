const axios = require('axios');

module.exports = {
  config: {
    name: "music",
    description: "ค้นหาและส่งเพลงจาก API",
    usage: "/music <ชื่อเพลง>"
  },

  run: async ({ api, event, args }) => {
    const { sendMessage, sendAudio } = api;
    const { senderID } = event;

    if (!args.length) {
      return sendMessage(senderID, "❌ กรุณาระบุชื่อเพลง เช่น /music เธอ");
    }

    const query = encodeURIComponent(args.join(" "));
    const searchUrl = `https://a320a521-7384-420b-8d60-f89db4d5659b-00-1mr3o2rrnts3n.pike.replit.dev/api/search?query=${query}`;

    try {
      await sendMessage(senderID, "🔍 กำลังค้นหาเพลง...");
      
      const response = await axios.get(searchUrl);
      const data = response.data;

      if (data.status !== "success" || !data.downloadUrl) {
        return sendMessage(senderID, "❌ ไม่พบเพลงที่ค้นหา");
      }

      const audioUrl = data.downloadUrl;
      await sendMessage(senderID, "🎵 พบเพลงแล้ว กำลังส่ง...");
      await sendAudio(senderID, audioUrl);
      await sendMessage(senderID, "✅ ส่งเพลงเรียบร้อยแล้ว!");
    } catch (error) {
      console.log(`Error in music command: ${error.message}`);
      await sendMessage(senderID, "❌ เกิดข้อผิดพลาดในการค้นหาเพลง");
    }
  }
};
