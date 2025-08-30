import { UserService } from './user.service';
import { CognitoService } from '../../common/services/cognito.service';
import { AppDataSource } from '../../configs/data-source';

jest.mock('../../configs/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let cognitoService: CognitoService;
  let mockRepository: any;

  beforeEach(() => {
    cognitoService = {
      removeUserFromGroup: jest.fn(),
      addUserToGroup: jest.fn(),
      updateUserName: jest.fn(),
    } as unknown as CognitoService;

    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);

    userService = new UserService(cognitoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: 1, name: 'John' }];
      mockRepository.find.mockResolvedValue(users);

      const result = await userService.findAll();
      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('getSelf', () => {
    it('should throw if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        userService.getSelf({ 
          sub: "1", 
          username: "teste", 
          name: "teste", 
          email: 'test@test.com', 
          role: 'user' 
        })
      ).rejects.toThrow('User not found');
    });

    it('should return the logged user', async () => {
      const user = { id: 1, email: 'test@test.com', name: 'Test', role: 'user' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await userService.getSelf({ 
        sub: "1", 
        username: "teste", 
        name: "teste", 
        email: 'test@test.com', 
        role: 'user' 
      });
      
      expect(result).toEqual(user);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto = { name: 'Alice', email: 'alice@test.com', role: 'user', isOnboarded: false };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockResolvedValue(dto);

      const result = await userService.create(dto as any);
      expect(result).toEqual(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(dto);
    });

    it('should throw error if email is already in use', async () => {
      const dto = { name: 'Alice', email: 'alice@test.com', role: 'user', isOnboarded: false };
      mockRepository.findOne.mockResolvedValue(dto);

      await expect(userService.create(dto as any)).rejects.toThrow('Email is already in use');
    });
  });

  describe('editAccount', () => {
    it('should update user name and mark as onboarded', async () => {
      const user = { email: 'test@test.com', name: 'Old Name', role: 'user', isOnboarded: false };
      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue({ ...user, name: 'New Name', isOnboarded: true });

      const dto = { name: 'New Name' };
      const loggedUser = { email: 'test@test.com', role: 'user' };

      const result = await userService.editAccount(dto as any, loggedUser as any);
      expect(result.name).toBe('New Name');
      expect(result.isOnboarded).toBe(true);
      expect(cognitoService.updateUserName).toHaveBeenCalledWith(user.email, 'New Name');
    });

    it('should update role if user is admin', async () => {
      const user = { email: 'test@test.com', name: 'User', role: 'user', isOnboarded: true };
      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue({ ...user, role: 'admin' });

      const dto = { role: 'admin' };
      const loggedUser = { sub: "1", username: "teste", name: "teste", email: 'admin@test.com', role: 'admin' };

      const result = await userService.editAccount(dto as any, loggedUser as any);
      expect(result.role).toBe('admin');
      expect(cognitoService.removeUserFromGroup).toHaveBeenCalledWith(user.email, 'user');
      expect(cognitoService.addUserToGroup).toHaveBeenCalledWith(user.email, 'admin');
    });

    it('should throw error if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        userService.editAccount({ name: 'New Name' } as any, { email: 'test@test.com', role: 'admin' } as any)
      ).rejects.toThrow('User not found');
    });

    it('should throw error if regular user tries to change role', async () => {
      const user = { email: 'test@test.com', name: 'User', role: 'user', isOnboarded: true };
      mockRepository.findOne.mockResolvedValue(user);

      await expect(
        userService.editAccount({ role: 'admin' } as any, { email: 'user@test.com', role: 'user' } as any)
      ).rejects.toThrow('Regular users cannot change the role');
    });
  });
});
