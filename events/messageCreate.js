const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const https = require('https');
const sharp = require('sharp');
require('dotenv').config()
const cooldown = new Map(); // userId -> timestamp

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (message.author.bot) return;

      const channelId = '1388230889456013483';
      const modRoleName = process.env.MOD_ROLE; // e.g. "Moderator"
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      // 🔒 Blocked Words Filter (except for mods)
      const isMod = message.member?.roles.cache.has(process.env.MOD_ROLE);

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

      // 🔍 !WPM Command
      if (
        message.content.startsWith('!WPM') &&
        message.channel.id === channelId
      ) {
        const userId = message.author.id;

        if (cooldown.has(userId)) {
          const lastUsed = cooldown.get(userId);
          const timeLeft = oneHour - (now - lastUsed);
          if (timeLeft > 0) {
            const minutes = Math.ceil(timeLeft / (60 * 1000));
            return message.reply(`⏳ Please wait ${minutes} more minute(s) before using \`!WPM\` again.`);
          }
        }

        if (message.attachments.size === 0) {
          return message.reply('📷 Please attach a screenshot from **Monkeytype 10-word** test with your `!WPM` command.');
        }

        cooldown.set(userId, now);

        const attachment = message.attachments.first();

        if (attachment.contentType && attachment.contentType.startsWith('image/')) {
          const tempDir = path.join(__dirname, '..', 'temp');
          if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

          const filename = `${Date.now()}_${attachment.name}`;
          const filePath = path.join(tempDir, filename);
          const processedPath = filePath.replace(/\.(png|jpg|jpeg)/i, '_processed.png');
          const croppedPath = filePath.replace(/\.(png|jpg|jpeg)/i, '_cropped.png');

          const file = fs.createWriteStream(filePath);
          https.get(attachment.url, (response) => {
            response.pipe(file);
            file.on('finish', async () => {
              file.close();

              try {
                // Preprocess full image
                await sharp(filePath)
                  .resize({ width: 1600 })
                  .grayscale()
                  .normalize()
                  .toFile(processedPath);

                // Crop bottom-left region to detect "words 10"
                await sharp(filePath)
                  .extract({ left: 0, top: 500, width: 600, height: 200 })
                  .grayscale()
                  .normalize()
                  .toFile(croppedPath);

                const typeCheck = await Tesseract.recognize(croppedPath, 'eng');
                const typeText = typeCheck.data.text.toLowerCase();
                console.log('[DEBUG] OCR test type section:\n', typeText);

                if (!/words\s*10/.test(typeText)) {
                  return await message.reply('⚠️ This is not the correct test format! Please submit a **10-word Monkeytype test**.');
                }

                // Run OCR on full processed image
                const result = await Tesseract.recognize(processedPath, 'eng');
                const text = result.data.text.trim();
                console.log('[DEBUG] OCR full result:\n', text);

                if (!text) return await message.reply('❌ No text detected in the image.');

                const wpmMatch = text.match(/(\d{2,3}\.\d{1,2})/);
                let wpm = null;

                if (wpmMatch && wpmMatch[1]) {
                  wpm = parseFloat(wpmMatch[1]);
                }

                let roleName = null;

                if (wpm !== null) {
                  if (wpm >= 50 && wpm < 75) roleName = 'Rookie';
                  else if (wpm >= 75 && wpm < 100) roleName = 'Intermediate';
                  else if (wpm >= 100 && wpm < 175) roleName = 'Advanced';
                  else if (wpm >= 175) roleName = 'Expert';

                  if (roleName) {
                    const role = message.guild.roles.cache.find(r => r.name === roleName);
                    if (role) {
                      await message.member.roles.add(role);
                      return await message.reply(`🎉 Detected **${wpm} WPM (10 words)** — Role \`${roleName}\` assigned!`);
                    } else {
                      return await message.reply(`⚠️ WPM: ${wpm}, but role \`${roleName}\` was not found in this server.`);
                    }
                  } else {
                    return await message.reply(`📝 WPM detected: ${wpm} — but doesn't match any role range.`);
                  }
                } else {
                  return await message.reply('⚠️ Could not detect your WPM in the image.');
                }

              } catch (err) {
                console.error('OCR error:', err);
                await message.reply('⚠️ Failed to extract text from image.');
              } finally {
                [filePath, processedPath, croppedPath].forEach((p) => {
                  if (fs.existsSync(p)) fs.unlinkSync(p);
                });
              }
            });
          });
        } else {
          await message.reply('📷 Please attach an image with your `!WPM` command.');
        }
      }
    } catch (err) {
      console.error('❌ Unexpected error in messageCreate handler:', err);
    }
  },
};
