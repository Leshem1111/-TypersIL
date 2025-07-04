const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (message.author.bot) return;

      const isMod = message.member?.roles.cache.has(process.env.MOD_ROLE);

      // 🔒 Blocked Words Filter
      if (!isMod) {
        const blockedFile = path.join(__dirname, '..', 'blockedWords.json');
        let blockedWords = [];

        try {
          blockedWords = JSON.parse(fs.readFileSync(blockedFile, 'utf8'));
        } catch {
          blockedWords = [];
        }

        const content = message.content.toLowerCase();
        for (const word of blockedWords) {
          if (content.includes(word.toLowerCase())) {
            try {
              await message.delete();
              const warning = await message.channel.send({
                content: `${message.author}, that word is not allowed!`,
              });
              setTimeout(() => warning.delete().catch(() => {}), 3000);
            } catch (err) {
              console.error("❌ Failed to delete message or send warning:", err);
            }
            return;
          }
        }
      }
    } catch (err) {
      console.error('❌ Unexpected error in messageCreate handler:', err);
    }
  },
};
