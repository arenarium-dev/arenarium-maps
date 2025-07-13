import { app } from '$lib/client/state/app.svelte';

import type { MapConfiguration } from '@arenarium/maps';

import z from 'zod';

export const DemoSchema = z.enum(['social', 'rentals', 'bookings', 'bnb', 'events', 'news', 'srbija-nekretnine', 'cityexpert', 'bookaweb', 'roommateor']);
export type Demo = z.infer<typeof DemoSchema>;

export const DemoMapSchema = z.enum(['maplibre', 'mapbox', 'googlemaps']);
export type DemoMap = z.infer<typeof DemoMapSchema>;

export const DemoSizeSchema = z.enum(['small', 'large']);
export type DemoSize = z.infer<typeof DemoSizeSchema>;

export const DemoStyleSchema = z.enum(['website', 'light', 'dark', 'default']);
export type DemoStyle = z.infer<typeof DemoStyleSchema>;

export function getDemoName(demo: Demo) {
	switch (demo) {
		case 'social':
			return 'Social';
		case 'rentals':
			return 'Rentals';
		case 'bookings':
			return 'Bookings';
		case 'bnb':
			return 'BnB';
		case 'events':
			return 'Events';
		case 'news':
			return 'News';
		case 'srbija-nekretnine':
			return 'srbija-nekretnine.org';
		case 'cityexpert':
			return 'cityexpert.rs';
		case 'bookaweb':
			return 'bookaweb.com';
		case 'roommateor':
			return 'roommateor.com';
	}
}

export function getDemoColors(demo: Demo, style: DemoStyle): { background: string; primary: string; text: string } {
	switch (demo) {
		case 'srbija-nekretnine': {
			return {
				background: 'white',
				primary: '#ff4400',
				text: 'black'
			};
		}
		case 'cityexpert':
		case 'bookaweb': {
			return {
				background: 'white',
				primary: 'white',
				text: 'black'
			};
		}
		case 'roommateor': {
			return {
				background: 'white',
				primary: '#AEBD38',
				text: 'black'
			};
		}
		default: {
			let colorLight = 'darkgreen';
			let colorDark = 'lightgreen';

			switch (demo) {
				case 'social': {
					colorLight = '#08f';
					colorDark = '#08f';
					break;
				}
				case 'bookings': {
					colorLight = 'midnightblue';
					colorDark = 'lightblue';
					break;
				}
				case 'bnb': {
					colorLight = '#FF385C';
					colorDark = '#FF385C';
					break;
				}
			}

			switch (style) {
				case 'website': {
					return app.theme.get() == 'dark'
						? { background: 'var(--surface)', primary: colorDark, text: 'var(--on-surface)' }
						: { background: 'var(--surface)', primary: colorLight, text: 'var(--on-surface)' };
				}
				case 'light': {
					return { background: 'white', primary: colorLight, text: 'black' };
				}
				case 'dark': {
					return { background: 'black', primary: colorDark, text: 'white' };
				}
				case 'default': {
					return { background: 'white', primary: 'purple', text: 'black' };
				}
			}
		}
	}
}

export function getDemoPosition(demo: Demo): { lat: number; lng: number; zoom: number } {
	switch (demo) {
		case 'srbija-nekretnine':
		case 'cityexpert':
		case 'bookaweb':
		case 'roommateor': {
			return {
				lat: 44.811222,
				lng: 20.450989,
				zoom: 12
			};
		}
		default: {
			return {
				lat: 51.505,
				lng: -0.09,
				zoom: 4
			};
		}
	}
}

export function getDemoConfiguration(demo: Demo): MapConfiguration {
	switch (demo) {
		case 'bookings':
		case 'cityexpert': {
			return {
				pin: {
					fade: false
				},
				states: {
					api: '/api/demo/states'
				}
			};
		}
		case 'bookaweb': {
			return {
				pin: {
					fade: false,
					maxZoom: 3
				},
				states: {
					api: '/api/demo/states'
				}
			};
		}
		default: {
			return {
				pin: {
					fade: true
				},
				states: {
					api: '/api/demo/states'
				}
			};
		}
	}
}

