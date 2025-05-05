<div class="popup">
	<div class="image"></div>
	<div class="text">
		<div class="price"></div>
		<div class="details"></div>
	</div>
</div>

<style lang="less">
	.popup {
		width: 150px;
		height: 150px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 4px;

		.image {
			width: 100%;
			aspect-ratio: 16 / 9;
			background-color: var(--surface-container);
			border-radius: 8px;
			overflow: hidden;
			cursor: pointer;
		}

		.text {
			display: flex;
			flex-direction: column;
			gap: 4px;

			.price {
				height: 18px;
				width: 100px;
				background-color: var(--surface-container);
				border-radius: 8px;
			}

			.details {
				height: 16px;
				width: 100%;
				background-color: var(--surface-container);
				border-radius: 8px;
			}
		}
	}
</style>
