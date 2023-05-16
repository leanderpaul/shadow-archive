/**
 * Importing npm packages
 */
import { Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Importing user defined packages
 */
import { Expense, type ExpenseModel } from './schemas/expense.schema';
import { Memoir, type MemoirModel } from './schemas/memoir.schema';
import { NativeUser, type NativeUserModel, OAuthUser, type OAuthUserModel, User, type UserModel } from './schemas/user.schema';

/**
 * Defining types
 */

export enum UserVariant {
  NATIVE,
  OAUTH,
}

/**
 * Declaring the constants
 */
const users = [
  {
    email: 'admin@shadow-apps.com',
    name: 'Shadow Apps Administrator',
    password: 'Password@123',
    verified: true,
    admin: true,
  },
];

@Injectable()
export class DatabaseService implements OnApplicationShutdown, OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private readonly userModel: UserModel,
    @InjectModel(NativeUser.name) private readonly nativeUserModel: NativeUserModel,
    @InjectModel(OAuthUser.name) private readonly oauthUserModel: OAuthUserModel,
    @InjectModel(Expense.name) private readonly expenseModel: ExpenseModel,
    @InjectModel(Memoir.name) private readonly memoirModel: MemoirModel,
  ) {}

  async onModuleInit() {
    for (const user of users) {
      const userDoc = await this.userModel.findOne({ email: user.email });
      if (!userDoc) await this.nativeUserModel.create(user);
    }
  }

  onApplicationShutdown() {
    return this.connection.close();
  }

  getUserModel(): UserModel;
  getUserModel(variant: UserVariant.NATIVE): NativeUserModel;
  getUserModel(variant: UserVariant.OAUTH): OAuthUserModel;
  getUserModel(variant?: UserVariant): UserModel | NativeUserModel | OAuthUserModel {
    return variant === undefined ? this.userModel : variant === UserVariant.NATIVE ? this.nativeUserModel : this.oauthUserModel;
  }

  getExpenseModel() {
    return this.expenseModel;
  }

  getMemoirModel() {
    return this.memoirModel;
  }
}
