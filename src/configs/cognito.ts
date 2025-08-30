import { Issuer, Client } from 'openid-client';

let cognitoClient: Client | null = null;

export async function getCognitoClient(): Promise<Client> {
  if (cognitoClient) return cognitoClient;

  const cognitoRegion = process.env.AWS_REGION!;
  const userPoolId = process.env.COGNITO_POOL_ID!;
  const clientId = process.env.COGNITO_CLIENT_ID!;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET!;

  const issuerUrl = `https://cognito-idp.${cognitoRegion}.amazonaws.com/${userPoolId}`;

  const cognitoIssuer = await Issuer.discover(issuerUrl);

  cognitoClient = new cognitoIssuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    response_types: ['code'],
  });

  return cognitoClient;
}
