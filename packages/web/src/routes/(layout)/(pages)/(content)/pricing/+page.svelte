<div class="page">
	<div class="block">
		<div class="title">Pricing</div>
		<div class="text">
			<strong>@arenarium/maps</strong> is free to use for now. It is rate limited to <strong>256</strong> marker updates per second.
		</div>
		<div class="text">
			If you want to support the project and get unlimited access, please contact me at <a href="mailto:arenarium.dev@gmail.com"
				>arenarium.dev@gmail.com</a
			>.
		</div>
	</div>
</div>

<style lang="less">
	.page {
		display: flex;
		flex-direction: column;
		gap: 24px;

		// code {
		// 	background-color: var(--surface-container-high);
		// 	padding: 0px 4px;
		// 	border-radius: 4px;
		// 	font-weight: 600;
		// }

		.block {
			display: flex;
			flex-direction: column;
			gap: 16px;
			color: var(--on-surface);

			.title {
				font-size: 24px;
				font-weight: 600;
				padding-bottom: 0px;
			}

			// .header {
			// 	font-size: 18px;
			// 	font-weight: 600;
			// }

			.text {
				font-size: 14px;
			}

			.text a {
				color: var(--primary);
				text-decoration: underline;
			}
		}
	}
</style>
