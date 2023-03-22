/**
 * Importing npm packages
 */
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Importing user defined packages
 */
import { Database } from './database';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

describe('Database', () => {
  let provider: Database;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Database],
    }).compile();

    provider = module.get<Database>(Database);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
