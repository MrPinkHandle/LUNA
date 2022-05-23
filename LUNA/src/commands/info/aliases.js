const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class AliasesCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'aliases',
            aliases: ['alias', 'ali', 'a'],
            usage: 'aliases [command type]',
            description: oneLine`
        Displays a list of all current aliases for the given command type. 
        If no command type is given, the amount of aliases for every type will be displayed.
      `,
            type: client.types.INFO,
            examples: ['aliases Fun']
        });
    }

    run(message, args) {

        // Get disabled commands
        let disabledCommands = message.client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) || [];
        if (typeof (disabledCommands) === 'string') disabledCommands = disabledCommands.split(' ');

        const aliases = {};
        const embed = new MessageEmbed();
        for (const type of Object.values(message.client.types)) {
            aliases[type] = [];
        }

        const type = (args[0]) ? args[0].toLowerCase() : '';
        const types = Object.values(message.client.types);
        const {INFO, FUN, POINTS, SMASHORPASS, NSFW, MISC, MOD, MUSIC, ADMIN, OWNER} = message.client.types;
        const {capitalize} = message.client.utils;

        const emojiMap = {
            [INFO]: `${emojis.info} ${capitalize(INFO)}`,
            [FUN]: `${emojis.fun} ${capitalize(FUN)}`,
            [POINTS]: `${emojis.points} ${capitalize(POINTS)}`,
            [MISC]: `${emojis.misc} ${capitalize(MISC)}`,
            [MOD]: `${emojis.mod} ${capitalize(MOD)}`,
            [MUSIC]: `${emojis.music} ${capitalize(MUSIC)}`,
            [ADMIN]: `${emojis.admin} ${capitalize(ADMIN)}`,
            [OWNER]: `${emojis.owner} ${capitalize(OWNER)}`
        };

        if (args[0] && types.includes(type) && (type != OWNER || message.client.isOwner(message.member))) {

            message.client.commands.forEach(command => {
                if (command.aliases && command.type === type && !disabledCommands.includes(command.name))
                    aliases[command.type].push(`**${command.name}:** ${command.aliases.map(a => `\`${a}\``).join(' ')}`);
            });

            embed
                .setTitle(`Alias Type: \`${capitalize(type)}\``)
                .setThumbnail(`${message.client.config.botLogoURL || 'https://i.imgur.com/B0XSinY.png'}`)
                .addField(
                    `**${emojiMap[type]} [${aliases[type].reduce((a, b) => a + b.split(' ').slice(1).length, 0)}]**`,
                    aliases[type].join('\n')
                )
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);

        } else if (type) {
            return this.sendErrorMessage(message, 0, 'Unable to find command type, please check provided type');

        } else {

            message.client.commands.forEach(command => {
                if (command.aliases && !disabledCommands.includes(command.name))
                    aliases[command.type].push(`**${command.name}:** ${command.aliases.map(a => `\`${a}\``).join(' ')}`);
            });

            const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);

            embed
                .setTitle(`${message.client.name}\'s Alias Types`)
                .setDescription(stripIndent`
          **Prefix:** \`${prefix}\`
          **More Information:** \`${prefix}aliases [command type]\`
        `)
                .setImage('https://api.creavite.co/out/U-WZvir3plrb05vl_static.png')
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);

            for (const type of Object.values(message.client.types)) {
                if (type === OWNER && !message.client.isOwner(message.member)) continue;
                if (aliases[type][0])
                    embed.addField(
                        `**${emojiMap[type]}**`, `
            \`${aliases[type].reduce((a, b) => a + b.split(' ').slice(1).length, 0)}\` aliases`,
                        true
                    );
            }

            embed.addField(
                '**Links**',
                `**[Invite Me](${message.client.link}) | ` +
                `Developed By ${message.client.ownerTag}**`
            );
        }

        message.channel.send({embeds: [embed]});
    }
};
