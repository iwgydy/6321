commands.set('ip', {
  config: {
    name: 'ip'
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    // ตรวจสอบว่ามีการระบุ IP หรือไม่
    if (!args[0]) {
      return api.sendMessage(senderID, 'กรุณาระบุ IP เช่น: /ip 93.86.41');
    }

    const ip = args[0];

    try {
      // เรียก API เพื่อตรวจสอบ IP
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/ip-info?ip=${ip}`, {
        timeout: 5000 // ตั้ง timeout 5 วินาทีเพื่อป้องกันการรอนานเกินไป
      });

      const data = response.data;

      // ตรวจสอบว่าการเรียก API สำเร็จหรือไม่
      if (!data.success || data.data.status !== 'success') {
        return api.sendMessage(senderID, 'ไม่สามารถดึงข้อมูล IP ได้ กรุณาตรวจสอบ IP ที่ระบุ');
      }

      const ipInfo = data.data;

      // สร้างข้อความตอบกลับในรูปแบบที่อ่านง่าย
      const reply = `
📌 ข้อมูล IP: ${ipInfo.query}
🌍 ประเทศ: ${ipInfo.country} (${ipInfo.countryCode})
🏙️ เมือง: ${ipInfo.city}
📍 รหัสไปรษณีย์: ${ipInfo.zip}
📏 พิกัด: (${ipInfo.lat}, ${ipInfo.lon})
⏰ โซนเวลา: ${ipInfo.timezone}
🌐 ISP: ${ipInfo.isp}
🏢 องค์กร: ${ipInfo.org}
🔗 AS: ${ipInfo.as}
      `;

      // ส่งข้อความกลับไปยังผู้ใช้
      await api.sendMessage(senderID, reply.trim());
    } catch (error) {
      console.log(`❌ Error fetching IP info: ${error.message}`);
      await api.sendMessage(senderID, '❌ เกิดข้อผิดพลาดในการตรวจสอบ IP กรุณาลองใหม่');
    }
  }
});
