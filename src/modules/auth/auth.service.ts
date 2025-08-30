import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand } from "@aws-sdk/client-cognito-identity-provider";

import { generateSecretHash } from "../../common/helpers/crypto";
import { UserService } from "../user/user.service";
import { JwtService } from "../../common/services/jwt.service";

import { ResolveChallengePasswordRequiredDto } from "./dto/resolve-challenge-password-required.dto";
import { AuthDto } from "./dto/auth.dto";
import { CognitoService } from "../../common/services/cognito.service";

export class AuthService {
  private client: CognitoIdentityProviderClient;
  private clientId: string;
  private clientSecret: string;
  private userService: UserService;
  private cognitoService: CognitoService;

  constructor() {
    this.cognitoService = new CognitoService();
    this.userService = new UserService(this.cognitoService);

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

    const data = await this.client.send(new InitiateAuthCommand(params));

    if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED' && data.Session) {
      await this.resolveChallengePasswordRequired({username, password, secretHash, session: data.Session});
    }

    const authResult = data.AuthenticationResult;

    if (!authResult || !authResult.IdToken || !authResult.AccessToken) {
      throw new Error("Tokens não retornados pelo Cognito");
    }

    const accessClaims = await JwtService.decodeAndVerify(authResult.AccessToken, JwtService.mapAccessClaims);
    const idClaims = await JwtService.decodeAndVerify(authResult.IdToken, JwtService.mapIdClaims);

    const userInfo = {
      username: idClaims.name,
      email: idClaims.email,
      name: idClaims.name,
      groups: accessClaims["groups"] || [],
    };

    const userExists = await this.userService.findOneByEmail(userInfo.email);
    
    if(!userExists) {
      await this.userService.create({
        name: userInfo.name,
        email: userInfo.email,
        role: userInfo.groups.includes('admin') ? 'admin' : 'user',
      });
    }

    return {
      idToken: authResult.IdToken,
      accessToken: authResult.AccessToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn,
      tokenType: authResult.TokenType,
    };
  }

  private async resolveChallengePasswordRequired({username, password, secretHash, session}: ResolveChallengePasswordRequiredDto) {
    const challengeResponse = {
      ChallengeName: 'NEW_PASSWORD_REQUIRED' as const,
      ClientId: this.clientId,
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: password,
        SECRET_HASH: secretHash,
      },
      Session: session,  
    };

    const data = await this.client.send(new RespondToAuthChallengeCommand(challengeResponse));

    return data;
  }
}
