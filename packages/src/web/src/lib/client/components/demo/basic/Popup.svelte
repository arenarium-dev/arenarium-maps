<script lang="ts">
	import Icon from '$lib/client/components/utils/Icon.svelte';

	let { id, width, height }: { id: string; width: number; height: number } = $props();
</script>

<div class="popup" style:width={width + 'px'} style:height={height + 'px'}>
	<Icon name="eco" size={40} />
	<span>{id}</span>
</div>

<style lang="less">
	.popup {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--secondary);
		font-weight: 600;
		font-size: 12px;
	}
</style>
