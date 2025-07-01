require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers
	],
});

// Initialize command collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

// Interaction handler
client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (err) {
		console.error(err);
		await interaction.reply({ content: '❌ Command failed.', ephemeral: true });
	}
});

// Message moderation handler
client.on('messageCreate', async message => {
	if (message.author.bot) return;

	const blockedWordsPath = path.join(__dirname, 'blockedWords.json');
	if (!fs.existsSync(blockedWordsPath)) return;

	const blockedWords = JSON.parse(fs.readFileSync(blockedWordsPath, 'utf8'));
	const msgContent = message.content.toLowerCase();

	for (const word of blockedWords) {
		if (msgContent.includes(word.toLowerCase())) {
			await message.delete();
			await message.channel.send(`${message.author}, that word is not allowed!`).then(msg => {
				setTimeout(() => msg.delete(), 3000);
			});
			break;
		}
	}
});

// Login
client.login(process.env.DISCORD_TOKEN)
	.then(() => console.log("✅ Bot logged in successfully!"))
	.catch(err => console.error("❌ Login failed:", err));

module.exports = client;
