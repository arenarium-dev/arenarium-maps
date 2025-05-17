<script lang="ts">
	import Icon from '$lib/client/components/utils/Icon.svelte';

	let { id }: { id: string } = $props();
</script>

<div class="popup">
	<Icon name="eco" size={30}/>
	<span>{id}</span>
</div>

<style lang="less">
	.popup {
		width: 48px;
		height: 48px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: var(--primary);
		color: var(--secondary);
		font-weight: 600;
		font-size: 10px;
	}
</style>
