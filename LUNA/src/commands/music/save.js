const Command = require("../Command");
module.exports = class MusicSaveCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'save',
            aliases: ['sv'],
            usage: 'save',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    async run(message, args) {
        const queue = this.client.player.getQueue(message.guild.id);
        if (message.author.id !== "779087629211664406") return message.channel.send(" :x: **Woops! Your account seems to have no active premium plan. If you think this is a problem, contact my dev.**");
        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        message.author.send(`You saved the track ${queue.current.title} | ${queue.current.author} from the server ${message.guild.name} ✅`).then(() => {
            message.channel.send(`I have sent you the title of the music by private messages ✅`);
        }).catch(error => {
            message.channel.send(`Unable to send you a private message ${message.author}... try again ? ❌`);
        });
    }
};
