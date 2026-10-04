export function isWebhookSecretConfigured(secret: unknown): secret is string;
export function isWebhookAuthorized(authorization: unknown, secret: unknown): boolean;
