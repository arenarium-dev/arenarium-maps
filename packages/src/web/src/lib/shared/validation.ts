import { z } from 'zod';

export const nameSchema = z.string().min(1).max(128);

// Regular expression for a valid IPv4 address
// Source/Credit: Slightly modified version from common patterns, checks 0-255 ranges.
const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/;

// Regular expression for a basic valid hostname (allows subdomains, requires TLD)
// Note: This is a common simplification. Real-world domain validation can be more complex (e.g., IDNs).
// It requires at least one dot and a TLD of 2+ letters.
const hostnameRegex = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

// Zod schema definition
export const domainSchema = z
	.string()
	.trim() // Remove leading/trailing whitespace
	.min(1, { message: 'Domain/IP cannot be empty' }) // Ensure non-empty string
	.refine(
		(value) => {
			// Check if the value contains a port part
			if (value.includes(':')) {
				const parts = value.split(':');
				// Must be exactly one colon splitting host and port
				if (parts.length !== 2) {
					return false;
				}
				const hostPart = parts[0];
				const portPart = parts[1];

				// Validate Port: Must be digits only and within the valid range 1-65535
				if (!/^[0-9]+$/.test(portPart)) {
					return false; // Port contains non-digit characters
				}
				const portNum = parseInt(portPart, 10);
				if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
					return false; // Port is not a number or out of range
				}

				// Validate Host Part (must be localhost, IP, or hostname)
				const isLocalhost = hostPart === 'localhost';
				const isIp = ipv4Regex.test(hostPart);
				const isHostname = hostnameRegex.test(hostPart);

				return isLocalhost || isIp || isHostname;
			} else {
				// No port provided, validate the whole string as localhost, IP, or hostname
				const isLocalhost = value === 'localhost';
				const isIp = ipv4Regex.test(value);
				const isHostname = hostnameRegex.test(value);

				return isLocalhost || isIp || isHostname;
			}
		},
		{
			// Custom error message if the refinement fails
			message:
				"Invalid format. Expected 'example.com', 'localhost', '127.0.0.1', or with optional port like 'localhost:3000' or '192.168.1.1:8080'."
		}
	);

export const domainsSchema = z.array(domainSchema).min(1);
