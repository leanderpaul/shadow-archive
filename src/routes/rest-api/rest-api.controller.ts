/**
 * Importing npm packages
 */
import { Controller, Get } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { UserService } from '@app/modules/user';
import { AuthType, UseAuthGuard } from '@app/shared/decorators';
import { NeverError } from '@app/shared/errors';
import { Context } from '@app/shared/services';

/**
 * Defining types
 */

interface User {
  uid: string;
  email: string;
  name: string;
  verified: boolean;
  imageUrl?: string;
}

/**
 * Declaring the constants
 */

@Controller('api')
export class RESTAPIController {
  constructor(private readonly userService: UserService) {}

  @Get('user')
  @UseAuthGuard(AuthType.AUTHENTICATED)
  async getCurrentUser(): Promise<User> {
    const { uid, email, verified } = Context.getCurrentUser(true);
    const user = await this.userService.getUser(uid, ['name', 'imageUrl']);
    if (!user) throw new NeverError('User not found');
    return { uid: uid.toString(), email, name: user.name, verified, imageUrl: user.imageUrl };
  }
}
