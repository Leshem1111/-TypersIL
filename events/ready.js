const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        const updateActivity = () => {
            const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            client.user.setActivity(`Watching ${totalMembers} members`, { type: ActivityType.Playing });
        };

        updateActivity();

        client.on('guildMemberAdd', updateActivity);
        client.on('guildMemberRemove', updateActivity);
    },
};
