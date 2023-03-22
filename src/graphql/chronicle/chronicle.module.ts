/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ExpenseMongooseModule, UserMongooseModule, ContextService, MetadataMongooseModule } from '@app/providers';
import { AuthModule, AuthService } from '@app/shared/modules';

import { ChronicleService } from './chronicle.service';
import { ChronicleResolver } from './chronicle.resolver';

/**
 * Importing and defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [ExpenseMongooseModule, AuthModule, UserMongooseModule, MetadataMongooseModule],
  providers: [ChronicleResolver, ChronicleService, ContextService, AuthService],
})
export class ChronicleModule {}
