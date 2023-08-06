/**
 * Importing npm packages
 */
import { Module } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { ChronicleModule } from '@app/modules/chronicle';
import { FictionModule } from '@app/modules/fiction';
import { UserModule } from '@app/modules/user';

import { SeederService } from './seeder.service';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Module({
  imports: [UserModule, ChronicleModule, FictionModule],
  providers: [SeederService],
})
export class SeederModule {}
