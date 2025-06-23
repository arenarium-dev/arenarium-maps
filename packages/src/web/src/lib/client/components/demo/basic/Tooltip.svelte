<script lang="ts">
	import Icon from '$lib/client/components/utils/Icon.svelte';

	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let iconSize = Math.min(width, height) - 4;
</script>

<div class="popup" style:width={width + 'px'} style:height={height + 'px'} style:padding-bottom={4 + 'px'}>
	<Icon name="eco" size={iconSize} filled={true} />
</div>

<style lang="less">
	.popup {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: color-mix(in srgb, var(--map-style-primary) 40%, #888 60%);
		font-weight: 600;
		font-size: 12px;
	}
</style>
