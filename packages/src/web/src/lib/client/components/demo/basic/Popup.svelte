<script lang="ts">
	import Icon from '$lib/client/components/utils/Icon.svelte';

	let { id }: { id: string } = $props();
</script>

<div class="popup">
	<Icon name="eco" size={40}/>
	<span>{id}</span>
</div>

<style lang="less">
	.popup {
		width: 64px;
		height: 64px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--secondary);
		font-weight: 600;
		font-size: 11px;
	}
</style>
