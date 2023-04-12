/**
 * Importing npm packages
 */
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Importing user defined packages
 */
import { DatabaseModule, MetadataMongooseModule, ExpenseMongooseModule, MemoirMongooseModule, ContextService } from '@app/providers';
import { ConfigModule } from '@app/config';
import { AuthModule } from '@app/shared/modules';

import { ChronicleResolver } from './chronicle.resolver';
import { ChronicleService } from './chronicle.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

describe('ChronicleResolver', () => {
  let resolver: ChronicleResolver;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule, ConfigModule, MetadataMongooseModule, ExpenseMongooseModule, MemoirMongooseModule, AuthModule],
      providers: [ContextService, ChronicleService, ChronicleResolver],
    }).compile();

    resolver = module.get<ChronicleResolver>(ChronicleResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  afterAll(() => module.close());
});
