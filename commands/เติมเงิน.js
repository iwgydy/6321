const axios = require('axios');
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'users.json');
let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile)) : {};

module.exports = {
  config: {
    name: "เติมเงิน",
    version: "1.0.6",
    description: "💰 เติมเงินรับคีย์พรีเมียมสุดเทพ!",
    usage: "/เติมเงิน <ลิงก์>",
    aliases: ["topup", "angpao"],
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    if (args.length === 0) {
      return api.sendMessage(senderID, `
💸 **เติมเงินเพื่อปลดล็อกพลังเต็มสูบ!**
🔗 ใช้: /เติมเงิน https://gift.truemoney.com/campaign/?v=abc123
      `);
    }

    const text = args.join(" ");
    const regex = /https:\/\/gift.truemoney.com\/campaign\/\?v=([a-zA-Z0-9]+)/;
    const matchResult = text.match(regex);

    if (!matchResult || !matchResult[1]) {
      return api.sendMessage(senderID, `
❌ **ลิงก์ซองอังเปาผิด!**
🔗 ตัวอย่าง: https://gift.truemoney.com/campaign/?v=abc123
      `);
    }

    const angpaoCode = matchResult[1];
    const paymentPhone = "0825658423";
    const apiUrl = `https://store.cyber-safe.pro/api/topup/truemoney/angpaofree/${angpaoCode}/${paymentPhone}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.status && data.status.code !== "SUCCESS") {
        let errorMessage = "🚫 **เติมเงินล้มเหลว**: ";
        if (data.status.code === "VOUCHER_EXPIRED") errorMessage += "ซองหมดอายุ";
        else if (data.status.code === "VOUCHER_REDEEMED") errorMessage += "ซองใช้แล้ว";
        else errorMessage += data.status.message || "API ขัดข้อง";

        const voucherInfo = data.data && data.data.voucher ? `
📜 **ข้อมูลซอง**
💵 มูลค่า: ${data.data.voucher.amount_baht} บาท
👥 ใช้แล้ว/ทั้งหมด: ${data.data.voucher.redeemed}/${data.data.voucher.member}
⏰ หมดอายุ: ${new Date(data.data.voucher.expire_date).toLocaleString('th-TH')}
        ` : "";
        return api.sendMessage(senderID, errorMessage + voucherInfo);
      }

      const amount = data.data.voucher.amount_baht;
      const days = Math.floor(amount / 5);
      let key;
      do {
        key = generateKey();
      } while (users[senderID]?.usedKeys?.includes(key)); // ตรวจสอบว่าไม่ซ้ำกับคีย์ที่เคยใช้

      users[senderID] = users[senderID] || { key: null, keyExpiry: null, keyType: null, usedKeys: [], usage: {} };
      users[senderID].key = key;
      users[senderID].keyExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      users[senderID].keyType = "premium";
      users[senderID].usedKeys = users[senderID].usedKeys || [];
      users[senderID].usedKeys.push(key); // บันทึกคีย์ที่ใช้แล้ว
      saveUsers();

      const successMessage = `
✅ **เติมเงินสำเร็จ!**
📱 เบอร์: ${paymentPhone}
💰 รหัสซอง: ${angpaoCode}
💵 จำนวน: ${amount} บาท
📅 อายุคีย์: ${days} วัน
🔑 **คีย์พรีเมียม**: ${key}
✨ ใช้: /sms ${key} เพื่อบันทึกคีย์
      `;
      await api.sendMessage(senderID, successMessage);
    } catch (error) {
      console.error("🔥 ข้อผิดพลาด:", error.message);
      return api.sendMessage(senderID, `
💥 **ระบบพัง!**
❌ เหตุผล: ${error.code === "ENOTFOUND" ? "เซิร์ฟเวอร์ล่ม" : error.message}
      `);
    }
  },

  generateKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 13; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
  },

  saveUsers() {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  }
};

function generateKey() {
  return module.exports.generateKey();
}

function saveUsers() {
  module.exports.saveUsers();
}
