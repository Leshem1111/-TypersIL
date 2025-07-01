const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeautomod')
    .setDescription('Remove a blocked word')
    .addStringOption(option =>
      option.setName('word')
        .setDescription('The word to unblock')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const word = interaction.options.getString('word').toLowerCase();
    let blockedWords = JSON.parse(fs.readFileSync('./blockedWords.json', 'utf8'));

    if (!blockedWords.includes(word)) {
      return interaction.reply({ content: 'That word is not in the block list.', ephemeral: true });
    }

    blockedWords = blockedWords.filter(w => w !== word);
    fs.writeFileSync('./blockedWords.json', JSON.stringify(blockedWords, null, 2));
    await interaction.reply({ content: `✅ Unblocked the word: **${word}**`, ephemeral: true});
  }
};
