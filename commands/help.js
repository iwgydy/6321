// commands/help.js
module.exports = {
  config: {
    name: "help",
    description: "แสดงรายการคำสั่งทั้งหมด",
    usage: "/help"
  },

  run: async ({ api, event, args, commands }) => {
    const { sendMessage } = api;
    const sender = event.senderID;

    if (!commands || !(commands instanceof Map)) {
      return await sendMessage(sender, "❌ ไม่พบรายการคำสั่ง");
    }

    // แสดงคำสั่งแต่ละอันในบรรทัดแยกกัน โดยไม่มีกรอบ
    const commandList = Array.from(commands.entries())
      .map(([name, cmd]) => `/${name} - ${cmd.config?.description || "ไม่มีคำอธิบาย"}`)
      .join("\n\n");

    let message = commandList || "ไม่พบคำสั่งใดๆ";
    message += "\n\nPOWERED BY ต้น";

    await sendMessage(sender, message);
  }
};