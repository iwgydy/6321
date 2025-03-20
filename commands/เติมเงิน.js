const axios = require('axios');

module.exports = {
  config: {
    name: "เติมเงิน",
    version: "1.0.1",
    description: "เติมเงินผ่านลิงก์ซองอังเปา TrueMoney",
    usage: "/เติมเงิน",
    aliases: ["topup", "angpao"],
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    if (args.length === 0) {
      return api.sendMessage(
        senderID,
        "💰 กรุณาส่งลิงก์ซองอังเปามาหลังจากคำสั่งนี้\n\nตัวอย่าง: /เติมเงิน https://gift.truemoney.com/campaign/?v=abc123"
      );
    }

    const text = args.join(" ");
    const regex = /https:\/\/gift.truemoney.com\/campaign\/\?v=([a-zA-Z0-9]+)/;
    const matchResult = text.match(regex);

    if (!matchResult || !matchResult[1]) {
      return api.sendMessage(
        senderID,
        "❗ ลิงก์ซองอังเปาไม่ถูกต้อง กรุณาส่งลิงก์ที่ถูกต้อง เช่น https://gift.truemoney.com/campaign/?v=abc123"
      );
    }

    const angpaoCode = matchResult[1];
    const paymentPhone = "0825658423"; // เบอร์ที่ใช้รับเงิน
    const apiUrl = `https://store.cyber-safe.pro/api/topup/truemoney/angpaofree/${angpaoCode}/${paymentPhone}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      // ตรวจสอบสถานะจาก API
      if (data.status && data.status.code !== "SUCCESS") {
        let errorMessage = "❗ ไม่สามารถเติมเงินได้: ";
        if (data.status.code === "VOUCHER_EXPIRED") {
          errorMessage += "ซองอังเปาหมดอายุแล้ว";
        } else if (data.status.code === "VOUCHER_REDEEMED") {
          errorMessage += "ซองอังเปาถูกใช้ครบแล้ว";
        } else {
          errorMessage += data.status.message || "เกิดข้อผิดพลาดจาก API";
        }

        const voucherInfo = data.data && data.data.voucher ? `
📜 **รายละเอียดซองอังเปา**
💰 **มูลค่า**: ${data.data.voucher.amount_baht} บาท
👥 **จำนวนที่ใช้ได้**: ${data.data.voucher.redeemed}/${data.data.voucher.member}
⏰ **วันหมดอายุ**: ${new Date(data.data.voucher.expire_date).toLocaleString('th-TH')}
📌 **สถานะ**: ${data.data.voucher.status === "redeemed" ? "ถูกใช้ครบแล้ว" : data.data.voucher.status}
        ` : "";
        return api.sendMessage(senderID, errorMessage + voucherInfo);
      }

      // กรณีสำเร็จ (สมมติว่า code: "SUCCESS" คือสำเร็จ)
      const successMessage = `
✅ **เติมเงินสำเร็จ!**
📱 **เบอร์ที่รับเงิน**: ${paymentPhone}
💰 **รหัสซองอังเปา**: ${angpaoCode}
💵 **จำนวนเงิน**: ${data.data.voucher.amount_baht} บาท
📌 **สถานะ**: สำเร็จเรียบร้อยแล้ว
      `;
      await api.sendMessage(senderID, successMessage);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการเรียก API:", error.message);
      if (error.code === "ENOTFOUND") {
        return api.sendMessage(
          senderID,
          "❗ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ API ได้ (store.cyber-safe.pro ไม่พบ)"
        );
      }
      return api.sendMessage(
        senderID,
        "❗ เกิดข้อผิดพลาดในการเติมเงิน: " + error.message
      );
    }
  }
};
