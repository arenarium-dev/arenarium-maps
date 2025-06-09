<div class="logo">
	<a href="https://arenarium.dev" target="_blank">
		<span class="text"> @arenarium/maps </span>
	</a>
</div>

<style lang="less">
	.logo {
		position: absolute;
		bottom: 0px;
		left: 0px;
		background-color: color-mix(in srgb, var(--map-style-background) 50%, transparent 50%);
		color: var(--map-style-text);
		font-size: 10px;
		line-height: normal;
		padding: 2px 5px;
		border-top-right-radius: 5px;
		box-shadow: 1px -1px 2px rgba(0, 0, 0, 0.2);

		a {
			display: flex;
			align-items: center;
			gap: 3px;
			color: var(--map-style-text);
			text-decoration: none;
			font-weight: 600;
		}
	}

	@media (max-width: 512px) {
		.logo {
			top: 0px;
			right: 0px;
			bottom: auto;
			left: auto;
			border-top-right-radius: 0px;
			border-bottom-left-radius: 5px;
		}
	}
</style>
