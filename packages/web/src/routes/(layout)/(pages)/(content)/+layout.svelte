<script lang="ts">
	let { children } = $props();
</script>

<div class="container">
	<div class="page">
		{@render children()}
	</div>
</div>

<style lang="less">
	@page-width: 1024px;

	.container {
		flex-grow: 1;
		padding-top: 24px;
		padding-bottom: 24px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: var(--surface-container);
		overflow: auto;

		.page {
			width: @page-width;
			flex-grow: 1;
			display: flex;
			flex-direction: column;
			padding: 24px;
			border-radius: 12px;
			background-color: var(--surface);
			box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.2);
		}
	}

	@media (max-width: @page-width) {
		.container {
			padding: 0px;

			.page {
				width: 100%;
				border-radius: 0px;
				box-shadow: none;
			}
		}
	}
</style>
