import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrisma = {
    restaurant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    license: {
      findFirst: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkLicense', () => {
    const restaurantId = 'rest-1';
    const machineId = 'machine-1';

    it('should return valid: false when restaurant not found', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.checkLicense(restaurantId, machineId);
      expect(result).toEqual({ valid: false });
    });

    it('should return valid: false when restaurant has no license', async () => {
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue({
        id: restaurantId,
        licenses: [],
      });
      const result = await service.checkLicense(restaurantId, machineId);
      expect(result).toEqual({ valid: false });
    });

    it('should return valid: false when license endDate is in the past (UTC)', async () => {
      const pastDate = new Date(Date.UTC(2020, 0, 1)); // 2020-01-01
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue({
        id: restaurantId,
        licenses: [{ endDate: pastDate }],
      });
      const result = await service.checkLicense(restaurantId, machineId);
      expect(result.valid).toBe(false);
      expect(result.endDate).toBe(pastDate.toISOString());
    });

    it('should return valid: true when license endDate is in the future (UTC)', async () => {
      const futureDate = new Date(Date.UTC(2030, 11, 31));
      (prisma.restaurant.findUnique as jest.Mock).mockResolvedValue({
        id: restaurantId,
        licenses: [{ endDate: futureDate }],
      });
      const result = await service.checkLicense(restaurantId, machineId);
      expect(result).toEqual({ valid: true, endDate: futureDate.toISOString() });
    });
  });
});
