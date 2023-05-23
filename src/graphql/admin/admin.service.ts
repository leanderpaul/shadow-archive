/**
 * Importing npm packages
 */
import { Injectable } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { type PageInput, type Projection } from '@app/graphql/common';
import { DatabaseService, type User } from '@app/modules/database';

import { type UserSort } from './admin.dto';
import { type User as GUser } from './admin.entity';

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

  private convertUser(user: User): GUser {
    return { ...user, hasPasswordResetCode: !!user.passwordResetCode };
  }

  async getUser(emailOrUid: string): Promise<GUser | null> {
    const query = emailOrUid.includes('@') ? { email: emailOrUid } : { _id: emailOrUid };
    const user = await this.userModel.findOne(query).lean();
    return user ? this.convertUser(user) : null;
  }

  async findUsers<T extends object>(projection: Projection<T>, sort: UserSort, page: PageInput, email?: string): Promise<GUser[]> {
    const users = await this.userModel
      .find(email ? { email: new RegExp(email) } : {}, projection)
      .sort({ [sort.field]: sort.order })
      .skip(page.offset)
      .limit(page.limit)
      .lean();
    return users.map(user => this.convertUser(user));
  }

  async getTotalUsers(email?: string): Promise<number> {
    return await this.userModel.countDocuments(email ? { email: new RegExp(email) } : {});
  }

  async verifyUser(emailOrUid: string): Promise<boolean> {
    const query = emailOrUid.includes('@') ? { email: emailOrUid } : { _id: emailOrUid };
    const result = await this.userModel.updateOne(query, { $set: { verified: true }, $unset: { emailVerificationCode: '' } });
    return result.modifiedCount === 1;
  }
}
