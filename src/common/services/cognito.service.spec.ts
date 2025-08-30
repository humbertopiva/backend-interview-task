import { CognitoService } from './cognito.service';
import { 
  AdminUpdateUserAttributesCommand, 
  AdminAddUserToGroupCommand, 
  AdminRemoveUserFromGroupCommand 
} from "@aws-sdk/client-cognito-identity-provider";

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const original = jest.requireActual("@aws-sdk/client-cognito-identity-provider");
  return {
    ...original,
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    AdminUpdateUserAttributesCommand: jest.fn(),
    AdminAddUserToGroupCommand: jest.fn(),
    AdminRemoveUserFromGroupCommand: jest.fn(),
  };
});

describe('CognitoService', () => {
  let service: CognitoService;
  let clientMock: any;

  beforeEach(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'key';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    process.env.COGNITO_POOL_ID = 'pool';
    process.env.COGNITO_CLIENT_ID = 'client';

    service = new CognitoService();
    clientMock = (service as any).client;
    clientMock.send.mockClear();
  });

  it('should call AdminUpdateUserAttributesCommand in updateUserName', async () => {
    clientMock.send.mockResolvedValue('ok');
    const result = await service.updateUserName('user1', 'New Name');

    expect(AdminUpdateUserAttributesCommand).toHaveBeenCalledWith({
      UserPoolId: 'pool',
      Username: 'user1',
      UserAttributes: [{ Name: 'name', Value: 'New Name' }],
    });
    expect(clientMock.send).toHaveBeenCalled();
    expect(result).toBe('ok');
  });

  it('should call AdminAddUserToGroupCommand in addUserToGroup', async () => {
    clientMock.send.mockResolvedValue('ok');
    const result = await service.addUserToGroup('user1', 'group1');

    expect(AdminAddUserToGroupCommand).toHaveBeenCalledWith({
      UserPoolId: 'pool',
      Username: 'user1',
      GroupName: 'group1',
    });
    expect(clientMock.send).toHaveBeenCalled();
    expect(result).toBe('ok');
  });

  it('should call AdminRemoveUserFromGroupCommand in removeUserFromGroup', async () => {
    clientMock.send.mockResolvedValue('ok');
    const result = await service.removeUserFromGroup('user1', 'group1');

    expect(AdminRemoveUserFromGroupCommand).toHaveBeenCalledWith({
      UserPoolId: 'pool',
      Username: 'user1',
      GroupName: 'group1',
    });
    expect(clientMock.send).toHaveBeenCalled();
    expect(result).toBe('ok');
  });
});
