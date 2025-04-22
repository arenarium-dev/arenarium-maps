<script lang="ts">
	import Icon from '$lib/client/components/utils/Icon.svelte';
	import { app } from '$lib/client/state/app.svelte';

	let { children } = $props();

	function onThemeClick() {
		app.theme.set(app.theme.get() === 'dark' ? 'light' : 'dark');
	}
</script>

<div class="page">
	<div class="content">
		<div class="bar">
			<Icon name="globe"></Icon>
			<div class="title">@arenarium/maps</div>
			<div class="grow"></div>
			<button class="theme" onclick={onThemeClick}>
				<Icon name={app.theme.get() === 'dark' ? 'light_mode' : 'dark_mode'} />
			</button>
		</div>
		{@render children()}
	</div>
</div>

<style lang="less">
	@content-width: 1024px;

	.page {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: var(--surface-container);
		overflow: auto;

		.content {
			width: @content-width;
			flex-grow: 1;
			display: flex;
			flex-direction: column;
			border-left: 1px solid var(--surface-container-highest);
			border-right: 1px solid var(--surface-container-highest);
			background-color: var(--surface);

			.bar {
				position: sticky;
				width: 100%;
				top: 0px;
				height: 60px;
				display: flex;
				align-items: center;
				gap: 16px;
				padding: 24px;
				background-color: var(--surface);
				border-bottom: 1px solid var(--surface-container-highest);
				z-index: 1;

				.title {
					font-size: 20px;
					font-weight: 600;
					color: var(--on-surface);
				}

				button {
					width: 36px;
					height: 36px;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;

					&:hover {
						background-color: var(--primary-hover);
					}
				}
			}
		}
	}

	@media (max-width: 1024px) {
		.page {
			.content {
				width: 100%;
			}
		}
	}
</style>
