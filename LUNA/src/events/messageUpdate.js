const {MessageEmbed} = require('discord.js');

module.exports = (client, oldMessage, newMessage) => {

    if (newMessage.webhookId) return; // Check for webhook

    //Add to editsnipe history
    if (oldMessage?.author && oldMessage.guild?.editSnipes?.has(oldMessage.channel.id) && (!oldMessage?.author?.bot))
        oldMessage.guild?.editSnipes?.delete(oldMessage.channel.id)

    oldMessage.guild?.editSnipes?.set(oldMessage.channel.id, {oldMessage, newMessage})

    // Detect edited commands
    if (
        newMessage.member &&
        newMessage.id === newMessage.member.lastMessageId &&
        !oldMessage.command
    ) {
        client.emit('message', newMessage);
    }

    // Content change
    if (oldMessage.content != newMessage.content) {

        // Dont send logs for starboard edits
        const starboardChannelId = client.db.settings.selectStarboardChannelId.pluck().get(newMessage.guild.id);
        const starboardChannel = newMessage.guild.channels.cache.get(starboardChannelId);
        if (newMessage.channel == starboardChannel) return;

        // Get message edit log
        const messageEditLogId = client.db.settings.selectMessageEditLogId.pluck().get(newMessage.guild.id);
        const messageEditLog = newMessage.guild.channels.cache.get(messageEditLogId);
        if (
            messageEditLog &&
            messageEditLog.viewable &&
            messageEditLog.permissionsFor(newMessage.guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])
        ) {

            try {
                if (newMessage.content.length > 1024) newMessage.content = newMessage.content.slice(0, 1021) + '...';
                if (oldMessage.content.length > 1024) oldMessage.content = oldMessage.content.slice(0, 1021) + '...';
            } catch (e) {
                console.log(e)
            }

            try {
                const embed = new MessageEmbed()
                    .setTitle('Message Update: `Edit`')
                    .setDescription(`${newMessage.member}'s **message** in ${newMessage.channel} was edited. [Jump to message!](${newMessage.url})`)
                    .addField('Before', oldMessage ? oldMessage?.content : "**")
                    .addField('After', newMessage?.content || 'None');
                messageEditLog.send({embeds: [embed]});
            } catch (e) {
                console.log(e)
            }
        }
    }

    // Embed delete
    if (oldMessage.embeds.length > newMessage.embeds.length) {
        // Get message delete log
        const messageDeleteLogId = client.db.settings.selectMessageDeleteLogId.pluck().get(newMessage.guild.id);
        const messageDeleteLog = newMessage.guild.channels.cache.get(messageDeleteLogId);
        if (
            messageDeleteLog &&
            messageDeleteLog.viewable &&
            messageDeleteLog.permissionsFor(newMessage.guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])
        ) {

            embed.setTitle('Message Update: `Delete`');
            if (oldMessage.embeds.length > 1)
                embed.setDescription(`${newMessage.member}'s **message embeds** in ${newMessage.channel} were deleted.`);
            else
                embed.setDescription(`${newMessage.member}'s **message embed** in ${newMessage.channel} was deleted.`);
            messageDeleteLog.send({embeds: [embed]});
        }
    }
};
