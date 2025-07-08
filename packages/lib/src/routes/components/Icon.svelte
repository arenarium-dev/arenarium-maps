<script lang="ts">
	let {
		name,
		color = 'inherit',
		size = 24,
		scale = 1,
		weight = 'normal',
		transition = '',
		filled = false
	}: {
		name: string;
		color?: string;
		size?: number;
		scale?: number;
		weight?: string;
		transition?: string;
		filled?: boolean;
	} = $props();

	let sizeStyle = size + 'px';
</script>

<span
	class="material-symbols-rounded icon"
	class:filled
	style:scale
	style:color
	style:transition
	style:font-weight={weight}
	style:font-size={sizeStyle}
	style:width={sizeStyle}
	style:height={sizeStyle}
>
	{name}
</span>

<style>
	.icon {
		overflow: hidden;
	}

	.filled {
		font-variation-settings:
			'FILL' 1,
			'GRAD' 0,
			'opsz' 24;
	}
</style>
