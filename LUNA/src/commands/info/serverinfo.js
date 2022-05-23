const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const moment = require('moment');
const {owner, voice} = require('../../utils/emojis.json');
const {stripIndent} = require('common-tags');

module.exports = class ServerInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'serverinfo',
            aliases: ['server', 'si'],
            usage: 'serverinfo',
            description: 'Fetches information and statistics about the server.',
            type: client.types.INFO
        });
    }

    async run(message, args) {

        // Get roles count
        const roleCount = message.guild.roles.cache.size - 1; // Don't count @everyone

        // Get member stats
        const members = [...message.guild.members.cache.values()];
        const memberCount = members.length;
        const online = members.filter((m) => m.presence?.status === 'online').length;
        const offline = members.filter((m) => m.presence?.status === 'offline').length;
        const dnd = members.filter((m) => m.presence?.status === 'dnd').length;
        const afk = members.filter((m) => m.presence?.status === 'idle').length;
        const bots = members.filter(b => b.user.bot).length;

        // Get channel stats
        const channels = [...message.guild.channels.cache.values()];
        const channelCount = channels.length;
        const textChannels =
            channels.filter(c => c.type === 'text' && c.viewable).sort((a, b) => a.rawPosition - b.rawPosition);
        const voiceChannels = channels.filter(c => c.type === 'voice').length;
        const newsChannels = channels.filter(c => c.type === 'news').length;
        const categoryChannels = channels.filter(c => c.type === 'category').length;

        const systemchannel = message.client.db.settings.selectSystemChannelId.pluck().get(message.guild.id);
        const serverStats = stripIndent`
      Members  :: [ ${memberCount} ]
               :: ${online} Online
               :: ${dnd} Busy
               :: ${afk} AFK
               :: ${offline} Offline
               :: ${bots} Bots
      Channels :: [ ${channelCount} ]
               :: ${textChannels.length} Text
               :: ${voiceChannels} Voice
               :: ${newsChannels} Announcement
               :: ${categoryChannels} Category
      Roles    :: [ ${roleCount} ]
    `;

        const embed = new MessageEmbed()
            .setTitle(`${message.guild.name}'s Information`)
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .addField('ID', `\`${message.guild.id}\``, true)

            .addField(`Owner ${owner}`, (await message.guild.fetchOwner()).toString(), true)
            .addField('Verification Level', `\`${message.guild.verificationLevel.replace('_', ' ')}\``, true)
            .addField('Rules Channel',
                (message.guild.rulesChannel) ? `${message.guild.rulesChannel}` : '`None`', true
            )
            .addField('System Channel',
                (systemchannel) ? `<#${systemchannel}>` : '`None`', true
            )
            .addField('AFK Channel',
                (message.guild.afkChannel) ? `${voice} ${message.guild.afkChannel.name}` : '`None`', true
            )
            .addField('AFK Timeout',
                (message.guild.afkChannel) ?
                    `\`${moment.duration(message.guild.afkTimeout * 1000).asMinutes()} minutes\`` : '`None`',
                true
            )

            .addField('Default Notifications', `\`${message.guild.defaultMessageNotifications.replace('_', ' ')}\``, true)
            .addField('Partnered', `\`${message.guild.partnered}\``, true)
            .addField('Verified', `\`${message.guild.verified}\``, true)
            .addField('Created On', `\`${moment(message.guild.createdAt).format('MMM DD YYYY')}\``, true)
            .addField('Server Stats', `\`\`\`asciidoc\n${serverStats}\`\`\``)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL({dynamic: true})
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        if (message.guild.description) embed.setDescription(message.guild.description);
        if (message.guild.bannerURL) embed.setImage(message.guild.bannerURL({dynamic: true}));
        message.channel.send({embeds: [embed]});
    }
};
