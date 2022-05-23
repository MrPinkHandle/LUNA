const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success, verify} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class SetVerificationRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setverificationrole',
            aliases: ['setvr', 'svr'],
            usage: 'setverificationrole <role mention/ID>',
            description: oneLine`
        Sets the role ${client.name} will give members who are verified.        
        A \`verification role\`, a \`verification channel\`, 
        and a \`verification message\` must be set to enable server verification.
        \nUse \`clearverificationrole\` role to clear the current \`verification role\`.
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setverificationrole @Verified', 'clearverificationrole']
        });
    }

    async run(message, args) {
        let {
            verification_role_id: verificationRoleId,
            verification_channel_id: verificationChannelId,
            verification_message: verificationMessage,
            verification_message_id: verificationMessageId
        } = message.client.db.settings.selectVerification.get(message.guild.id);
        const oldVerificationRole = message.guild.roles.cache.get(verificationRoleId) || '`None`';
        const verificationChannel = message.guild.channels.cache.get(verificationChannelId);

        // Get status
        const oldStatus = message.client.utils.getStatus(
            verificationRoleId && verificationChannelId && verificationMessage
        );

        // Trim message
        if (verificationMessage && verificationMessage.length > 1024)
            verificationMessage = verificationMessage.slice(0, 1021) + '...';

        const embed = new MessageEmbed()
            .setTitle('Settings: `Verification`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .addField('Channel', verificationChannel?.toString() || '`None`', true)
            .addField('Message', verificationMessage || '`None`')
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear role
        if (args.length === 0) {
            return message.channel.send({
                embeds: [embed
                    .spliceFields(0, 0, {
                        name: 'Current Verification Role',
                        value: `${oldVerificationRole}`,
                        inline: true
                    })
                    .spliceFields(2, 0, {
                        name: 'Status',
                        value: `\`${oldStatus}\``,
                        inline: true
                    }).setDescription(this.description)
                ]
            });
        }

        // Update role
        embed.setDescription(`The \`verification role\` was successfully updated. ${success}\nUse \`clearverificationrole\` role to clear the current \`verification role\`.`)
        const verificationRole = await this.getRole(message, args[0])
        if (!verificationRole) return this.sendErrorMessage(message, 0, 'Please mention a role or provide a valid role ID');
        message.client.db.settings.updateVerificationRoleId.run(verificationRole.id, message.guild.id);

        // Update status
        const status = message.client.utils.getStatus(verificationRole && verificationChannel && verificationMessage);
        const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        message.channel.send({
            embeds: [embed
                .spliceFields(0, 0, {name: 'Role', value: `${oldVerificationRole} ➔ ${verificationRole}`, inline: true})
                .spliceFields(2, 0, {name: 'Status', value: statusUpdate, inline: true})
            ]
        });

        // Update verification
        if (status === 'enabled') {
            if (verificationChannel.viewable) {
                try {
                    await verificationChannel.messages.fetch(verificationMessageId);
                } catch (err) { // Message was deleted
                    message.client.logger.error(err);
                }
                const msg = await verificationChannel.send({
                    embeds: [new MessageEmbed()
                        .setDescription(verificationMessage.slice(3, -3))
                        .setColor(message.guild.me.displayHexColor)
                    ]
                });
                await msg.react(verify.split(':')[2].slice(0, -1));
                message.client.db.settings.updateVerificationMessageId.run(msg.id, message.guild.id);
            } else {
                return message.client.sendSystemErrorMessage(message.guild, 'verification', stripIndent`
          Unable to send verification message, please ensure I have permission to access the verification channel
        `);
            }
        }
    }
};
