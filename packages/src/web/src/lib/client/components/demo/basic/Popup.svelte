<script lang="ts">
	import Icon from '$lib/client/components/utils/Icon.svelte';

	let { rank, width, height }: { rank: number; width: number; height: number } = $props();

	let iconSize = Math.min(width, height) / 2 + 4;
</script>

<div class="popup" style:width={width + 'px'} style:height={height + 'px'} style:padding-bottom={4 + 'px'}>
	<Icon name="forest" size={iconSize} filled={true} />
	<div class="rank">
		<span class="value">{rank}</span>
		<span class="label">Rank</span>
	</div>
	<Icon name="forest" size={iconSize} filled={true} />
</div>

<style lang="less">
	.popup {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 10px;
		color: color-mix(in srgb, var(--map-style-primary) 40%, #888 60%);
		font-weight: 600;
		font-size: 14px;

		.rank {
			display: flex;
			flex-direction: column;
			align-items: center;

			.value {
				font-size: 18px;
				font-weight: 600;
			}

			.label {
				font-size: 12px;
				font-weight: 500;
				line-height: 12px;
				color: gray;
			}
		}
	}
</style>
