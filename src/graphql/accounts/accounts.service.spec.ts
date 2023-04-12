/**
 * Importing npm packages
 */
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Importing user defined packages
 */
import { ConfigModule } from '@app/config';
import { ContextService, MailService, DatabaseModule, UserMongooseModule } from '@app/providers';
import { AuthModule } from '@app/shared/modules';

import { AccountsService } from './accounts.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

describe('AccountsService', () => {
  let service: AccountsService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule, UserMongooseModule, AuthModule],
      providers: [AccountsService, ContextService, MailService],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(() => module.close());
});
