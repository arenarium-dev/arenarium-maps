<script lang="ts">
	import { onMount } from 'svelte';

	import { app } from '$lib/client/state/app.svelte';

	let { children } = $props();

	// Initialize
	onMount(() => {
		app.initialize();
	});
</script>

<svelte:head>
	<title>Arenarium Maps</title>
	<meta property="og:title" content="Arenarium Maps" />
	<meta property="og:type" content="website" />
	<meta property="og:description" content="Clean popups rendering for maps" />
	<meta property="og:url" content="https://maps.arenarium.dev" />
	<meta property="og:image" content="https://maps.arenarium.dev/favicon.png" />
</svelte:head>

{@render children()}

<style>
	:global {
		.light {
			--primary: rgb(22 93 30);
			--surface-tint: rgb(39 108 43);
			--on-primary: rgb(255 255 255);
			--primary-container: rgb(63 131 63);
			--on-primary-container: rgb(255 255 255);
			--secondary: rgb(74 101 71);
			--on-secondary: rgb(255 255 255);
			--secondary-container: rgb(208 239 200);
			--on-secondary-container: rgb(55 81 52);
			--tertiary: rgb(0 87 114);
			--on-tertiary: rgb(255 255 255);
			--tertiary-container: rgb(0 126 164);
			--on-tertiary-container: rgb(255 255 255);
			--error: rgb(186 26 26);
			--on-error: rgb(255 255 255);
			--error-container: rgb(255 218 214);
			--on-error-container: rgb(65 0 2);
			--background: rgb(247 251 241);
			--on-background: rgb(25 29 23);
			--surface: rgb(247 251 241);
			--on-surface: rgb(25 29 23);
			--surface-variant: rgb(220 229 214);
			--on-surface-variant: rgb(64 73 62);
			--outline: rgb(113 122 109);
			--outline-variant: rgb(192 201 187);
			--shadow: rgb(0 0 0);
			--scrim: rgb(0 0 0);
			--inverse-surface: rgb(45 50 44);
			--inverse-on-surface: rgb(239 242 233);
			--inverse-primary: rgb(144 216 138);
			--primary-fixed: rgb(171 244 164);
			--on-primary-fixed: rgb(0 34 4);
			--primary-fixed-dim: rgb(144 216 138);
			--on-primary-fixed-variant: rgb(7 83 21);
			--secondary-fixed: rgb(204 235 196);
			--on-secondary-fixed: rgb(8 32 9);
			--secondary-fixed-dim: rgb(176 207 170);
			--on-secondary-fixed-variant: rgb(51 77 49);
			--tertiary-fixed: rgb(191 232 255);
			--on-tertiary-fixed: rgb(0 31 42);
			--tertiary-fixed-dim: rgb(116 210 252);
			--on-tertiary-fixed-variant: rgb(0 77 101);
			--surface-dim: rgb(216 219 210);
			--surface-bright: rgb(247 251 241);
			--surface-container-lowest: rgb(255 255 255);
			--surface-container-low: rgb(241 245 236);
			--surface-container: rgb(236 239 230);
			--surface-container-high: rgb(230 233 224);
			--surface-container-highest: rgb(224 228 219);

			--color: #00bb00;
			--border: color-mix(in srgb, var(--outline-variant) 50%, var(--surface) 50%);
			--hover: color-mix(in srgb, var(--surface-container-high) 50%, transparent 50%);
		}

		.dark {
			--primary: rgb(144 216 138);
			--surface-tint: rgb(144 216 138);
			--on-primary: rgb(0 57 10);
			--primary-container: rgb(58 126 59);
			--on-primary-container: rgb(255 255 255);
			--secondary: rgb(176 207 170);
			--on-secondary: rgb(29 54 28);
			--secondary-container: rgb(43 69 41);
			--on-secondary-container: rgb(189 220 182);
			--tertiary: rgb(116 210 252);
			--on-tertiary: rgb(0 53 71);
			--tertiary-container: rgb(0 121 157);
			--on-tertiary-container: rgb(255 255 255);
			--error: rgb(255 180 171);
			--on-error: rgb(105 0 5);
			--error-container: rgb(147 0 10);
			--on-error-container: rgb(255 218 214);
			--background: rgb(16 20 15);
			--on-background: rgb(224 228 219);
			--surface: rgb(16 20 15);
			--on-surface: rgb(224 228 219);
			--surface-variant: rgb(64 73 62);
			--on-surface-variant: rgb(192 201 187);
			--outline: rgb(138 147 134);
			--outline-variant: rgb(64 73 62);
			--shadow: rgb(0 0 0);
			--scrim: rgb(0 0 0);
			--inverse-surface: rgb(224 228 219);
			--inverse-on-surface: rgb(45 50 44);
			--inverse-primary: rgb(39 108 43);
			--primary-fixed: rgb(171 244 164);
			--on-primary-fixed: rgb(0 34 4);
			--primary-fixed-dim: rgb(144 216 138);
			--on-primary-fixed-variant: rgb(7 83 21);
			--secondary-fixed: rgb(204 235 196);
			--on-secondary-fixed: rgb(8 32 9);
			--secondary-fixed-dim: rgb(176 207 170);
			--on-secondary-fixed-variant: rgb(51 77 49);
			--tertiary-fixed: rgb(191 232 255);
			--on-tertiary-fixed: rgb(0 31 42);
			--tertiary-fixed-dim: rgb(116 210 252);
			--on-tertiary-fixed-variant: rgb(0 77 101);
			--surface-dim: rgb(16 20 15);
			--surface-bright: rgb(54 58 52);
			--surface-container-lowest: rgb(11 15 10);
			--surface-container-low: rgb(25 29 23);
			--surface-container: rgb(29 33 27);
			--surface-container-high: rgb(39 43 37);
			--surface-container-highest: rgb(50 54 48);

			--color: #00dd00;
			--border: var(--surface-container);
			--hover: color-mix(in srgb, var(--surface-container-low) 50%, transparent 50%);

			.shadow-small {
				box-shadow:
					0 0 4px 2px rgb(from var(--shadow) r g b / 0.2),
					0 3px 6px rgb(from var(--shadow) r g b / 0.3);
			}

			.shadow-medium {
				box-shadow:
					0 10px 20px 3px rgb(from var(--shadow) r g b / 0.2),
					0 6px 10px rgb(from var(--shadow) r g b / 0.3);
			}

			.shadow-large {
				box-shadow:
					0 19px 38px 6px rgb(from var(--shadow) r g b / 0.2),
					0 10px 16px rgb(from var(--shadow) r g b / 0.3);
			}
		}

		:root {
			/* Derived */
			--on-surface-dim: color(from var(--on-surface) srgb r g b / 0.85);
			--on-surface-dimmest: color(from var(--on-surface) srgb r g b / 0.7);
			--outline-variant-dim: color-mix(in srgb, var(--outline-variant) 50%, transparent 50%);
		}

		html,
		body {
			position: absolute;
			width: 100%;
			height: 100%;
			font-family:
				'Roboto',
				-apple-system,
				BlinkMacSystemFont,
				'Segoe UI',
				'Helvetica Neue',
				Arial,
				sans-serif,
				'Apple Color Emoji',
				'Segoe UI Emoji',
				'Segoe UI Symbol';
			box-sizing: border-box;
			color: var(--on-surface);
			background-color: var(--surface);
			margin: 0;
			padding: 0;
			overscroll-behavior: none;
			touch-action: manipulation;
		}

		a {
			color: inherit;
			text-decoration: none;
		}

		label {
			display: block;
		}

		input,
		select,
		textarea {
			font-family: inherit;
			font-size: inherit;
			-webkit-padding: 8px 0;
			padding: 8px;
			margin: 0px;
			border: 1px solid #ccc;
			border-radius: 2px;
		}

		div:focus-visible,
		input:focus-visible,
		select:focus-visible,
		textarea:focus-visible {
			outline: none;
			font-family: inherit;
		}

		button {
			margin: 0;
			padding: 0;
			outline: none;
			border: none;
			cursor: pointer;
			color: var(--on-surface);
			font-family: inherit;
			text-align: start;
			background-color: transparent;
		}

		.shadow-small {
			box-shadow:
				0 0 4px 2px rgb(from var(--shadow) r g b / 0.2),
				0 3px 6px rgb(from var(--shadow) r g b / 0.3);
		}

		.shadow-medium {
			box-shadow:
				0 10px 20px 3px rgb(from var(--shadow) r g b / 0.2),
				0 6px 10px rgb(from var(--shadow) r g b / 0.3);
		}

		.shadow-large {
			box-shadow:
				0 19px 38px 6px rgb(from var(--shadow) r g b / 0.2),
				0 10px 16px rgb(from var(--shadow) r g b / 0.3);
		}

		.blur-background {
			background: rgba(0, 0, 0, 0.25);
			backdrop-filter: blur(2px);
			-webkit-backdrop-filter: blur(2px);
		}

		.truncate-text {
			min-width: 0px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.max-one-line {
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			line-clamp: 1;
			-webkit-line-clamp: 1;
			-webkit-box-orient: vertical;
		}

		.center {
			position: absolute;
			margin: auto;
			left: 0;
			right: 0;
			top: 0;
			bottom: 0;
		}

		.full-screen {
			position: fixed;
			top: 0px;
			left: 0px;
			height: 100%;
			width: 100%;
		}

		.grow {
			flex-grow: 1;
		}

		/* SCROLLBAR */

		/* For browsers that support `scrollbar-*` properties */
		@supports not (selector(::-webkit-scrollbar)) {
			:root {
				scrollbar-width: thin;
				scrollbar-color: var(--surface-container) var(--surface);
			}
		}

		/* Otherwise, use `::-webkit-scrollbar-*` pseudo-elements */
		@supports selector(::-webkit-scrollbar) {
			/* Width */
			::-webkit-scrollbar {
				height: 4px;
				width: 4px;
			}

			/* Track */
			::-webkit-scrollbar-track {
				background: var(--surface-container);
			}

			/* Track piece */
			::-webkit-scrollbar-track-piece {
				background: var(--surface-container);
			}

			/* Handle */
			::-webkit-scrollbar-thumb {
				background: var(--on-surface-dimmest);
				border-radius: 2px;
			}

			/* Handle on hover */
			::-webkit-scrollbar-thumb:hover {
				background: var(--on-surface-dim);
			}
		}
	}
</style>
