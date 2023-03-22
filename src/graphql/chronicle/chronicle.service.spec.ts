/**
 * Importing npm packages
 */
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Importing user defined packages
 */
import { ChronicleService } from './chronicle.service';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

describe('ChronicleService', () => {
  let service: ChronicleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [ChronicleService] }).compile();

    service = module.get<ChronicleService>(ChronicleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
