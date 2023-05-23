/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { type ChronicleMetadata, DatabaseService } from '@app/modules/database';
import { NeverError } from '@app/shared/errors';
import { Context } from '@app/shared/services';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Injectable()
export class ChronicleMetadataService {
  private readonly userModel;

  constructor(databaseService: DatabaseService) {
    this.userModel = databaseService.getUserModel();
  }

  async getUserMetadata(): Promise<ChronicleMetadata> {
    const { _id } = Context.getCurrentUser(true);
    const user = await this.userModel.findOne({ _id }, 'chronicle').lean();
    if (!user) throw new NeverError('user not found');
    return user.chronicle;
  }
}
