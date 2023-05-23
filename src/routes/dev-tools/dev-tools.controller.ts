/**
 * Importing npm packages
 */
import { Controller, Get, Query, Render, UseGuards } from '@nestjs/common';
import moment from 'moment';

/**
 * Importing user defined packages
 */
import { AuthService } from '@app/modules/auth';
import { DevGuard } from '@app/shared/guards';
import { Context, Storage } from '@app/shared/services';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Controller('dev-tools')
export class DevToolsController {
  constructor(private readonly authService: AuthService) {}

  @Get('graphiql')
  @UseGuards(DevGuard(true))
  @Render('admin.hbs')
  getGraphiQL(@Query('app') app: string): { url: string; csrfToken?: string } {
    const apps = Storage.get<string[]>('graphql', []);
    const url = `/graphql/${apps.includes(app) ? app : 'admin'}`;

    const user = Context.getCurrentUser();
    if (!user?.admin) return { url };

    const expireAt = moment().add(2, 'hour');
    const csrfToken = this.authService.generateCSRFToken(expireAt);
    return { csrfToken, url };
  }
}
