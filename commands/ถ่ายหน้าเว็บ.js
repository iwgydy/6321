const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "screenshot",
    description: "ถ่ายภาพหน้าจอเว็บจาก URL ที่ระบุ",
    usage: "/screenshot <URL>",
  },

  run: async ({ api, event, args }) => {
    const { sendMessage, uploadAttachment } = api;
    const { senderID } = event;

    if (!args.length) {
      return sendMessage(senderID, `
⚠️ **SYSTEM ALERT** ⚠️
🔴 กรุณาระบุ URL!
📡 ตัวอย่าง: /screenshot https://example.com
      `);
    }

    const url = encodeURIComponent(args.join(" "));
    const apiUrl = `https://kaiz-apis.gleeze.com/api/screenshot?url=${url}`;
    const startTime = Date.now();

    try {
      await sendMessage(senderID, `
🌐 **SCREEN CAPTURE MODULE ACTIVATED** 🌐
🔍 เป้าหมาย: "${args.join(" ")}"
⚡ STATUS: Scanning...
      `);

      // เรียก API เพื่อถ่ายภาพหน้าจอ
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');
      const fileSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2); // ขนาดไฟล์ใน MB
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2); // เวลาที่ใช้

      // บันทึกไฟล์ชั่วคราว
      const tempImagePath = path.join(__dirname, `../temp/screenshot_${Date.now()}.jpg`);
      fs.writeFileSync(tempImagePath, imageBuffer);

      await sendMessage(senderID, `
📸 **CAPTURE SUCCESSFUL** 📸
✅ ถ่ายภาพ "${args.join(" ")}" เสร็จแล้ว!
📊 **ข้อมูลเพิ่มเติม**:
⏱️ เวลาที่ใช้: ${totalTime} วินาที
💾 ขนาดไฟล์: ${fileSizeMB} MB
🌠 กำลังส่งภาพ...
      `);

      // ส่งภาพ
      await uploadAttachment(senderID, tempImagePath);

      // ลบไฟล์ชั่วคราว
      fs.unlinkSync(tempImagePath);

      await sendMessage(senderID, `
🚀 **TRANSMISSION COMPLETE** 🚀
🖼️ ภาพหน้าจอถูกส่งถึงคุณแล้ว!
⏱️ ใช้เวลา: ${totalTime} วินาที | 💿 ขนาด: ${fileSizeMB} MB
      `);
    } catch (error) {
      console.log(`⚠️ Error in screenshot command: ${error.message}`);
      await sendMessage(senderID, `
🛑 **SYSTEM CRASH** 🛑
🔧 เกิดข้อผิดพลาดขณะถ่ายภาพ
📢 รายละเอียด: ${error.message}
🔄 ลองใหม่อีกครั้ง!
      `);
    }
  },
};
