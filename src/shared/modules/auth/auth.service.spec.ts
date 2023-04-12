/**
 * Importing npm packages
 */
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Importing user defined packages
 */
import { UserMongooseModule, MailService, ContextService, DatabaseModule } from '@app/providers';

import { AuthService } from './auth.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

describe('AuthService', () => {
  let service: AuthService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule, UserMongooseModule],
      providers: [AuthService, MailService, ContextService, ConfigService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(() => module.close());
});
