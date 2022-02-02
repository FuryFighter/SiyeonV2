import {  Client, Interaction, GuildMember, Snowflake, DiscordAPIError, MessageEmbed, MessageActionRow, MessageButton, Emoji, GuildEmoji } from 'discord.js';
import {
	AudioPlayerIdleState,
	AudioPlayerState,
	AudioPlayerStatus,
	AudioResource,
	entersState,
	joinVoiceChannel,
	VoiceConnectionStatus,
} from '@discordjs/voice';
import { Track } from './music/track';
import { MusicSubscription } from './music/subscription';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { token } = require('../auth.json');
import { w2g } from './w2g/w2g';
import ytpl = require('ytpl');

const client = new Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });

client.on('ready', () => console.log('Ready!'));

// This contains the setup code for creating slash commands in a guild. The owner of the bot can send "!deploy" to create them.
client.on('messageCreate', async (message) => {
	if (!message.guild) return;
	if (!client.application?.owner) await client.application?.fetch();

	if (message.content.toLowerCase() === '!deploy' && message.author.id === client.application?.owner?.id) {
		await message.guild.commands.set([
			{
				name: 'play',
				description: 'Plays a song',
				options: [
					{
						name: 'song',
						type: 'STRING' as const,
						description: 'The URL or Name of the song to play',
						required: true,
					},
				],
			},
			{
				name: 'w2g',
				description: 'Creates a new Watch2Gether room.',
				options: [
					{
						name: 'url',
						type: 'STRING' as const,
						description: 'The URL of a YouTube video or type: "rooms" to show all created w2g rooms.',
					},
				],
			},
			{
				name: 'skip',
				description: 'Skip to the next song in the queue',
			},
			{
				name: 'queue',
				description: 'See the music queue',
			},
			{
				name: 'pause',
				description: 'Pauses the song that is currently playing',
			},
			{
				name: 'resume',
				description: 'Resume playback of the current song',
			},
			{
				name: 'leave',
				description: 'Leave the voice channel',
			},
		]);

		await message.reply('Deployed!');
	}
});

/**
 * Maps guild IDs to music subscriptions, which exist if the bot has an active VoiceConnection to the guild.
 */
const subscriptions = new Map<Snowflake, MusicSubscription>();


// Button handling
client.on('interactionCreate', async (interaction: Interaction) => {

	/* if (!interaction.isButton() || !interaction.guildId) return;
	let subscription = subscriptions.get(interaction.guildId);
	
	if(interaction.customId === 'music_play_pause') {
		await interaction.deferUpdate();
		if (subscription) {
			(subscription.audioPlayer.state.status == AudioPlayerStatus.Playing) ? subscription.audioPlayer.pause() : subscription.audioPlayer.unpause();
			const receivedEmbed = interaction.message.embeds[0];
			const row = new MessageActionRow()
					.addComponents(
					  new MessageButton()
						  .setCustomId('music_play_pause')
						  .setEmoji('⏯️')
						  .setLabel((subscription.audioPlayer.state.status == AudioPlayerStatus.Playing) ? 'Pause' : 'Play')
						  .setStyle('SECONDARY'),
					  new MessageButton()
						  .setCustomId('music_skip')
						  .setEmoji('⏭️')
						  .setLabel('Skip')
						  .setStyle('SECONDARY'),
					);
			await interaction.editReply({content: '',embeds: [receivedEmbed], components: [row]})
		} else {
			await interaction.reply('Not playing in this server!');
		}
	}

	if(interaction.customId === 'music_skip') {
		await interaction.deferUpdate();
		if (subscription) {
			const receivedEmbed = interaction.message.embeds[0];
			const row = new MessageActionRow()
					.addComponents(
					  new MessageButton()
						  .setCustomId('music_play_pause')
						  .setEmoji('⏯️')
						  .setLabel((subscription.audioPlayer.state.status == AudioPlayerStatus.Playing) ? 'Pause' : 'Play')
						  .setStyle('SECONDARY'),
					  new MessageButton()
						  .setCustomId('music_skip')
						  .setEmoji('⏭️')
						  .setLabel('Skip')
						  .setStyle('SECONDARY'),
					);
			subscription.audioPlayer.stop();
			await interaction.editReply({content: 'Skipped song!', embeds: [receivedEmbed], components: [row]});
		} else {
			await interaction.reply('Not playing in this server!');
		}
	} */
});

