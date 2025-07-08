<script lang="ts">
	let { details, width, height }: { details: any; width: number; height: number } = $props();

	function onClick(e: MouseEvent) {
		e.stopPropagation();
	}
</script>

<a href={details.url} target="_blank" class="popup" style:width={width + 'px'} style:height={height + 'px'} onclick={onClick}>
	<div class="image">
		<img loading="lazy" src={details.image} alt={details.id} />
		<div class="agency">
			<img loading="lazy" src={details.agencyImage} alt={details.agencyImage} />
		</div>
	</div>
	<div class="text">
		<div class="price">{details.price}</div>
		<div class="description truncate-text">{@html details.description}</div>
		<div class="address truncate-text">{details.address}</div>
	</div>
</a>

<style lang="less">
	@gray: color-mix(in srgb, var(--map-style-background) 50%, #888 50%);

	.popup {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		padding: 0.5em;
		font-size: 16px;

		.image {
			position: relative;
			width: 100%;
			aspect-ratio: 17 / 15;
			background-color: @gray;
			border-radius: 12px;
			overflow: hidden;
			cursor: pointer;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.agency {
				position: absolute;
				left: 10px;
				top: 10px;
				width: 50px;
				height: 50px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 8px;
				overflow: hidden;
				background-color: white;

				img {
					width: 48px;
					height: 48px;
					object-fit: cover;
					border-radius: 6px;
				}
			}
		}

		.text {
			width: 100%;
			padding: 0.2em;
			color: black;

			.price {
				font-size: 1em;
				font-weight: bold;
				line-height: 1.3em;
				color: #f90;
			}

			.description {
				font-size: 0.75em;
			}

			.address {
				font-size: 0.75em;
				opacity: 0.8;
			}
		}
	}
</style>