export function getPinDimensions(demo: Demo, size: DemoSize): { width: number; height: number; radius: number } {
	switch (demo) {
		case 'social':
			switch (size) {
				case 'large':
					return { width: 16, height: 16, radius: 8 };
				case 'small':
					return { width: 14, height: 14, radius: 8 };
			}
		case 'rentals':
			switch (size) {
				case 'large':
					return { width: 24, height: 24, radius: 6 };
				case 'small':
					return { width: 20, height: 20, radius: 4 };
			}
		case 'bookings':
			switch (size) {
				case 'large':
					return { width: 40, height: 24, radius: 12 };
				case 'small':
					return { width: 36, height: 22, radius: 11 };
			}
		case 'cityexpert':
			return { width: 24, height: 24, radius: 12 };
		case 'roommateor':
			return { width: 20, height: 20, radius: 10 };
		default:
			return { width: 14, height: 14, radius: 7 };
	}
}

export function getTooltipDimensions(demo: Demo, size: DemoSize, id: string): { width: number; height: number; margin: number; radius: number } {
	switch (demo) {
		case 'social':
			const lines = 2 + (Number.parseInt(id) % 3);
			switch (size) {
				case 'large':
					return { width: 160, height: 64 + lines * 16.8, margin: 8, radius: 12 };
				case 'small':
					return { width: 128, height: 51.2 + lines * 13.6, margin: 6, radius: 8 };
			}
		case 'rentals':
			switch (size) {
				case 'large':
					return { width: 128, height: 104, margin: 8, radius: 12 };
				case 'small':
					return { width: 96, height: 80, margin: 6, radius: 8 };
			}
		case 'bookings':
			switch (size) {
				case 'large':
					return { width: 108, height: 64, margin: 8, radius: 12 };
				case 'small':
					return { width: 96, height: 56, margin: 6, radius: 8 };
			}
		case 'bnb':
			switch (size) {
				case 'large':
					return { width: 44, height: 26, margin: 4, radius: 10 };
				case 'small':
					return { width: 36, height: 22, margin: 4, radius: 8 };
			}
		case 'srbija-nekretnine':
			return { width: 156, height: 128, margin: 8, radius: 12 };
		case 'cityexpert':
			return { width: 156, height: 128, margin: 8, radius: 12 };
		case 'bookaweb':
			return { width: 164, height: 132, margin: 8, radius: 12 };
		case 'roommateor':
			return { width: 48, height: 26, margin: 4, radius: 10 };
		default:
			return { width: 48, height: 48, margin: 4, radius: 4 };
	}
}

export function getPopupDimensions(demo: Demo, size: DemoSize): { width: number; height: number; margin: number; radius: number } | undefined {
	switch (demo) {
		case 'bookings':
			switch (size) {
				case 'large':
					return { width: 216, height: 160, margin: 6, radius: 16 };
				case 'small':
					return { width: 164, height: 144, margin: 6, radius: 12 };
			}
		case 'bnb':
			switch (size) {
				case 'large':
					return { width: 164, height: 143, margin: 4, radius: 16 };
				case 'small':
					return { width: 140, height: 120, margin: 4, radius: 12 };
			}
		case 'roommateor':
			return { width: 196, height: 246, margin: 4, radius: 16 };
	}
}

export function getDemoAutoUpdate(demo: Demo) {
	switch (demo) {
		case 'bookaweb':
			return true;
		default:
			return false;
	}
}

export function isDemoCustom(demo: Demo) {
	return demo == 'cityexpert' || demo == 'srbija-nekretnine' || demo == 'bookaweb' || demo == 'roommateor';
}

export const rentalImages = [
	'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1503174971373-b1f69850bded?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1618219740975-d40978bb7378?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1609347744425-175ecbd3cc0e?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1727706572437-4fcda0cbd66f?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1650137959510-d64eef290e86?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1637747018746-bece2b8a0309?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1617104611622-d5f245d317f0?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1534595038511-9f219fe0c979?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1675279200694-8529c73b1fd0?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1613575831056-0acd5da8f085?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1665249934445-1de680641f50?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1667510436110-79d3dabc2008?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1612320648993-61c1cd604b71?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1617201929478-8eedff7508f9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1650137938625-11576502aecd?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D'
];

