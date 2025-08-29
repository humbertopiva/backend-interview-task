import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand } from "@aws-sdk/client-cognito-identity-provider";
import { generateSecretHash } from "../../helpers/crypto";
import { AuthDto } from "./dto/auth.dto";

export class AuthService {
  private client: CognitoIdentityProviderClient;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: 'us-east-1',
    });

    this.clientId = process.env.COGNITO_CLIENT_ID as string;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET as string;
  }

  async authenticate({ username, password }: AuthDto) {
    const secretHash = generateSecretHash(username, this.clientId, this.clientSecret);

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH' as const,
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    };

    let data = await this.client.send(new InitiateAuthCommand(params));

    if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      const challengeResponse = {
        ChallengeName: 'NEW_PASSWORD_REQUIRED' as const,
        ClientId: this.clientId,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: password,
          SECRET_HASH: secretHash,
        },
        Session: data.Session,
      };

      data = await this.client.send(new RespondToAuthChallengeCommand(challengeResponse));
    }

    return data.AuthenticationResult;
  }
}
