/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ContextService } from '@app/providers/context';
import { DatabaseService } from '@app/providers/database';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Injectable()
export class ChronicleMetadataService {
  private readonly userModel;

  constructor(private readonly contextService: ContextService, databaseService: DatabaseService) {
    this.userModel = databaseService.getUserModel();
  }

  async getUserMetadata() {
    const user = this.contextService.getCurrentUser(true);
    const result = await this.userModel.findOne({ _id: user._id }, 'chronicle').lean();
    return result?.chronicle;
  }
}
