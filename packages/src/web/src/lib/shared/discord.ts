class Discord {
	public async log(message: string, data: any) {
		await fetch('https://discord.com/api/webhooks/1373655546045136997/Xecfl83131nBK_39-V27Ll4W42GegXIAPvRl9hXFAxAc-E9oumFNRm2mTrPj7nMTqVuc', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: `[Error] ${message}`,
				content: '```' + `${JSON.stringify(data, null, 2)}` + '```'
			})
		});
	}
}

export const discord = new Discord();
