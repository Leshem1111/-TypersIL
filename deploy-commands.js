require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}


const rest = new REST().setToken(process.env.DISCORD_TOKEN);

const guildIds = [
	// shiny hunters
	'1388225118249029753',
];

//console.log(process.env.dev)
//if (process.env.dev) guildIds.push(process.env.DEV_GUILD_ID);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		for (const guildId of guildIds) {
			await rest.put(Routes.applicationGuildCommands(
					process.env.DISCORD_CLIENT_ID,
					guildId,
				),
				{ body: commands },
			);
			console.log(`Successfully reloaded commands for guild ${guildId}.`);
		}
	} catch (error) {
		console.error(error);
	}
})();
