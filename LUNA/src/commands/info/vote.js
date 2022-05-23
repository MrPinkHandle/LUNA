const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json')

module.exports = class InviteMeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'vote',
            aliases: ['topgg', 'betterodds'],
            usage: 'vote',
            description: `Generates a www.top.gg link you can use to vote for ${client.name} to increase your gambling odds. Voting increases your gambling odds by 10%`,
            type: client.types.INFO
        });
    }

    async run(message, args) {
        const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id)
        message.client.utils.checkTopGGVote(message.client, message.author.id).then(voted => {
            const embed = new MessageEmbed()
                .setTitle('Vote On Top.gg')
                .setThumbnail('https://api.creavite.co/out/U-WZvir3plrb05vl_static.png')
                .setDescription(`Click [here](https://top.gg/bot/${message.client.config.apiKeys.TopGGID}/vote) to vote. \n\n
                **Voting Perks**\n${emojis.Voted}**+10%** Gambling Odds - Check your odds: \`${prefix}odds\` \
                \n*Perks will be activated 5 mins after voting*
                `)
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL({dynamic: true})
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);
            if (!voted) {
                message.channel.send({embeds: [embed]});
            } else {
                message.channel.send({embeds: [embed.setTitle(`${emojis.Voted} You have already voted`)]});
            }
        }).catch(e => {
            console.log(e)
        })

    }
};
