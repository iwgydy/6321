const axios = require('axios');

module.exports = {
  config: {
    name: "ค้นหา",
    version: "1.0.0",
    description: "ค้นหาวิดีโอ TikTok จากคำที่ต้องการ",
    usage: "/ค้นหา <คำค้น>",
    aliases: ["searchtiktok", "tiksearch"],
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    if (args.length === 0) {
      return api.sendMessage(
        senderID,
        "❗ กรุณาระบุคำที่ต้องการค้นหา\n\nตัวอย่าง: /ค้นหา ปรารถนาสิ่งใด"
      );
    }

    const query = args.join(" ");
    const apiUrl = `https://kaiz-apis.gleeze.com/api/tiksearch?search=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.data || !data.data.videos || data.data.videos.length === 0) {
        return api.sendMessage(
          senderID,
          `❗ ไม่พบวิดีโอที่เกี่ยวข้องกับ "${query}"`
        );
      }

      // เลือกวิดีโอแค่ตัวแรกอย่างชัดเจน
      const video = data.data.videos[0];
      const videoInfo = `
🎥 **ชื่อวิดีโอ**: ${video.title || "ไม่มีชื่อ"}
👤 **ผู้สร้าง**: ${video.author.nickname || "ไม่ระบุ"} (@${video.author.unique_id || "ไม่ระบุ"})
🌟 **ยอดถูกใจ**: ${video.digg_count || 0}
💬 **ความคิดเห็น**: ${video.comment_count || 0}
🔗 **ลิงก์วิดีโอ**: https://www.tiktok.com/@${video.author.unique_id || "unknown"}/video/${video.video_id || "unknown"}
      `;

      // ส่งข้อมูลและวิดีโอแค่ครั้งเดียว
      await api.sendMessage(senderID, videoInfo);
      if (video.play) { // ตรวจสอบว่า video.play มีค่าจริง
        await api.sendVideo(senderID, video.play);
      } else {
        await api.sendMessage(senderID, "❗ ไม่พบลิงก์วิดีโอสำหรับการเล่น");
      }

      return; // ออกจากฟังก์ชันทันทีหลังส่ง 1 คลิป
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการเรียก API:", error.message);
      return api.sendMessage(
        senderID,
        "❗ ไม่สามารถค้นหาวิดีโอได้ในขณะนี้ กรุณาลองใหม่ภายหลัง"
      );
    }
  }
};