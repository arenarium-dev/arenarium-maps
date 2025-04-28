<script lang="ts">
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import { goto } from '$app/navigation';

	import Menu from '$lib/client/components/utils/Menu.svelte';
	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Image from '$lib/client/components/utils/Image.svelte';

	import { app } from '$lib/client/state/app.svelte';

	let user = $derived(app.user.details);

	// Menu
	let menuComponent = $state<ReturnType<typeof Menu>>();

	// User
	async function onUserClick() {
		menuComponent?.hide();
		await goto('/keys');
	}

	async function onUserSignIn() {
		menuComponent?.hide();
		await app.user.signIn();
	}

	async function onUserSignOut() {
		menuComponent?.hide();
		await app.user.signOut();
	}

	// Theme
	let theme = $derived(app.theme.get());

	function onThemeClick(e: Event) {
		e.stopPropagation();

		switch (theme) {
			case 'light':
				app.theme.set('dark');
				break;
			case 'dark':
				app.theme.set('light');
				break;
		}
	}
</script>

<Menu bind:this={menuComponent}>
	{#snippet button()}
		<button class="button">
			{#if user}
				<Image src={user.image} width={36} height={36} radius={18} />
			{:else}
				<Icon name={'account_circle'} filled={true} />
			{/if}
		</button>
	{/snippet}
	{#snippet menu()}
		<div class="menu">
			<div class="content">
				{#if user}
					<div class="header">
						<Image src={user.image} width={40} height={40} radius={20} />
						<div class="user">
							<div class="name truncate-text">{user.name}</div>
							<div class="email truncate-text">{user.email}</div>
						</div>
					</div>
					<div class="divider"></div>
					<div class="group">
						<div class="item">
							<button class="content" onclick={onUserClick}>
								<Icon name={'key'} />
								<span class="text">API Keys</span>
							</button>
						</div>
						<div class="item">
							<button class="content" onclick={onUserSignOut}>
								<Icon name={'logout'} />
								<span class="text">Sign Out</span>
							</button>
						</div>
					</div>
				{:else}
					<div class="group">
						<div class="item">
							<button class="content" onclick={onUserSignIn}>
								<Icon name={'account_circle'} />
								<span class="text">Sign In</span>
							</button>
						</div>
					</div>
				{/if}
				<div class="divider"></div>
				<div class="group">
					<div class="item">
						{#key theme}
							<button class="content" onclick={onThemeClick} transition:slide={{ duration: 125, easing: sineInOut }}>
								<Icon name={theme == 'light' ? 'dark_mode' : 'light_mode'} />
								<span class="text">{theme == 'light' ? 'Dark' : 'Light'} Mode</span>
							</button>
						{/key}
					</div>
				</div>
				<div class="divider"></div>
				<div class="group">
					<div class="item">
						<a href="/#about" class="content">
							<Icon name={'info'} />
							<div class="text">About</div>
						</a>
					</div>
					<div class="item">
						<a class="content" href="mailto:arenarium.dev@gmail.com?subject=Feedback" target="_blank">
							<Icon name={'mail'} />
							<div class="text">Feedback</div>
						</a>
					</div>
				</div>
			</div>
		</div>
	{/snippet}
</Menu>

<style lang="less">
	.button {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border-radius: 18px;
		color: var(--on-surface-dim);
		background-color: var(--surface);
		transition: all ease-in-out 125ms;
	}

	.button:hover {
		color: var(--on-surface);
		background-color: var(--surface-container-low);
	}

	.menu {
		margin: 0px 12px;
		margin-top: 36px;
		border-radius: 12px;
		box-shadow:
			0px 0px 2px 2px rgba(0, 0, 0, 0.2),
			0px 2px 4px rgba(0, 0, 0, 0.2);

		.content {
			min-width: 196px;
			background-color: var(--surface);
			border-radius: 12px;
			overflow: hidden;
			transition: background-color ease-in-out 125ms;

			.header {
				display: grid;
				grid-template-columns: 40px auto;
				gap: 16px;
				align-items: center;
				padding: 16px;

				.user {
					display: flex;
					flex-direction: column;
					gap: 4px;
					overflow: hidden;

					.name {
						font-size: 16px;
						font-weight: 600;
						color: var(--on-surface);
					}

					.email {
						font-size: 13px;
						font-weight: 500;
						color: var(--on-surface-dimmest);
					}
				}
			}

			.divider {
				height: 1px;
				width: 100%;
				background-color: var(--surface-container-high);
			}

			.group {
				padding: 4px 0px;

				.item {
					display: flex;
					flex-direction: column;
					padding: 4px 8px;

					.content {
						display: flex;
						flex-direction: row;
						align-items: center;
						gap: 24px;
						padding: 6px 16px;
						border-radius: 8px;
						background-color: var(--surface);
						color: var(--on-surface);
						transition: background-color ease-in-out 125ms;

						.text {
							font-size: 14px;
							font-weight: bold;
							line-height: 18px;
							padding-top: 1.5px;
						}
					}

					.content:hover {
						background-color: var(--surface-container-low);
					}
				}
			}
		}
	}

	:global(.auth > button) {
		width: 100%;
	}
</style>
