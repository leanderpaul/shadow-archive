/**
 * Importing npm packages
 */
import moment from 'moment';

import { Controller, Get, Query, Render } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { AuthType, UseAuth } from '@app/shared/decorators';
import { AuthService } from '@app/shared/modules';
import { Utils } from '@app/shared/utils';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Controller('admin')
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseAuth(AuthType.ADMIN)
  @Render('admin.hbs')
  getGraphiQL(@Query('app') app: string) {
    const apps = Utils.getCache<string[]>('graphql') || [];
    const url = `/graphql/${apps.includes(app) ? app : 'admin'}`;
    const expireAt = moment().add(2, 'hour');
    const csrfToken = this.authService.generateCSRFToken(expireAt);
    return { csrfToken, url };
  }
}
