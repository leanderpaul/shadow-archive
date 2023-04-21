/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { DatabaseService, MetadataVariant } from '@app/providers/database';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Injectable()
export class ChronicleMetadataService {
  private readonly metadataModel;

  constructor(private readonly contextService: ContextService, databaseService: DatabaseService) {
    this.metadataModel = databaseService.getMetadataModel(MetadataVariant.CHRONICLE);
  }

  async getUserMetadata() {
    const user = this.contextService.getCurrentUser(true);
    return await this.metadataModel.findOne({ uid: user._id }).lean();
  }
}
