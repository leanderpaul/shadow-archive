/**
 * Importing npm packages
 */
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Importing user defined packages
 */
import { User, UserModel, NativeUser, NativeUserModel, OAuthUser, OAuthUserModel } from './schemas';
import { Expense, ExpenseModel, Metadata, MetadataModel, ChronicleMetadata, ChronicleMetadataModel, Memoir, MemoirModel } from './schemas';

/**
 * Defining types
 */

export enum UserVariant {
  NATIVE,
  OAUTH,
}

export enum MetadataVariant {
  CHRONICLE,
}

/**
 * Declaring the constants
 */

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private readonly userModel: UserModel,
    @InjectModel(NativeUser.name) private readonly nativeUserModel: NativeUserModel,
    @InjectModel(OAuthUser.name) private readonly oauthUserModel: OAuthUserModel,
    @InjectModel(Expense.name) private readonly expenseModel: ExpenseModel,
    @InjectModel(Metadata.name) private readonly metadataModel: MetadataModel,
    @InjectModel(ChronicleMetadata.name) private readonly chronicleMetadataModel: ChronicleMetadataModel,
    @InjectModel(Memoir.name) private readonly memoirModel: MemoirModel,
  ) {}

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

  getMetadataModel(): MetadataModel;
  getMetadataModel(variant: MetadataVariant.CHRONICLE): ChronicleMetadataModel;
  getMetadataModel(variant?: MetadataVariant): MetadataModel | ChronicleMetadataModel {
    return variant === undefined ? this.metadataModel : this.chronicleMetadataModel;
  }

  getMemoirModel() {
    return this.memoirModel;
  }
}
