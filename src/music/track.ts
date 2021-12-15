import { getInfo } from 'ytdl-core';
import { AudioResource, createAudioResource, demuxProbe } from '@discordjs/voice';
//import { exec as ytdl } from 'youtube-dl-exec';
import ytdl = require('ytdl-core');
import { Interaction } from 'discord.js';
const ytSearch = require('yt-search');
import ytpl = require('ytpl');

/**
 * This is the data required to create a Track object.
 */
export interface TrackData {
	url: string;
	title: string;
	thumbnail: string;
	channel: string;
	channelUrl: string;
	onStart: () => void;
	onFinish: () => void;
	onError: (error: Error) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
 * A Track represents information about a YouTube video (in this context) that can be added to a queue.
 * It contains the title and URL of the video, as well as functions onStart, onFinish, onError, that act
 * as callbacks that are triggered at certain points during the track's lifecycle.
 *
 * Rather than creating an AudioResource for each video immediately and then keeping those in a queue,
 * we use tracks as they don't pre-emptively load the videos. Instead, once a Track is taken from the
 * queue, it is converted into an AudioResource just in time for playback.
 */
export class Track implements TrackData {
	public readonly url: string;
	public readonly title: string;
	public readonly thumbnail: string;
	public readonly channel: string;
	public readonly channelUrl: string;
	public readonly onStart: () => void;
	public readonly onFinish: () => void;
	public readonly onError: (error: Error) => void;

	private constructor({ url, title, thumbnail, channel, channelUrl, onStart, onFinish, onError }: TrackData) {
		this.url = url;
		this.title = title;
		this.thumbnail = thumbnail;
		this.channel = channel;
		this.channelUrl = channelUrl;
		this.onStart = onStart;
		this.onFinish = onFinish;
		this.onError = onError;
	}

	/**
	 * Creates an AudioResource from this Track.
	 */
	public createAudioResource()/* : Promise<AudioResource<Track>> */ {
		const stream = ytdl(this.url, { highWaterMark: 1<<25, quality: 'highestaudio' });
			const resource = createAudioResource(stream, {  metadata: this, inlineVolume: true });
			resource.volume.setVolume(0.5);
			resource.encoder.setBitrate(128000);
			resource.encoder.setFEC(true);
			resource.encoder.setPLP(100);
			return resource;
		/* return new Promise((resolve, reject) => {
			const process = ytdl(
				this.url,
				{
					//extractAudio: true,
					format: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio'
				},
				{ stdio: ['ignore', 'pipe', 'ignore'] },
			);
			if (!process.stdout) {
				reject(new Error('No stdout'));
				return;
			}
			const stream = process.stdout;
			const onError = (error: Error) => {
				if (!process.killed) process.kill();
				stream.resume();
				reject(error);
			};
			process
				.once('spawn', () => {
					demuxProbe(stream)
						.then((probe: { stream: any; type: any; }) => resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type, inlineVolume: true })))
						.catch(onError);
				})
				.catch(onError);
		}); */
	}

	/**
	 * Creates a Track from a video URL or Name and lifecycle callback methods.
	 *
	 * @param url The URL or Name of the video
	 * @param methods Lifecycle callbacks
	 *
	 * @returns The created Track
	 */
	public static async from(url: string, methods: Pick<Track, 'onStart' | 'onFinish' | 'onError'>): Promise<Track> {
		
		let get_info = async () => {
			if (ytdl.validateURL(url)) {
				
				
				const vid_info = await getInfo(url);
				return vid_info;
			} else {
				const video_finder = async (query) =>{
					const video_result = await ytSearch(query);
					return (video_result.videos.length > 1) ? video_result.videos[0] : null;
				}
	
				const video = await video_finder(url);
				if (video){
					const vid_info = await getInfo(video.url);
					return vid_info;
				} else {
					throw Error('Error finding video');
				}
			}
		}

		const info = await get_info();
		
		

		// The methods are wrapped so that we can ensure that they are only called once.
		const wrappedMethods = {
			onStart() {
				wrappedMethods.onStart = noop;
				methods.onStart();
			},
			onFinish() {
				wrappedMethods.onFinish = noop;
				methods.onFinish();
			},
			onError(error: Error) {
				wrappedMethods.onError = noop;
				methods.onError(error);
			},
		};
		//console.log('Thumbnails: ', info.videoDetails.thumbnails)
		return new Track({
			title: info.videoDetails.title,
			url: info.videoDetails.video_url,
			thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length-1]['url'],
			channel: info.videoDetails.author.name,
			channelUrl: info.videoDetails.author.channel_url,
			...wrappedMethods,
		});
	}
}
