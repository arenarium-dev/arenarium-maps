<script lang="ts">
	let { id, width, height }: { id: string; width: number; height: number } = $props();

	let fontSize = Math.min(width, height) / 6;

	let idNumber = Number.parseInt(id);
	let types = ['Apartment', 'Hotel', 'Hotel', 'Hotel'];
	let type = types[idNumber % types.length];
	let price = 20 + Math.floor(idNumber / 10);
	let rating = Math.random() + 9;
	let days = Math.round(Math.random() * 4) + 1;
	let guests = Math.round(Math.random()) + 1;
</script>

<button
	class="popup"
	style:width={width + 'px'}
	style:height={height + 'px'}
	style:font-size={fontSize + 'px'}
>
	<div class="line top">
		<div class="type">{type}</div>
		<div class="rating">{rating.toFixed(1)}</div>
	</div>
	<div class="price">
		${price * days}
	</div>
	<div class="line bottom">
		<div>{days} night{days == 1 ? '' : 's'}</div>
		<div>{guests} guest{guests == 1 ? '' : 's'}</div>
	</div>
</button>

<style lang="less">
	@gray: color-mix(in srgb, var(--map-style-background) 50%, #888 50%);

	.popup {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0px;
		padding: 0.75em;
		color: var(--map-style-text);
		text-align: start;

		.price {
			font-weight: 600;
			font-size: 1.5em;
			opacity: 1;
		}

		.line {
			display: flex;
			flex-direction: row;
			align-items: center;
			height: 1.3em;

			&.top {
				font-size: 1em;

				.type {
					font-weight: 600;
					flex-grow: 1;
					text-align: start;
					opacity: 0.8;
					color: var(--map-style-primary);
				}

				.rating {
					font-weight: 500;
					background-color: var(--map-style-primary);
					color: var(--map-style-background);
					border-radius: 4px 4px 4px 0px;
					padding: 1px 3px;
					padding-top: 0px;
				}
			}

			&.bottom {
				font-size: 1em;
				gap: 0.5em;

				div {
					opacity: 0.8;
				}
			}
		}
	}
</style>
