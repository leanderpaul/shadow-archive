/**
 * Importing npm packages
 */
import fs from 'fs';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, MailService as SendGridMail } from '@sendgrid/mail';
import mustache from 'mustache';
import sagus from 'sagus';

/**
 * Importing user defined packages
 */
import { ConfigRecord } from '@app/config';
import { Logger } from '@app/providers/logger';

/**
 * Defining types
 */

export enum MailType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

interface ITemplate {
  from: string;
  html: string;
  subject: string;
}

interface ICodeMailPayload {
  name: string;
  code: string;
}

type TMailTemplates = {
  [key in MailType]: Omit<ITemplate, 'html'> & { filename: string };
};

/**
 * Declaring the constants
 */
const MAX_RETRY_ATTEMPTS = 3;

const logger = Logger.getLogger('mail');
const mailTemplates: TMailTemplates = {
  [MailType.EMAIL_VERIFICATION]: { from: 'no-reply@shadow-apps.com', filename: 'email-verification', subject: 'Email Verification' },
  [MailType.RESET_PASSWORD]: { from: 'no-reply@shadow-apps.com', filename: 'reset-password', subject: 'Reset Your Password' },
};

@Injectable()
export class MailService {
  private readonly mail: SendGridMail;
  private readonly templates = new Map<string, ITemplate>();
  private readonly defaultData: Record<string, string>;
  private isEnabled = false;

  constructor(configService: ConfigService<ConfigRecord>) {
    this.mail = new SendGridMail();
    const apiKey = configService.get('SENDGRID_API_KEY');
    const domain = configService.get('DOMAIN');
    if (apiKey && !configService.get('IS_TEST_SERVER')) {
      this.mail.setApiKey(apiKey);
      this.isEnabled = true;
    }
    this.defaultData = { domain };
  }

  private getTemplate(mailType: MailType) {
    let template = this.templates.get(mailType);
    if (template) return template;

    const mailTemplate = mailTemplates[mailType];
    const filename = `${__dirname}/templates/${mailTemplate.filename}.hbs`;
    const html = fs.readFileSync(filename).toString();

    template = { from: mailTemplate.from, html, subject: mailTemplate.subject };
    this.templates.set(mailType, template);

    return template;
  }

  private async _sendMail(data: MailDataRequired, retryAttempt = 1) {
    if (!this.isEnabled) {
      const obj = sagus.pickKeys(data, ['from', 'to', 'subject', 'html']);
      logger.warn(`mail service disabled, but got '${data.subject}' mail to '${data.to}'`, obj);
      return;
    }

    const [response] = await this.mail.send(data);
    if (response.statusCode != 202) {
      if (retryAttempt < MAX_RETRY_ATTEMPTS) this._sendMail(data, retryAttempt + 1);
      else logger.warn(`Failed to send email to '${data.to}'`, { response });
    }
  }

  sendMail(mailType: MailType.EMAIL_VERIFICATION | MailType.RESET_PASSWORD, to: string, data: ICodeMailPayload): void;
  sendMail(mailType: MailType, to: string, data: object) {
    const template = this.getTemplate(mailType);
    const html = mustache.render(template.html, data);
    this._sendMail({ ...this.defaultData, ...template, html, to });
  }
}
