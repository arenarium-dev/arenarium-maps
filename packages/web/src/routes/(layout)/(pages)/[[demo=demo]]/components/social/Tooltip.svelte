<script lang="ts">
	import Icon from '$lib/client/components/utils/Icon.svelte';
	import Image from '$lib/client/components/utils/Image.svelte';

	let { id, width, height, lines, details }: { id: string; width: number; height: number; lines: number; details: any } = $props();

	let size = 0.5 + width / 16;
	let post = details.post;
	let user = details.user;

	let comments = Math.floor(Math.random() * 10);
	let likes = Math.floor(Math.random() * 100);
	let sent = Math.floor(Math.random() * 5);
</script>

<div class="popup" style="width:{width}px; height:{height}px; font-size:{size}px;">
	<div class="header">
		<div class="icon">
			<Image src={user.picture.thumbnail} width={'100%'} height={'100%'} />
		</div>
		<div class="text">
			<div class="name truncate-text">{user.name.first} {user.name.last}</div>
			<div class="handle truncate-text">{post.author_handle}</div>
		</div>
	</div>
	<div class="body limit-lines max-{lines}">
		{post.text}
	</div>
	<div class="footer">
		<div class="cell">
			<Icon name={'chat_bubble'} {size} />
			<div class="text">{comments}</div>
		</div>
		<div class="cell">
			<Icon name={'favorite'} {size} />
			<div class="text">{likes}</div>
		</div>
		<div class="cell">
			<Icon name={'cached'} {size} />
			<div class="text">{sent}</div>
		</div>
		<div class="cell">
			<Icon name={'more_horiz'} {size} />
		</div>
	</div>
</div>

<style lang="less">
	@line-height: 1.6em;

	.popup {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 0.6em;

		.header {
			display: grid;
			grid-template-columns: 2.5em 1fr;
			gap: 0.5em;

			.icon {
				width: 2.5em;
				height: 2.5em;
				border-radius: 50%;
				background-color: var(--map-style-background);
				box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
				overflow: hidden;
			}

			.text {
				overflow: hidden;

				.name {
					font-size: 1em;
					font-weight: 600;
					line-height: 1.4em;
					color: var(--map-style-text);
				}

				.handle {
					font-size: 0.9em;
					line-height: 1.3em;
					color: var(--map-style-text);
				}
			}
		}

		.body {
			font-size: 1em;
			line-height: @line-height;
			overflow: hidden;
			color: var(--map-style-text);
		}

		.footer {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr 1fr;
			gap: 2em;
			padding: 0.3em;
			padding-bottom: 0;
			font-size: 0.9em;
			color: var(--map-style-text);
			opacity: 0.7;

			.cell {
				height: 1.2em;
				display: flex;
				align-items: center;
				gap: 0.5em;

				.text {
					padding-bottom: 2px;
				}
			}
		}
	}

	.limit-lines {
		line-break: loose;
		overflow: hidden;
		overflow-wrap: break-word;
		display: -webkit-box;
		-webkit-box-orient: vertical;
	}

	.limit-lines.max-0 {
		display: none;
	}

	.limit-lines.max-1 {
		max-height: 1 * @line-height;
		line-clamp: 1;
		-webkit-line-clamp: 1;
	}

	.limit-lines.max-2 {
		max-height: 2 * @line-height;
		line-clamp: 2;
		-webkit-line-clamp: 2;
	}

	.limit-lines.max-3 {
		max-height: 3 * @line-height;
		line-clamp: 3;
		-webkit-line-clamp: 3;
	}

	.limit-lines.max-4 {
		max-height: 4 * @line-height;
		line-clamp: 4;
		-webkit-line-clamp: 4;
	}
</style>
