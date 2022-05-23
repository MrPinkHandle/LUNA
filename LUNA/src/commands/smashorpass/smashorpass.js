//THIS IS SOOOO MESSY
// but it works
const Command = require('../Command.js');
const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');

const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json')
const cost = 5;

module.exports = class smashOrPassCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'smashorpass',
            aliases: ['sop', 'smash'],
            usage: 'smashorpass [<user mention/id>]',
            description: oneLine`
        Play a game of smash or pass. You will be shown a random user and you vote smash or pass.
        If there's a match, your discord username is revealed to them.
        
        If a user is mentioned, you will be asked to vote for them.        
        
        Cost: ${cost} points per smash
        To opt-out of the game, use the command "toggleSmashOrPass"
      `,
            type: client.types.SMASHORPASS,
            examples: ['smashorpass', 'sop', 'smash'],
            clientPermissions: ['MANAGE_MESSAGES', 'SEND_MESSAGES', 'EMBED_LINKS'],
            exclusive: true
        });
    }

    async run(message, args) {
        const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
        const optOutSmashOrPass = message.client.db.users.selectOptOutSmashOrPass.pluck().get(message.author.id)
        if (optOutSmashOrPass === 1) {
            const embed = new MessageEmbed()
                .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                .setDescription(`To use this command, you must be opted-in to ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}.\nPlease opt back in, by typing **\`${prefix}toggleSmashOrPass\`**`)
            this.done(message.author.id)
            return message.channel.send({embeds: [embed]})
        }

        let points = message.client.db.users.selectPoints.pluck().get(message.author.id, message.guild.id)
        if (points < cost) {
            this.done(message.author.id)
            return await message.reply(`${emojis.nep} You need **${cost - points}** more points ${emojis.point} in this server to play ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} .\n\nTo check your points ${emojis.point}, type \`${prefix}points\``)
        }

        const stopPlaying = (msg, id, error = `${emojis.fail} Stopped Playing!`) => {
            console.log('stopping smash or pass')
            this.done(message.author.id)
            msg.edit({embeds: [new MessageEmbed().setTitle(`${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass}`).setDescription(error)], components: []})
        }

        const controls = new MessageActionRow()
        controls.addComponents(new MessageButton().setCustomId(`smash`).setLabel(`🔥 Smash`).setStyle('SUCCESS'))
        controls.addComponents(new MessageButton().setCustomId(`pass`).setLabel(`👎 Pass`).setStyle('SECONDARY'))
        controls.addComponents(new MessageButton().setCustomId(`stop`).setLabel(`🛑 STOP`).setStyle('DANGER'))

        // MENTIONED A USER
        if (args.length) {
            const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0] || await message.guild.members.cache.find(m => m.displayName.toLowerCase().startsWith(args[0].toLowerCase())));
            if (member == undefined) {
                this.done(message.author.id)
                return message.reply(`${emojis.fail} Failed to find a user with that name, please try mentioning them or use their user ID.`)
            }
            if (member.user.id == message.author.id) {
                this.done(message.author.id)
                return message.reply(`${emojis.fail} No stupid, how are you gonna 🔥Smash yourself?? :neutral_face:`)
            }

            const seenBefore = message.client.db.SmashOrPass.getSeenByUser.get(message.author.id, member.user.id)
            if (seenBefore) {
                const matched = message.client.db.SmashOrPass.getMatch.get({
                    userId: member.user.id,
                    userId2: message.author.id
                })
                if (seenBefore.liked == 'yes') {
                    if (matched) {
                        this.done(message.author.id)
                        return await message.reply(`${emojis.smashorpass} You two have matched already ${emojis.smashorpass}. To unmatch ${emojis.unmatch}, type \`${prefix}unmatch <user mention/id>\``)
                    }
                    this.done(message.author.id)
                    return message.reply(`You already voted 🔥 Smash on ${member.user.username}. To reset your ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass} history, type \`${prefix}resetSmashOrPass\``)
                } else {
                    this.done(message.author.id)
                    return message.reply(`You already voted 👎 Pass on ${member.user.username}. To reset your ${emojis.smashorpass} Smash or Pass ${emojis.smashorpass} history, type \`${prefix}resetSmashOrPass\``)
                }
            }

            let bio = (message.client.db.bios.selectBio.get(member.id)).bio || `*This user has not set a bio!*`;

            const embed = new MessageEmbed()
                .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                .setDescription(`${member.displayName} \n${bio}`)
                .setImage(member.user.displayAvatarURL({dynamic: true, size: 512}))
                .setFooter({text: `Expires in 30 seconds ${points ? `| Points: ${points}` : ''}`})

            message.channel.send({embeds: [embed], components: [controls]}).then(async msg => {

                const filter = (button) => {
                    button.deferUpdate();
                    return button.user.id === message.author.id;
                }
                const collector = msg.createMessageComponentCollector({
                    filter,
                    componentType: 'BUTTON',
                    time: 30000
                });

                handleSmashOrPass.call(this, msg, message.author, points, member, collector).then(async result => {
                    await msg.edit({
                        embeds: [new MessageEmbed()
                            .setTitle(`${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass}`)
                            .setDescription(result.decision)
                            .setFooter({text: `Expires in 30 seconds | Points: ${points}`})]
                    })
                    this.done(message.author.id)
                }).finally(() => {
                    stopPlaying.call(this, message.author.id)
                })
            })
        }
        else {
            const likedByUsers = message.client.db.SmashOrPass.getLikedByUsers.all({userId: message.author.id}) || []
            const unseenUsers = message.client.db.SmashOrPass.getUnseenUsers.all({userId: message.author.id}) || []
            const usersToBeShown = [...likedByUsers, ...unseenUsers];

            if (usersToBeShown.length) {
                usersToBeShown.reverse();
                let embed = new MessageEmbed()
                    .setTitle(`${emojis.smashorpass} Smash Or Pass ${emojis.smashorpass}`)
                    .setDescription(`${emojis.load} Loading...`)
                    .setFooter({text: `Expires in 30 seconds | Points: ${points}`})

                message.channel.send({embeds: [embed], components: [controls]}).then(async msg => {

                    const filter = (button) => {
                        button.deferUpdate();
                        return button.user.id === message.author.id;
                    }
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        componentType: 'BUTTON',
                        time: 30000,
                        dispose: true
                    });

                    while (points >= cost && usersToBeShown.length) {
                        const currentUser = await nextUser(msg, usersToBeShown, points, prefix);
                        if (currentUser) {
                            try {
                                let result = await handleSmashOrPass.call(this, msg, message.author, points, currentUser, collector)
                                if (!result) return;
                                points = result.points;
                                await msg.edit({
                                    embeds: [new MessageEmbed()
                                        .setTitle(result.decision)
                                        .setDescription(`${emojis.load} Loading...`)
                                        .setFooter({text: `Expires in 30 seconds | Points: ${points}`})]
                                })
                            } catch (e) {
                                return stopPlaying(msg, message.author.id, `${e}`);
                            }
                        }
                    }
                    if (points < cost) await stopPlaying(msg, message.author.id, `${emojis.nep} You need **${cost - points}** more points ${emojis.point} in this server to play ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} .\n\nTo check your points ${emojis.point}, type \`${prefix}points\``);
                    else await stopPlaying(msg, message.author.id, `${emojis.fail} Maximum swipes reached per session. Try again later.\nOr\nYou may have viewed everyone. Consider resetting using the command **\`${prefix}resetsmashorpass\`**`);
                })
            } else {
                this.done(message.author.id)
                await message.reply(`You have viewed everyone. Consider resetting using the command **\`${prefix}resetsmashorpass\`**`)
            }
        }
    }
};

