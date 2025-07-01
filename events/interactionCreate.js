const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.guildId != process.env.GUILD_ID) return;

		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			if (interaction.isAutocomplete()) {
				await command.autocomplete?.(interaction);
			} else if (interaction.isChatInputCommand()) {
				// Only defer if not already acknowledged
				if (!interaction.deferred && !interaction.replied) {
					await interaction.deferReply({ ephemeral: true });
				}
				await command.execute(interaction);
			}
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);

			// Safe fallback error message
			try {
				if (interaction.deferred) {
					await interaction.editReply({ content: '❌ Command failed.' });
				} else if (!interaction.replied) {
					await interaction.reply({ content: '❌ Command failed.', ephemeral: true });
				}
			} catch (replyError) {
				console.error("❌ Failed to send error reply:", replyError);
			}
		}
	}
};
