const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {oneLine} = require('common-tags');

module.exports = class FeedbackCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'suggestion',
            aliases: ['fb', 'suggestions', 'suggest', 'feedback'],
            usage: 'suggest <message>',
            description: `Sends a message to the ${client.name} developers feedback page.`,
            type: client.types.MISC,
            examples: [`suggest We love ${client.name}!`]
        });
    }

    run(message, args) {
        const feedbackChannel = message.client.channels.cache.get(message.client.feedbackChannelId);
        if (!feedbackChannel)
            return this.sendErrorMessage(message, 1, 'The feedbackChannelId property has not been set');
        if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide a message to send');
        let feedback = message.content.slice(message.content.indexOf(args[0]), message.content.length);

        // Send report
        const feedbackEmbed = new MessageEmbed()
            .setTitle('Suggestion')
            .setThumbnail(feedbackChannel.guild.iconURL({dynamic: true}))
            .setDescription(feedback)
            .addField('User', message.member.toString(), true)
            .addField('Server', message.guild.name, true)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        feedbackChannel.send({embeds: [feedbackEmbed]});

        // Send response
        if (feedback.length > 1024) feedback = feedback.slice(0, 1021) + '...';
        const embed = new MessageEmbed()
            .setTitle('Suggestion')
            .setThumbnail('https://api.creavite.co/out/U-WZvir3plrb05vl_static.png')
            .setDescription(oneLine`
        Successfully sent feedback!
        Please contact the developer (${message.client.ownerTag}) to further discuss your feedback.
      `)
            .addField('Member', message.member.toString(), true)
            .addField('Message', feedback)
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
