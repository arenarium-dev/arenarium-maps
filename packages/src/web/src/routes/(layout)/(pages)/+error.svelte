<script lang="ts">
	import { page } from '$app/state';

	export const emojis: { [id: string]: string } = {
		// TODO add the rest!
		420: '🫠',
		500: '💥'
	};
</script>

<div class="center">
	<span style="font-size: 160px">
		{emojis[page.status] ?? emojis[500]}
	</span>
</div>

<style>
	.center {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
</style>