export const userPosts = [
	{
		id: 1,
		author_handle: '@TechGuruReviews',
		text: "Just dropped my new tech review! 🚀 Check out my in-depth thoughts on the latest smartphone and see if it's worth the hype. Link in bio for the full breakdown! #TechReview #NewGadget"
	},
	{
		id: 2,
		author_handle: '@CodeWizard',
		text: 'Coffee + coding = a perfect morning. ☕ Building something cool today. What are you all working on? #DeveloperLife #MorningVibes'
	},
	{
		id: 3,
		author_handle: '@DocumentaryFan',
		text: "Mind blown by this documentary! 🤯 Seriously, if you have an hour, go watch it right now. You won't regret it. #MustWatch #Documentary"
	},
	{
		id: 4,
		author_handle: '@FitLifeJourney',
		text: "Finally hit my fitness goal of running a sub-20 minute 5K! 💪 So many early mornings and pushes, but consistency truly is key. What's been your biggest fitness achievement lately? #FitnessMotivation #GoalAchieved"
	},
	{
		id: 5,
		author_handle: '@WanderlustDreamer',
		text: 'Dreaming of my next travel adventure. ✈️ Thinking somewhere with amazing food and even better views. Any hidden gems I should add to my list? #TravelGoals #Wanderlust'
	},
	{
		id: 6,
		author_handle: '@BookwormBabe',
		text: "Just finished an absolutely captivating book! 📚 The author's prose was stunning and the plot kept me hooked until the very last page. Highly recommend! What are you currently lost in? #Bookworm #ReadingCommunity"
	},
	{
		id: 7,
		author_handle: '@ProductivityPro',
		text: 'Need some serious productivity hacks that actually work! Share your best tips and tricks for staying focused and getting things done. 👇 #Productivity #WorkTips'
	},
	{
		id: 8,
		author_handle: '@AppReviewer',
		text: 'Loving the new update to my favorite productivity app! The seamless integration with other tools has been a game-changer for my workflow. Big thumbs up! #AppReview #Tech'
	},
	{
		id: 9,
		author_handle: '@FoodieFiesta',
		text: "What's your ultimate go-to comfort food after a ridiculously long day? Mine's definitely a loaded deep-dish pizza, no questions asked! 🍕 #Foodie #ComfortFood"
	},
	{
		id: 10,
		author_handle: '@ExcitingNewsSoon',
		text: "Excited to share some pretty significant news with you all next week! Been working on this for a while and can't wait to reveal it. Stay tuned! 👀 #ComingSoon #BigReveal"
	},
	{
		id: 11,
		author_handle: '@DeepThinker',
		text: "Random thought of the day: Why do we say 'drive' on a parkway and 'park' on a driveway? English is wild. 🤔 #ShowerThoughts #DeepThoughts"
	},
	{
		id: 12,
		author_handle: '@RunnerHigh',
		text: "Just crushed a new personal best on my morning run! Feeling absolutely strong and ready to tackle the day. That runner's high is real! #Running #FitnessJourney"
	},
	{
		id: 13,
		author_handle: '@LearnSomethingNew',
		text: "Learning something new every single day! Today's lesson: the absolutely crucial importance of proper hydration for overall well-being and energy levels. Don't forget to drink your water! 💧 #HealthTips #LifelongLearning"
	},
	{
		id: 14,
		author_handle: '@ConcertGoer',
		text: "Who else desperately misses the electric atmosphere of live concerts? The energy, the crowd, the music – nothing beats it. Can't wait for the next one! 🎸 #MusicLover #ConcertVibes"
	},
	{
		id: 15,
		author_handle: '@PlantParentProbs',
		text: 'My plant collection is officially, undeniably out of control. Send help (or, even better, more unique plant recommendations)! 🪴 My apartment is becoming a jungle. #PlantParent #GreenThumb'
	},
	{
		id: 16,
		author_handle: '@NatureLover',
		text: 'Just witnessed the most breathtaking sunset tonight. Sometimes you just need to pause, breathe, and appreciate the simple, profound beauty of the natural world around us. 🌅 #NatureLover #Sunset'
	},
	{
		id: 17,
		author_handle: '@SkillMastery',
		text: "What's one skill you're currently pouring your energy into mastering? Mine's diving deep into learning Mandarin! It's challenging but so rewarding. 🗣️ #SkillDevelopment #Learning"
	},
	{
		id: 18,
		author_handle: '@PositiveVibesOnly',
		text: "Happy Wednesday, everyone! What's one little thing that's making you genuinely smile today, big or small? Share the good vibes! 😊 #MidweekMotivation #GoodVibes"
	},
	{
		id: 19,
		author_handle: '@BingeWatcher',
		text: 'Debating my next streaming binge. I need something truly captivating, a series that will hook me from the first episode and keep me up all night. Any recommendations for a gripping drama or thrilling mystery? #NetflixAndChill #TVSeries'
	},
	{
		id: 20,
		author_handle: '@GratefulHeart',
		text: 'Feeling incredibly grateful for my amazing online community and the endless support and encouragement you all consistently provide. You truly rock! 🙏 #CommunityLove #Thankful'
	}
];
