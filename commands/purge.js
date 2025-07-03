const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Deletes a specified number of messages.')
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('Number of messages to delete (1-100)')
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute(interaction) {
		const amount = interaction.options.getInteger('amount');

		// Validate the input
		if (amount < 1 || amount > 100) {
			return interaction.reply({ content: '❌ Please enter a number between 1 and 100.', ephemeral: true });
		}

		try {
			// Defer the reply to acknowledge the command
			if (!interaction.deferred && !interaction.replied) {
				await interaction.deferReply({ ephemeral: true });
			}

			// Bulk delete messages
			const deletedMessages = await interaction.channel.bulkDelete(amount, true);

			await interaction.editReply({ content: `✅ Successfully deleted ${deletedMessages.size} messages.` });
		} catch (error) {
			console.error('Error executing purge:', error);

			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({ content: '❌ Failed to purge messages.', ephemeral: true });
			} else {
				await interaction.followUp({ content: '❌ Failed to purge messages.', ephemeral: true });
			}
		}
	},
};
