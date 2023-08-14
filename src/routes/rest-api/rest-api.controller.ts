/**
 * Importing npm packages
 */
import { Controller, Get, Query } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AuthService } from '@app/modules/auth';
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
  csrfToken?: string;
}

/**
 * Declaring the constants
 */

@Controller('api')
export class RESTAPIController {
  constructor(private readonly userService: UserService, private readonly authService: AuthService) {}

  @Get('user')
  @UseAuthGuard(AuthType.AUTHENTICATED)
  async getCurrentUser(@Query('csrf') csrf?: string): Promise<User> {
    const { uid, email, verified } = Context.getCurrentUser(true);
    const user = await this.userService.getUser(uid, ['name', 'imageUrl']);
    if (!user) throw new NeverError('User not found');
    const data: User = { uid: uid.toString(), email, name: user.name, verified, imageUrl: user.imageUrl };
    if (csrf === 'true') data.csrfToken = this.authService.generateCSRFToken();
    return data;
  }
}
