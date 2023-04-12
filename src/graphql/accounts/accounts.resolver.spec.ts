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

import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

describe('AccountsResolver', () => {
  let resolver: AccountsResolver;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule, UserMongooseModule, AuthModule],
      providers: [AccountsResolver, AccountsService, ContextService, MailService],
    }).compile();

    resolver = module.get<AccountsResolver>(AccountsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  afterAll(() => module.close());
});
