const {MessageEmbed} = require('discord.js');

module.exports = (client, message) => {
    try {
        if (message.guild.snipes.has(message.channel.id) && (!message.author.bot)) message.guild.snipes.delete(message.channel.id)
        message.guild.snipes.set(message.channel.id, message)
        // Check for webhook and that message is not empty
        if (message.webhookId || (!message.content && message.embeds.length === 0)) return;
    } catch (e) {
    }


    const embed = new MessageEmbed();
    try {
        embed.setTitle('Message Update: `Delete`')
            .setAuthor({
                name: `${message.author.username}#${message.author.discriminator}`,
                iconURL: message.author.displayAvatarURL({format: 'png', dynamic: true})
            })
            .setTimestamp()
            .setColor("RED");
    } catch (e) {
        return;
    }


    // Message delete
    if (message.content) {
        try {
            // Dont send logs for starboard delete
            const starboardChannelId = client.db.settings.selectStarboardChannelId.pluck().get(message.guild.id);
            const starboardChannel = message.guild.channels.cache.get(starboardChannelId);
            if (message.channel == starboardChannel) return;

            // Get message delete log
            const messageDeleteLogId = client.db.settings.selectMessageDeleteLogId.pluck().get(message.guild.id);
            const messageDeleteLog = message.guild.channels.cache.get(messageDeleteLogId);
            if (
                messageDeleteLog &&
                messageDeleteLog.viewable &&
                messageDeleteLog.permissionsFor(message.guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])
            ) {

                if (message.content.length > 1024) message.content = message.content.slice(0, 1021) + '...';

                embed
                    .setDescription(`${message.member}'s **message** in ${message.channel} was deleted.`)
                    .addField('Message', message.content);

                messageDeleteLog.send({embeds: [embed]});
            }
        } catch (e) {
            console.log(e)
        }

        // Embed delete
    } else {

        // Get message delete log
        const messageDeleteLogId = client.db.settings.selectMessageDeleteLogId.pluck().get(message.guild.id);
        const messageDeleteLog = message.guild.channels.cache.get(messageDeleteLogId);
        if (
            messageDeleteLog &&
            messageDeleteLog.viewable &&
            messageDeleteLog.permissionsFor(message.guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])
        ) {

            embed
                .setTitle('Message Update: `Delete`')
                .setDescription(`${message.member}'s **message embed** in ${message.channel} was deleted.`);
            messageDeleteLog.send({embeds: [embed]});
        }
    }

};
