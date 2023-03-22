/**
 * Importing npm packages
 */
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Importing user defined packages
 */
import { StatusResolver } from './status.resolver';
import { StatusService } from './status.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

describe('StatusResolver', () => {
  let resolver: StatusResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [StatusResolver, StatusService] }).compile();
    resolver = module.get<StatusResolver>(StatusResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