// Handles slash command interactions
client.on('interactionCreate', async (interaction: Interaction) => {

	if (!interaction.isCommand() || !interaction.guildId) return;
	let subscription = subscriptions.get(interaction.guildId);


	if (interaction.commandName === 'play') {
		await interaction.deferReply();
		// Extract the video URL from the command
		const url = interaction.options.get('song')!.value! as string;

		// If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
		// and create a subscription.
		if (!subscription) {
			if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
				const channel = interaction.member.voice.channel;
				subscription = new MusicSubscription(
					joinVoiceChannel({
						channelId: channel.id,
						guildId: channel.guild.id,
						adapterCreator: channel.guild.voiceAdapterCreator,
					}),
				);
				subscription.voiceConnection.on('error', console.warn);
				subscriptions.set(interaction.guildId, subscription);
				
			}
		}

		// If there is no subscription, tell the user they need to join a channel.
		if (!subscription) {
			await interaction.followUp('Join a voice channel and then try that again!');
			return;
		}

		// Make sure the connection is ready before processing the user's request
		try {
			await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
		} catch (error) {
			console.warn(error);
			await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
			return;
		}

		try {
			// Erste einen song, dann rest queuen
			if (await ytpl.validateID(url)) {
				const playlist = await ytpl(url, { limit: 25 });
				//console.log('YTPL Results', playlist.items);

				const track = await Track.from(playlist.items[0].shortUrl, {
					onStart() {
						//interaction.followUp({ content: `Now playing: **${track.title}**`}).catch(console.warn);
						const TrackEmbed = new MessageEmbed()
						.setColor('#0099ff')
						  .setTitle(':play_pause:  Now playing  :musical_note:')
						  .setDescription(`[${track.title}](${track.url})`)
						  .setImage(track.thumbnail)
						  .addFields(
							{ name: 'Youtube Channel:', value: `[${track.channel}](${track.channelUrl})` },
						  )
						  .setFooter(`Requested by ${interaction.member.user.username}`, interaction.user.avatarURL())
						  .setTimestamp(interaction.createdTimestamp);

						  const row = new MessageActionRow()
						  .addComponents(
							new MessageButton()
								.setCustomId('music_play_pause')
								.setEmoji('⏯️')
								.setLabel((subscription.audioPlayer.state.status == AudioPlayerStatus.Playing) ? 'Pause' : 'Play')
								.setStyle('SECONDARY'),
							new MessageButton()
								.setCustomId('music_skip')
								.setEmoji('⏭️')
								.setLabel('Skip')
								.setStyle('SECONDARY'),
						  );
						
						  interaction.editReply({embeds: [TrackEmbed]/* , components: [row] */});
					},
					onFinish() {
						interaction.editReply({ content: 'Now finished!' }).catch(console.warn);
					},
					onError(error) {
						console.warn(error);
						interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true }).catch(console.warn);
					},
				});
				subscription.enqueue(track);
				await interaction.editReply(`Enqueued **${track.title}**`);

				playlist.items.shift();

				playlist.items.forEach(async video => {
					// Attempt to create a Track from the user's video URL
					const track = await Track.from(video.shortUrl, {
						onStart() {
							//interaction.followUp({ content: `Now playing: **${track.title}**`}).catch(console.warn);
							const TrackEmbed = new MessageEmbed()
							.setColor('#0099ff')
							  .setTitle(':play_pause:  Now playing  :musical_note:')
							  .setDescription(`[${track.title}](${track.url})`)
							  .setImage(track.thumbnail)
							  .addFields(
								{ name: 'Youtube Channel:', value: `[${track.channel}](${track.channelUrl})` },
							  )
							  .setFooter(`Requested by ${interaction.member.user.username}`, interaction.user.avatarURL())
							  .setTimestamp(interaction.createdTimestamp);
							
							const row = new MessageActionRow()
							.addComponents(
							  new MessageButton()
								  .setCustomId('music_play_pause')
								  .setEmoji('⏯️')
								  .setLabel((subscription.audioPlayer.state.status == AudioPlayerStatus.Playing) ? 'Pause' : 'Play')
								  .setStyle('SECONDARY'),
							  new MessageButton()
								  .setCustomId('music_skip')
								  .setEmoji('⏭️')
								  .setLabel('Skip')
								  .setStyle('SECONDARY'),
							);
							
							interaction.channel.send({embeds: [TrackEmbed]/* , components: [row] */});
						},
						onFinish() {
							interaction.editReply({ content: 'Now finished!' }).catch(console.warn);
						},
						onError(error) {
							console.warn(error);
							interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true }).catch(console.warn);
						},
					});
					subscription.enqueue(track);
					await interaction.editReply(`Enqueued **${track.title}**`);
				});
			} else {
				// Attempt to create a Track from the user's video URL
				const track = await Track.from(url, {
					onStart() {
						//interaction.followUp({ content: `Now playing: **${track.title}**`}).catch(console.warn);
						const TrackEmbed = new MessageEmbed()
						.setColor('#0099ff')
						  .setTitle(':play_pause:  Now playing  :musical_note:')
						  .setDescription(`[${track.title}](${track.url})`)
						  .setImage(track.thumbnail)
						  .addFields(
							{ name: 'Youtube Channel:', value: `[${track.channel}](${track.channelUrl})` },
						  )
						  .setFooter(`Requested by ${interaction.member.user.username}`, interaction.user.avatarURL())
						  .setTimestamp(interaction.createdTimestamp);
						
						const row = new MessageActionRow()
						.addComponents(
						  new MessageButton()
							  .setCustomId('music_play_pause')
							  .setEmoji('⏯️')
							  .setLabel((subscription.audioPlayer.state.status == AudioPlayerStatus.Playing) ? 'Pause' : 'Play')
							  .setStyle('SECONDARY'),
						  new MessageButton()
							  .setCustomId('music_skip')
							  .setEmoji('⏭️')
							  .setLabel('Skip')
							  .setStyle('SECONDARY'),
						);
						
						(interaction.replied) ? interaction.channel.send({embeds: [TrackEmbed]/* , components: [row] */}) : interaction.editReply({embeds: [TrackEmbed]/* , components: [row] */});
					},
					onFinish() {
						interaction.editReply({ content: 'Now finished!' }).catch(console.warn);
					},
					onError(error) {
						console.warn(error);
						interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true }).catch(console.warn);
					},
				});
				// Enqueue the track and reply a success message to the user
				subscription.enqueue(track);
				await interaction.editReply(`Enqueued **${track.title}**`);
			}
			
		} catch (error) {
			console.warn(error);
			await interaction.followUp('Failed to play track, please try again later!');
		}
	} else if (interaction.commandName === 'skip') {
		//await interaction.deferReply();
		if (subscription) {
			// Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
			// listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
			// will be loaded and played.
			subscription.audioPlayer.stop();
			await interaction.reply('Skipped song!');
		} else {
			await interaction.reply('Not playing in this server!');
		}
	} else if (interaction.commandName === 'queue') {
		// Print out the current queue, including up to the next 5 tracks to be played.
		if (subscription) {
			const current =
				subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
					? `Nothing is currently playing!`
					: `Playing **${(subscription.audioPlayer.state.resource as AudioResource<Track>).metadata.title}**`;

			const queue = subscription.queue
				.slice(0, 5)
				.map((track, index) => `${index + 1}) ${track.title}`)
				.join('\n');

			await interaction.reply(`${current}\n\n${queue}`);
		} else {
			await interaction.reply('Not playing in this server!');
		}
	} else if (interaction.commandName === 'pause') {
		//await interaction.deferReply();
		if (subscription) {
			subscription.audioPlayer.pause();
			await interaction.reply({ content: `Paused!`});
		} else {
			await interaction.reply('Not playing in this server!');
		}
	} else if (interaction.commandName === 'resume') {
		//await interaction.deferReply();
		if (subscription) {
			subscription.audioPlayer.unpause();
			await interaction.reply({ content: `Unpaused!`});
		} else {
			await interaction.reply('Not playing in this server!');
		}
	} else if (interaction.commandName === 'leave') {
		if (subscription) {
			subscription.voiceConnection.destroy();
			subscriptions.delete(interaction.guildId);
			await interaction.reply({ content: `Left channel!`, ephemeral: true });
		} else {
			await interaction.reply('Not playing in this server!');
		}
	} else if (interaction.commandName === 'w2g') {
		let url = (interaction.options.get('url')) ? interaction.options.get('url').value as string : '';
		await w2g(interaction, url);

	} else {
		await interaction.reply('Unknown command');
	}
});

client.on('error', console.warn);

void client.login(token);