async function nextUser(message, usersQueue, points, prefix) {
    return new Promise(async (resolve, reject) => {
        let currentUser;
        if (usersQueue.length) {
            const newUser = usersQueue.pop();
            const guild = message.client.guilds.cache.get(newUser.guild_id)

            if (guild) {
                currentUser = await guild.members.cache.get(newUser.user_id);
                if (currentUser) {
                    let bio = (message.client.db.bios.selectBio.get(currentUser.id)).bio || `*This user has not set a bio!* Set a bio \`${prefix}bio\``;
                    await message.edit({
                        embeds: [
                            new MessageEmbed()
                                .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                                .setDescription(`${currentUser.displayName} \n${bio}`)
                                .setImage(currentUser.user.displayAvatarURL({dynamic: true, size: 512}))
                                .setFooter({text: `Expires in 30 seconds ${points ? `| Points: ${points}` : ''} | To Opt-Out: ${prefix}optout`})
                        ]
                    })
                }
            }
        }
        resolve(currentUser);
    })
}

async function handleSmashOrPass(msg, author, points, currentUser, collector) {
    return new Promise((async (resolve, reject) => {
        console.log(`HANDLE SMASH`)
        collector.resetTimer();
        const date = new Date();

        let decision = 'Undecided';
        collector.on('collect', async (btn) => {
            if (btn.customId === 'smash' && btn.user.id === author.id) {
                try {
                    decision = `🔥 Smashed ${currentUser.user.username}`
                    msg.client.db.SmashOrPass.insertRow.run(author.id, currentUser.user.id, 'yes', date.toISOString())
                    msg.client.db.users.updatePoints.run({points: -cost}, author.id, msg.guild.id);
                    points = points - cost;
                } catch (e) {
                    msg.client.db.matches.unmatchUser.run(author.id, currentUser.user.id)
                    this.done(msg.author.id)
                    reject( `${emojis.match} **IT'S A MATCH** ${emojis.match}\nHowever, we were unable to DM their discord tag to you. Please check your DMs settings.`)
                }

                const matched = await msg.client.db.SmashOrPass.getMatch.get({
                    userId: currentUser.user.id,
                    userId2: author.id
                })

                try {
                    if (matched) {
                        await author.send({
                            embeds: [new MessageEmbed()
                                .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                                .setDescription(`${emojis.match} **IT'S A MATCH** ${emojis.match}\nYou matched with ${currentUser.user.tag}, say hi!`)
                                .setImage(currentUser.user.displayAvatarURL({dynamic: true, size: 512}))
                                .setFooter({text: `Remember to always be respectful!`})]
                        })
                    }
                } catch (e) {
                    msg.client.db.matches.unmatchUser.run(author.id, currentUser.user.id)
                    this.done(msg.author.id)
                    reject( `${emojis.match} **IT'S A MATCH** ${emojis.match}\nHowever, we were unable to DM their discord tag to you. Please check your DMs settings.`)
                }
            }
            else if (btn.customId === 'pass' && btn.user.id === author.id) {
                try {
                    decision = `👎 Passed ${currentUser.user.username}`
                    msg.client.db.SmashOrPass.insertRow.run(author.id, currentUser.user.id, 'no', date.toISOString())
                } catch (e) {
                    this.done(msg.author.id)
                    reject( `${emojis.fail} Stopped Playing`)
                }
            }
            else if (btn.customId === 'stop' && btn.user.id === author.id) {
                this.done(msg.author.id)
                reject( '🛑 Stopped Playing')
            }
            resolve({decision, points})
        })

        collector.on('end', async () => {
            reject(`${emojis.fail} Stopped Playing`)
        });
    }))
}
