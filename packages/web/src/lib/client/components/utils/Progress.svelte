<!-- https://codepen.io/salazarr-js/pen/aJdmvw -->

<div class="indeterminate"></div>

<style lang="less">
	.indeterminate {
		position: relative;
		width: 100%;
		height: 100%;
		background-color: var(--secondary);

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: var(--primary-container);
			animation: indeterminate-long 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
		}

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			bottom: 0;
			width: 50%;
			height: 100%;
			background-color: var(--primary-container);
			animation: indeterminate-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
			animation-delay: 1.15s;
		}
	}

	@keyframes indeterminate-long {
		0% {
			left: -35%;
			right: 100%;
		}
		60% {
			left: 100%;
			right: -90%;
		}
		100% {
			left: 100%;
			right: -90%;
		}
	}

	@keyframes indeterminate-short {
		0% {
			left: -200%;
			right: 100%;
		}
		60% {
			left: 107%;
			right: -8%;
		}
		100% {
			left: 107%;
			right: -8%;
		}
	}
</style>
