
const axios = require('axios');

module.exports = {
  config: {
    name: "ส่งข้อความถึงแอดมิน",
    description: "ส่งข้อความถึงแอดมิน",
    usage: "/ต่อต่อ [ข้อความ]"
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;
    const adminID = "9466925823402089";
    
    if (args.length === 0) {
      return api.sendMessage(
        senderID,
        `╔═══════[ ⚠️ ALERT ⚠️ ]═══════╗
║ กรุณาพิมพ์ข้อความที่ต้องการส่ง    ║
║                                   ║
║ ตัวอย่าง: /ต่อต่อ สวัสดีครับแอดมิน ║
╚═══════════════════════════════╝`
      );
    }

    const message = args.join(" ");
    
    try {
      // ส่งข้อความไปยังแอดมิน
      await api.sendMessage(
        adminID,
        `╔═════[ 📨 NEW MESSAGE 📨 ]═════╗
║ จาก: ${senderID}
║ 
║ ${message}
╚═══════════════════════════════╝`
      );
      
      // แจ้งผู้ใช้ว่าส่งข้อความสำเร็จ
      await api.sendMessage(
        senderID,
        `╔═════[ ✅ SUCCESS ✅ ]═════╗
║ ส่งข้อความถึงแอดมินแล้ว!      ║
║ ขอบคุณที่ติดต่อ ♥️           ║
╚═══════════════════════════╝`
      );

    } catch (error) {
      console.error("Error sending message:", error);
      await api.sendMessage(
        senderID,
        `╔═════[ ❌ ERROR ❌ ]═════╗
║ ไม่สามารถส่งข้อความได้       ║
║ กรุณาลองใหม่อีกครั้ง        ║
╚════════════════════════════╝`
      );
    }
  }
};
