/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DatabaseService } from '@app/providers/database';
import { Projection } from '@app/shared/utils';

import { PageInput } from '../common';
import { UserSort } from './admin.dto';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Injectable()
export class AdminService {
  private readonly userModel;

  constructor(databaseService: DatabaseService) {
    this.userModel = databaseService.getUserModel();
  }

  async getUser(emailOrUid: string) {
    const query = emailOrUid.includes('@') ? { email: emailOrUid } : { _id: emailOrUid };
    return await this.userModel.findOne(query).lean();
  }

  async searchUsers<T extends object>(projection: Projection<T>, sort: UserSort, page: PageInput, email?: string) {
    const users = await this.userModel
      .find(email ? { email: new RegExp(email) } : {}, projection)
      .sort({ [sort.field]: sort.order })
      .skip(page.offset)
      .limit(page.limit)
      .lean();
    return users.map(user => ({ ...user, hasPasswordResetCode: !!user.passwordResetCode }));
  }

  async getTotalUsers(email?: string) {
    return await this.userModel.countDocuments(email ? { email: new RegExp(email) } : {});
  }

  async verifyUser(emailOrUid: string) {
    const query = emailOrUid.includes('@') ? { email: emailOrUid } : { _id: emailOrUid };
    const result = await this.userModel.updateOne(query, { $set: { verified: true }, $unset: { emailVerificationCode: '' } });
    return result.modifiedCount === 1;
  }
}
