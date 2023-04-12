/**
 * Importing npm packages
 */
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Importing user defined packages
 */
import { ConfigModule } from '@app/config';
import { DatabaseModule, MetadataMongooseModule, ExpenseMongooseModule, MemoirMongooseModule, ContextService } from '@app/providers';

import { ChronicleService } from './chronicle.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

describe('ChronicleService', () => {
  let service: ChronicleService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule, MetadataMongooseModule, ExpenseMongooseModule, MemoirMongooseModule],
      providers: [ChronicleService, ContextService],
    }).compile();

    service = module.get<ChronicleService>(ChronicleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(() => module.close());
});
