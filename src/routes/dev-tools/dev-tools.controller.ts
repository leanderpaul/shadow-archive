/**
 * Importing npm packages
 */
import moment from 'moment';

import { Controller, Get, Query, Render, UseGuards } from '@nestjs/common';

/**
 * Importing user defined packages
 */
import { DevGuard } from '@app/shared/guards';
import { AuthService } from '@app/shared/modules';
import { Utils } from '@app/shared/utils';
import { ContextService } from '@app/providers/context';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

@Controller('dev-tools')
export class DevToolsController {
  constructor(private readonly authService: AuthService, private readonly contextService: ContextService) {}

  @Get('graphiql')
  @UseGuards(DevGuard(true))
  @Render('admin.hbs')
  getGraphiQL(@Query('app') app: string) {
    const apps = Utils.getCache<string[]>('graphql') || [];
    const url = `/graphql/${apps.includes(app) ? app : 'admin'}`;

    const user = this.contextService.getCurrentUser();
    if (!user?.admin) return { url };

    const expireAt = moment().add(2, 'hour');
    const csrfToken = this.authService.generateCSRFToken(expireAt);
    return { csrfToken, url };
  }
}
