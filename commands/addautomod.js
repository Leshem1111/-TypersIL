const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addautomod')
    .setDescription('Add a blocked word')
    .addStringOption(option =>
      option.setName('word')
        .setDescription('The word to block')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const word = interaction.options.getString('word').toLowerCase();
    const blockedWords = JSON.parse(fs.readFileSync('./blockedWords.json', 'utf8'));

    if (blockedWords.includes(word)) {
      return interaction.reply({ content: 'That word is already blocked!', ephemeral: true });
    }

    blockedWords.push(word);
    fs.writeFileSync('./blockedWords.json', JSON.stringify(blockedWords, null, 2));
    await interaction.reply({content: `✅ Blocked the word: **${word}**`, ephemeral:true});
  }
};
