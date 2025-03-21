const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "genimg",
    version: "1.0.0",
    description: "สร้างภาพจากข้อความและส่งภาพจริงโดยใช้ API ใหม่",
    usage: "/genimg <คำสั่งสร้างภาพ>",
    aliases: ["createimg", "flux"],
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    if (args.length < 1) {
      return api.sendMessage(senderID, `
✨ **คำสั่งสร้างภาพสุดเทพ** ✨
❌ รูปแบบไม่ถูกต้อง!
📜 ใช้: /genimg <คำสั่งสร้างภาพ>
💡 ตัวอย่าง: /genimg มดยักษ์กินเมือง
      `);
    }

    const prompt = args.join(" ");
    const startTime = Date.now();

    const apiUrl = `http://de01.uniplex.xyz:1636/api/generate-image?prompt=${encodeURIComponent(prompt)}`;

    try {
      // ส่งข้อความเริ่มต้น
      await api.sendMessage(senderID, `
🎨 **เริ่มสร้างภาพสุดเจ๋ง** 🎨
✍️ คำสั่ง: ${prompt}
⚡ สถานะ: กำลังประมวลผล...
👾 **สร้างโดย**: โทมัส
      `);

      // เรียก API เพื่อสร้างภาพ
      const response = await axios.get(apiUrl);
      const result = response.data;

      if (result.status !== "success" || !result.downloadUrl) {
        throw new Error("API ไม่ได้ส่ง URL ภาพกลับมาหรือสถานะไม่สำเร็จ");
      }

      const imageUrl = result.downloadUrl;

      // ดาวน์โหลดภาพจาก URL
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');
      const tempImagePath = path.join(__dirname, `../temp/genimg_${Date.now()}.jpg`);

      // บันทึกภาพชั่วคราว
      fs.writeFileSync(tempImagePath, imageBuffer);

      // ส่งข้อความสรุปก่อน
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      await api.sendMessage(senderID, `
🖼️ **ผลการสร้างภาพสุดปัง** 🖼️
✍️ คำสั่ง: ${prompt}
⏰ ใช้เวลา: ${totalTime} วินาที
💥 สถานะ: เสร็จสิ้น!
      `);

      // ส่งภาพแยก
      await api.uploadAttachment(senderID, tempImagePath);

      // ลบไฟล์ชั่วคราวหลังส่ง
      fs.unlinkSync(tempImagePath);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error.message);
      return api.sendMessage(senderID, `
💥 **SYSTEM FAILURE** 💥
❌ ไม่สามารถสร้างหรือส่งภาพได้!
📢 เหตุผล: ${error.message}
⏲️ ลองใหม่ภายหลัง!
      `);
    }
  }
};
