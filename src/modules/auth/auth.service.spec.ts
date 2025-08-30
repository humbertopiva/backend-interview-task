import { AuthService } from './auth.service';
import { JwtService } from '../../common/services/jwt.service';
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

jest.mock('../../common/services/cognito.service');
jest.mock('../../common/services/jwt.service');
jest.mock('../../common/helpers/crypto', () => ({
  generateSecretHash: jest.fn(() => 'mockedSecretHash'),
}));
jest.mock('@aws-sdk/client-cognito-identity-provider');

describe('AuthService', () => {
  let authService: AuthService;
  let cognitoClientSendMock: jest.Mock;

  beforeEach(() => {
    cognitoClientSendMock = jest.fn();
    (CognitoIdentityProviderClient as jest.Mock).mockImplementation(() => ({
      send: cognitoClientSendMock,
    }));

    authService = new AuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should throw error if tokens not returned', async () => {
      cognitoClientSendMock.mockResolvedValue({});

      await expect(authService.authenticate({ username: 'test', password: 'pass' })).rejects.toThrow(
        'Token not returned by Cognito'
      );
    });

    it('should call JwtService and UserService when tokens returned', async () => {
      const fakeTokens = {
        IdToken: 'idToken',
        AccessToken: 'accessToken',
        RefreshToken: 'refreshToken',
        ExpiresIn: 3600,
        TokenType: 'Bearer',
      };

      cognitoClientSendMock.mockResolvedValue({ AuthenticationResult: fakeTokens });
      (JwtService.decodeAndVerify as jest.Mock)
        .mockResolvedValueOnce({ sub: '1', username: 'test', groups: [] })
        .mockResolvedValueOnce({ email: 'test@test.com', name: 'Test' });

      (authService as any).userService.findOneByEmail = jest.fn().mockResolvedValue(null);
      (authService as any).userService.create = jest.fn().mockResolvedValue({ id: 1, email: 'test@test.com', name: 'Test' });

      const result = await authService.authenticate({ username: 'test', password: 'pass' });

      expect(result.idToken).toBe('idToken');
      expect(result.accessToken).toBe('accessToken');
      expect((authService as any).userService.create).toHaveBeenCalledWith({
        email: 'test@test.com',
        role: 'user',
      });
    });

    it('should resolve NEW_PASSWORD_REQUIRED challenge', async () => {
      cognitoClientSendMock.mockResolvedValue({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: 'mockSession',
        AuthenticationResult: { IdToken: 'id', AccessToken: 'acc', RefreshToken: 'ref', ExpiresIn: 3600, TokenType: 'Bearer' }
      });

      const resolveSpy = jest.spyOn(authService as any, 'resolveChallengePasswordRequired').mockResolvedValue({});

      (JwtService.decodeAndVerify as jest.Mock).mockResolvedValue({ email: 'test@test.com', name: 'Test' });
      (authService as any).userService.findOneByEmail = jest.fn().mockResolvedValue(null);
      (authService as any).userService.create = jest.fn().mockResolvedValue({});

      await authService.authenticate({ username: 'test', password: 'pass' });

      expect(resolveSpy).toHaveBeenCalledWith({
        username: 'test',
        password: 'pass',
        secretHash: 'mockedSecretHash',
        session: 'mockSession',
      });
    });
  });

  describe('resolveChallengePasswordRequired', () => {
    it('should call RespondToAuthChallengeCommand with correct parameters', async () => {
      const sendMock = cognitoClientSendMock.mockResolvedValue({ success: true });
      const params = {
        username: 'test',
        password: 'pass',
        secretHash: 'mockedSecretHash',
        session: 'mockSession',
      };

      const result = await (authService as any).resolveChallengePasswordRequired(params);

      expect(result).toEqual({ success: true });
      expect(sendMock).toHaveBeenCalled();
    });
  });
});
