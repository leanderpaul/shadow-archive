/**
 * Importing npm packages
 */
import { Controller, Get, Param, Render, UseGuards } from '@nestjs/common';
import moment from 'moment';

/**
 * Importing user defined packages
 */
import { AuthService } from '@app/modules/auth';
import { DevGuard } from '@app/shared/guards';
import { Context, Storage } from '@app/shared/services';
import { AppError, ErrorCode } from '@app/shared/errors';

/**
 * Defining types
 */

interface AdminTemplatePayload {
  url: string;
  appName: string;
  csrfToken?: string;
}

/**
 * Declaring the constants
 */

@Controller('dev-tools')
export class DevToolsController {
  constructor(private readonly authService: AuthService) {}

  @Get('graphiql/:appName')
  @UseGuards(DevGuard(true))
  @Render('admin.hbs')
  getGraphiQL(@Param('appName') appName: string): AdminTemplatePayload {
    const apps = Storage.get<string[]>('graphql', []);
    if (!apps.includes(appName)) throw new AppError(ErrorCode.R001);

    const url = `/graphql/${appName}`;
    const user = Context.getCurrentUser();
    if (!user?.admin) return { url, appName };

    const expireAt = moment().add(2, 'hour');
    const csrfToken = this.authService.generateCSRFToken(expireAt);
    return { csrfToken, url, appName };
  }
}
