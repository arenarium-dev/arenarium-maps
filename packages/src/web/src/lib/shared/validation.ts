import { z } from 'zod';

export const nameSchema = z.string().min(1).max(128);

// Domain regex that handles:
// - example.com (no port)
// - example.com:port
// - localhost:port (port required)
const domainRegex = /^(localhost:\d{1,5}|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d{1,5})?)$/;

export const domainSchema = z
	.string()
	.transform((val) => val.trim())
	.refine(
		(val) => {
			return domainRegex.test(val);
		},
		{
			message: 'Please enter valid domains with ports (e.g., example.com, localhost:3000) or leave empty for no restrictions.'
		}
	);

export const domainsSchema = z.array(domainSchema);
