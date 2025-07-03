<script lang="ts">
	const { images, index, dots = false }: { images: string[]; index: number; dots?: boolean } = $props();

	// Using Svelte 5's $state rune to create a reactive state variable for the current index.
	let currentIndex = $state(index);

	/**
	 * Navigates to the next slide in the carousel.
	 * It wraps around to the beginning if it's at the end.
	 */
	const goToNext = (e: Event) => {
		e.stopPropagation();
		console.log('e');
		currentIndex = (currentIndex + 1) % images.length;
	};

	/**
	 * Navigates to the previous slide in the carousel.
	 * It wraps around to the end if it's at the beginning.
	 */
	const goToPrev = (e: Event) => {
		e.stopPropagation();
		currentIndex = (currentIndex - 1 + images.length) % images.length;
	};

	/**
	 * Navigates to a specific slide by its index.
	 * @param {number} index - The index of the slide to navigate to.
	 */
	const goToIndex = (e: Event, index: number) => {
		e.stopPropagation();
		currentIndex = index;
	};

	/**
	 * Defines the structure for a single pagination dot.
	 */
	interface Dot {
		index: number;
		size: 'normal' | 'small';
	}

	/**
	 * Derives the state of the pagination dots based on the current index.
	 * This creates a moving window of up to 5 dots.
	 */
	const visibleDots: Dot[] = $derived.by(() => {
		const total = images.length;
		if (total <= 5) {
			// If there are 5 or fewer images, show all dots at a normal size.
			return images.map((_, i) => ({ index: i, size: 'normal' }));
		}

		let start = 0;
		// Center the current index within the 5-dot window when possible.
		if (currentIndex > 1) {
			start = currentIndex - 2;
		}
		// Prevent the window from extending beyond the available images.
		if (start > total - 5) {
			start = total - 5;
		}

		const dots: Dot[] = [];
		for (let i = 0; i < 5; i++) {
			dots.push({
				index: start + i,
				// The first and last dots in the visible window are made smaller.
				size: i === 0 || i === 4 ? 'small' : 'normal'
			});
		}
		return dots;
	});
</script>

<!-- The main container for the carousel. -->
<div class="carousel">
	<!-- This inner container hides the parts of the track that are not active. -->
	<div class="inner">
		<!-- The track holds all the images in a row and slides horizontally. -->
		<!-- The `transform` style is updated reactively when `currentIndex` changes. -->
		<div class="track" style="transform: translateX(-{currentIndex * 100}%)">
			{#each images as image}
				<div class="item">
					<img src={image} alt={image} />
				</div>
			{/each}
		</div>
	</div>

	<!-- Navigation Buttons -->
	<button class="prev" onclick={goToPrev} aria-label="Previous image">&#10094;</button>
	<button class="next" onclick={goToNext} aria-label="Next image">&#10095;</button>

	<!-- Pagination Dots -->
	{#if dots}
		<div class="dots">
			{#each visibleDots as dot (dot.index)}
				<button
					class="dot"
					class:active={dot.index === currentIndex}
					class:small={dot.size === 'small'}
					onclick={(e) => goToIndex(e, dot.index)}
					aria-label="Go to slide {dot.index + 1}"
				></button>
			{/each}
		</div>
	{/if}
</div>

<!-- Using Less for styling with nesting for better organization. -->
<style lang="less">
	.carousel {
		position: relative;
		width: 100%;
		height: 100%;
		margin: auto;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		-webkit-tap-highlight-color: transparent; // Removes blue highlight on tap for mobile buttons

		.inner {
			position: relative;
			width: 100%;
			height: 100%;
			overflow: hidden;

			.track {
				display: flex;
				height: 100%;
				// The transition on the transform property creates the sliding animation.
				transition: transform 0.125s ease-in-out;

				.item {
					flex: 0 0 100%; // Each item takes up 100% of the container width
					width: 100%;
					height: 100%;

					img {
						width: 100%;
						height: 100%;
						object-fit: cover; // Ensures the image covers the area without distortion
						display: block;
					}
				}
			}
		}

		.prev,
		.next {
			cursor: pointer;
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			width: 2em;
			height: 2em;
			line-height: 2em;
			color: white;
			font-weight: bold;
			font-size: 1em;
			user-select: none;
			opacity: 0;
			border: none;
			background-color: rgba(0, 0, 0, 0.25);
			transition: opacity 0.3s ease;
		}

		.prev {
			left: 0.25em;
			border-radius: 1em;
			padding-right: 0.15em;
		}

		.next {
			right: 0.25em;
			border-radius: 1em;
			padding-left: 0.15em;
		}

		&:hover {
			.prev,
			.next {
				opacity: 1;
			}
		}

		.dots {
			text-align: center;
			padding: 0.1em;
			position: absolute;
			bottom: 0.5em;
			width: 100%;
			display: flex;
			justify-content: center;
			align-items: center;

			.dot {
				cursor: pointer;
				height: 0.6em;
				width: 0.6em;
				margin: 0 0.3em;
				background-color: rgba(255, 255, 255, 0.5);
				border-radius: 50%;
				display: inline-block;
				transition: all 0.3s ease;
				border: none;
				padding: 0;

				&.active,
				&:hover {
					background-color: rgba(255, 255, 255, 1);
					transform: scale(1.1);
				}

				&.small {
					width: 8px;
					height: 8px;
					background-color: rgba(255, 255, 255, 0.4);
				}
			}
		}
	}
</style>
