<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		src,
		loading = 'eager',
		width = 'auto',
		height = 'auto',
		radius = 0,
		shadow = false,
		naturalWidth = $bindable<number>(),
		naturalHeight = $bindable<number>(),
		children
	}: {
		src: string | null | undefined;
		loading?: 'eager' | 'lazy';
		width?: string | number;
		height?: string | number;
		radius?: number;
		shadow?: boolean;
		naturalWidth?: number;
		naturalHeight?: number;
		children?: Snippet | undefined;
	} = $props();

	let isLoaded = $state<boolean>(true);
</script>

{#snippet image()}
	<img
		style="border-radius: {radius}px;"
		{src}
		{loading}
		alt={src}
		{width}
		{height}
		bind:naturalWidth
		bind:naturalHeight
		onerror={() => (isLoaded = false)}
	/>
{/snippet}

{#if isLoaded}
	{#if shadow}
		<div class="image" style:border-radius="{radius}px;">
			{@render image()}
			<div class="shadow" style:border-radius="{radius}px;"></div>
		</div>
	{:else}
		{@render image()}
	{/if}
{:else if children}
	{@render children()}
{:else}
	<div class="placeholder" style:width="{width}px" style:height="{height}px" style:border-radius="{radius}px"></div>
{/if}

<style lang="less">
	img {
		object-fit: cover;
	}

	.image {
		position: relative;
		display: flex;
		background: transparent;

		.shadow {
			position: absolute;
			width: 100%;
			height: 100%;
			border-radius: 50%;
			box-shadow: inset 0px 0px 2px var(--shadow);
		}
	}

	.placeholder {
		background-color: var(--surface-container);
	}
</style>
