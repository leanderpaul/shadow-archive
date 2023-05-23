/**
 * Importing npm packages
 */
import { Query, Resolver } from '@nestjs/graphql';

/**
 * Importing user defined packages
 */
import { Metadata } from './chronicle-metadata.entity';
import { ChronicleMetadataService } from './chronicle-metadata.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Resolver()
export class ChronicleMetadataResolver {
  constructor(private readonly chronicleMetadataService: ChronicleMetadataService) {}

  @Query(() => Metadata, { name: 'metadata' })
  getMetadata(): Promise<Metadata> {
    return this.chronicleMetadataService.getUserMetadata();
  }
}
