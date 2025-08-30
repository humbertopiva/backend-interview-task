import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { JwtService } from './jwt.service';

jest.mock('axios');
jest.mock('jsonwebtoken');
jest.mock('jwk-to-pem');

describe('JwtService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPems', () => {
    it('should fetch and cache pems', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { keys: [{ kid: 'key1', kty: 'RSA' }] },
      });
      (jwkToPem as jest.Mock).mockReturnValue('pem-string');

      const pems = await JwtService.getPems('poolId', 'us-east-1');
      expect(pems).toEqual({ key1: 'pem-string' });
      expect(axios.get).toHaveBeenCalledWith(
        'https://cognito-idp.us-east-1.amazonaws.com/poolId/.well-known/jwks.json'
      );

      // Chamada novamente deve retornar cache
      const cached = await JwtService.getPems('poolId', 'us-east-1');
      expect(cached).toEqual({ key1: 'pem-string' });
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('extractToken', () => {
    it('should extract token from authorization header', () => {
      const ctx = { headers: { authorization: 'Bearer token123' } };
      expect(JwtService.extractToken(ctx)).toBe('token123');
    });

    it('should return null if header missing', () => {
      const ctx = { headers: {} };
      expect(JwtService.extractToken(ctx)).toBeNull();
    });

    it('should extract token from custom header', () => {
      const ctx = { headers: { 'x-api-key': 'key123' } };
      expect(JwtService.extractToken(ctx, 'x-api-key')).toBe('key123');
    });
  });

  describe('decodeTokenHeader', () => {
    it('should decode token', () => {
      (jwt.decode as jest.Mock).mockReturnValue({ header: { kid: 'key1' } });
      const decoded = JwtService.decodeTokenHeader('token123');
      expect(decoded).toEqual({ header: { kid: 'key1' } });
      expect(jwt.decode).toHaveBeenCalledWith('token123', { complete: true });
    });

    it('should throw if invalid token', () => {
      (jwt.decode as jest.Mock).mockReturnValue(null);
      expect(() => JwtService.decodeTokenHeader('badtoken')).toThrow('Invalid token');
    });
  });

  describe('getPemForToken', () => {
    it('should return pem for token', async () => {
      // Mock cache
      (JwtService.getPems as jest.Mock) = jest.fn().mockResolvedValue({ key1: 'pem123' });
      const pem = await JwtService.getPemForToken({ header: { kid: 'key1' } }, 'pool', 'region');
      expect(pem).toBe('pem123');
    });

    it('should throw if key not found', async () => {
      (JwtService.getPems as jest.Mock) = jest.fn().mockResolvedValue({});
      await expect(
        JwtService.getPemForToken({ header: { kid: 'missing' } }, 'pool', 'region')
      ).rejects.toThrow('Key not found');
    });
  });

  describe('verifyToken', () => {
    it('should verify token', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: '123' });
      const decoded = JwtService.verifyToken('token', 'pem');
      expect(decoded).toEqual({ sub: '123' });
      expect(jwt.verify).toHaveBeenCalledWith('token', 'pem');
    });
  });

  describe('mapAccessClaims', () => {
    it('should map claims', () => {
      const claims = JwtService.mapAccessClaims({
        sub: '1',
        username: 'user1',
        'cognito:groups': ['admin'],
      });
      expect(claims).toEqual({ sub: '1', username: 'user1', groups: ['admin'] });
    });
  });

  describe('mapIdClaims', () => {
    it('should map email claim', () => {
      const claims = JwtService.mapIdClaims({ email: 'test@test.com' });
      expect(claims).toEqual({ email: 'test@test.com' });
    });
  });

  describe('decodeAndVerify', () => {
    it('should decode and verify token and map claims', async () => {
      process.env.COGNITO_POOL_ID = 'pool';
      process.env.AWS_REGION = 'region';

      const fakeHeader = { header: { kid: 'key1' } };
      const fakePem = 'pem123';
      const fakeDecoded = { sub: '1' };

      (JwtService.decodeTokenHeader as jest.Mock) = jest.fn().mockReturnValue(fakeHeader);
      (JwtService.getPemForToken as jest.Mock) = jest.fn().mockResolvedValue(fakePem);
      (JwtService.verifyToken as jest.Mock) = jest.fn().mockReturnValue(fakeDecoded);

      const mapClaims = jest.fn().mockReturnValue({ mapped: true });
      const result = await JwtService.decodeAndVerify('token', mapClaims);

      expect(result).toEqual({ mapped: true });
      expect(JwtService.decodeTokenHeader).toHaveBeenCalledWith('token');
      expect(JwtService.getPemForToken).toHaveBeenCalledWith(fakeHeader, 'pool', 'region');
      expect(JwtService.verifyToken).toHaveBeenCalledWith('token', fakePem);
      expect(mapClaims).toHaveBeenCalledWith(fakeDecoded);
    });
  });
});
