import { createHmac } from 'crypto';

export function generateSecretHash(username: string, clientId: string, clientSecret: string): string {
  const hmac = createHmac('sha256', clientSecret);
  hmac.update(username + clientId);
  return hmac.digest('base64');
}