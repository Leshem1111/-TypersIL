const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Load blocked words
    const filePath = path.join(__dirname, '..', 'blockedWords.json');
    let blockedWords;
    try {
      blockedWords = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
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
        break;
      }
    }
  },
};
