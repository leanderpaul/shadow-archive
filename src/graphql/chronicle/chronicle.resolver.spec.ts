/**
 * Importing npm packages
 */
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Importing user defined packages
 */
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [ChronicleResolver, ChronicleService] }).compile();

    resolver = module.get<ChronicleResolver>(ChronicleResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
