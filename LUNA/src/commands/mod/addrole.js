const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class AddRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'addrole',
            aliases: ['ar', 'createrole', 'cr'],
            usage: 'addrole roleName',
            description: 'Creates a new role with the provided name.',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
            userPermissions: ['MANAGE_ROLES'],
            examples: ['addrole MyRole']
        });
    }

    async run(message, args) {
        if (!args[0]) return this.sendHelpMessage(message, `Add Role`);
        else {
            if (args.join(' ').length > 30) return this.sendErrorMessage(message, 1, 'Your role name must not be longer than 30 characters', "");
            try {
                // Add role
                await message.guild.roles.create({
                    name: `${args.join(' ')}`,
                    reason: `Created By ${message.author.username}#${message.author.discriminator}(${message.author.id})`
                })
                    .then(role => {
                        const embed = new MessageEmbed()
                            .setTitle('Add Role')
                            .setDescription(`${role} was successfully created.`)
                            .addField('Created By', message.member.toString(), true)
                            .addField('Role', role.toString(), true)
                            .setFooter({
                                text: message.member.displayName,
                                iconURL: message.author.displayAvatarURL()
                            })
                            .setTimestamp()
                            .setColor(message.guild.me.displayHexColor);
                        message.channel.send({embeds: [embed]});

                        // Update mod log
                        this.sendModLogMessage(message, `Created By ${message.author.username}#${message.author.discriminator}(${message.author.id})`, {
                            Member: message.author,
                            Role: role
                        });
                    });

            } catch (err) {
                message.client.logger.error(err.stack);
                this.sendErrorMessage(message, 1, 'Please check the role hierarchy', err.message);
            }
        }
    }
};
