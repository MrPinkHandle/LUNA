const Command = require("../Command.js");
module.exports = class MusicClearCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clear',
            aliases: ['cq'],
            usage: 'clear',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    async run(message, args) {
        const queue = this.client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        if (!queue.tracks[0]) return message.channel.send(`No music in the queue after the current one ${message.author}... try again ? ❌`);

        await queue.clear();

        message.channel.send(`The queue has just been cleared 🗑️`);
    }
};
