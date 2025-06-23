<script lang="ts">
	import Icon from '$lib/client/components/utils/Icon.svelte';

	let { id }: { id: string } = $props();

	let icons = ['house', 'apartment'];
	let iconIndex = Number.parseInt(id) % icons.length;
	let icon = icons[iconIndex];
</script>

<div class="pin">
	{#if icon.length > 0}
		{#if icon == 'top'}
			<span class="top">${id}0</span>
		{:else}
			<div class="icon">
				<Icon name={icon} size={20} />
			</div>
		{/if}
	{:else}
		<div class="empty"></div>
	{/if}
</div>

<style lang="less">
	.pin {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--map-style-background);

		.icon {
			display: flex;
			padding: 1px;
		}

		.top {
			font-weight: 600;
			font-size: 12px;
			text-align: center;
			padding: 1px 3px;
		}

		.empty {
			width: 10px;
			height: 10px;
			border-radius: 50%;
		}
	}
</style>
