const axios = require("axios");

module.exports = {
  config: {
    name: "sim",
    description: "พูดคุยกับ SimSimi AI",
    usage: "/sim [ข้อความ]",
    aliases: ["simsimi", "ซิม"]
  },

  run: async ({ api, event, args, sendTypingIndicator }) => {
    const { sendMessage } = api;
    const sender = event.senderID;
    const apiKey = "oi7UxmhwAPPEKR.DQvSe0gA_qLaCseaaGOZBwlAt";

    if (!args.length) {
      return await sendMessage(
        sender,
        "❗ กรุณาระบุข้อความที่ต้องการพูดคุย เช่น: /sim สวัสดี"
      );
    }

    const userMessage = args.join(" ");

    try {
      await sendTypingIndicator(sender, 'typing_on');

      const response = await axios.post(
        "https://wsapi.simsimi.com/190410/talk",
        {
          utext: userMessage,
          lang: "th",
          country: ["TH"],
          atext_bad_prob_max: 0.9,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          timeout: 10000
        }
      );

      const reply = response.data.atext || "SimSimi ไม่สามารถตอบได้ในตอนนี้";
      await sendMessage(sender, reply);

    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับ SimSimi API:", error.message);

      let errorMessage;
      if (error.response) {
        errorMessage = `❗ ข้อผิดพลาดจาก API: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = "❗ ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือ API Key";
      } else {
        errorMessage = `❗ เกิดข้อผิดพลาด: ${error.message}`;
      }

      await sendMessage(sender, errorMessage);
    } finally {
      await sendTypingIndicator(sender, 'typing_off');
    }
  }
};