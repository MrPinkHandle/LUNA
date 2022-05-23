const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const Command = require("../Command");

module.exports = class MusicNowPlayingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'nowplaying',
            aliases: ['np'],
            usage: 'nowplaying',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    async run(message, args) {
        const queue = this.client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing) return message.channel.send(`No music currently playing ${message.author}... try again ? ❌`);

        const track = queue.current;

        const embed = new MessageEmbed();

        embed.setColor('RED');
        embed.setThumbnail(track.thumbnail);
        embed.setAuthor({
            name: track.title,
            iconURL: this.client.user.displayAvatarURL({size: 1024, dynamic: true}),
        });

        const methods = ['disabled', 'track', 'queue'];

        const timestamp = queue.getPlayerTimestamp();
        const trackDuration = timestamp.progress == 'Infinity' ? 'infinity (live)' : track.duration;

        embed.setDescription(`Volume **${queue.volume}**%\nDuration **${trackDuration}**\nLoop mode **${methods[queue.repeatMode]}**\nRequested by ${track.requestedBy}`);

        embed.setTimestamp();
        embed.setFooter({
            text: 'The beet music  - Made with love by PinkyPeaker#9165 ❤️',
            iconURL: message.author.avatarURL({dynamic: true})
        });

        const saveButton = new MessageButton();

        saveButton.setLabel('Save this track');
        saveButton.setCustomId('saveTrack');
        saveButton.setStyle('SUCCESS');

        const row = new MessageActionRow().addComponents(saveButton);

        message.channel.send({embeds: [embed], components: [row]});
    }
};
