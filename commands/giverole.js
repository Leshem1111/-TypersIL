const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const blockedRoleIds = [
    '1388226123720163429', 
    '1388226152308543771',
    '1388243135754272839',
    '1388229846215426088',
];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('giverole')
		.setDescription("Gives a role to the user specified based on the typing speed.")
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user who you want to verify')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
            .setName("role")
            .setDescription('The role which you want to give')
            .setRequired(true)
        )
		.setDMPermission(false),

	async execute(interaction) {

        if (!interaction.member.roles.cache.has(process.env.MOD_ROLE)) {
            return await interaction.reply({ content: 'אתה חייב להיות מודרייטור כדי להשתמש בפקודה זו!', ephemeral: true });
        }

        const verifier = interaction.user 
        const userVerified = interaction.options.getUser('user')
        const role = interaction.options.getRole('role')

        if (blockedRoleIds.includes(role.id)) {
            return await interaction.reply({
                content: `❌ הרול הזה חסום ולא ניתן להוסיפו דרך הפקודה.`,
                ephemeral: true
            });
        }

        
        const member = await interaction.guild.members.fetch(userVerified.id).catch(() => null)
        const logChannel = await interaction.guild.channels.fetch(process.env.LOG_CHANNEL).catch(() => null);


        try {
            await member.roles.add(role)

            const verifyLog = new EmbedBuilder()
                .setDescription(`${userVerified} קיבל רול ${role} על ידי ${verifier}`)
                .setColor("#327ed3")
                .setTimestamp()

            let message_id = null;
            if (logChannel) {
                const message = await logChannel.send({embeds: [verifyLog]})
                message_id = message.id;
            }

            await interaction.reply({content: 'הרול התקבל!', ephemeral: true})
        } catch (error) {
            await interaction.reply({content: 'אירעה שגיאה', ephemeral: true})
        }

	},
};