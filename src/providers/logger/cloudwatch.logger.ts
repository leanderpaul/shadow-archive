/**
 * Importing npm packages
 */
import os from 'os';

import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import WinstonCloudWatch from 'winston-cloudwatch';

/**
 * Importing user defined packages
 */
import { Config } from '@app/shared/services/internal';

/**
 * Defining types
 */

/**
 * Declaring the constants
 */

export class CloudWatchLogger {
  private readonly transport;

  constructor() {
    const networkInterfaceInfo = os.networkInterfaces().eth0?.find(info => info.family === 'IPv4');
    this.transport = new WinstonCloudWatch({
      cloudWatchLogs: new CloudWatchLogs({ region: Config.get('aws.region') }),
      level: Config.get('log.level'),
      logGroupName: Config.get('aws.cloudwatch.log-group'),
      logStreamName: networkInterfaceInfo?.address || 'unknown',
      jsonMessage: true,
      name: Config.get('app.name'),
      retentionInDays: 7,
      errorHandler: this.handleError,
    });
  }

  private handleError(err: Error): void {
    console.error('Error flushing cloudwatch logs', err); // eslint-disable-line no-console
  }

  getTransport(): WinstonCloudWatch {
    return this.transport;
  }

  close(): void {
    this.transport.kthxbye(this.handleError);
  }
}
