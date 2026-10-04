export interface ContactConfig {
  apiKey: string;
  to: string;
  from: string;
}
export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}
export function getContactConfig(environment?: Record<string, string | undefined>): ContactConfig | null;
export function parseContactMessage(value: unknown): ContactMessage;
export function handleContactRequest(request: Request, options?: {
  environment?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  bodyTimeoutMs?: number;
}): Promise<Response>;
