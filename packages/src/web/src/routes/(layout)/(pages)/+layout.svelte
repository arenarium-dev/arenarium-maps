<script lang="ts">
	let { children } = $props();
</script>

<div class="page">
	<div class="content">
		<div class="bar"></div>
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
			border-left: 2px solid var(--border);
			border-right: 2px solid var(--border);
			background-color: var(--surface);

			.bar {
				display: none;
				position: sticky;
				top: 0px;
				width: @content-width;
				height: 60px;
				background-color: var(--surface);
				border-bottom: 2px solid var(--border);
			}
		}
	}

	@media (max-width: 1024px) {
		.page {
			.content {
				width: 100%;

				.bar {
					display: initial;
					width: 100%;
					z-index: 1;
				}
			}
		}
	}
</style>
