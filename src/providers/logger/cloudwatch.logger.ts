/**
 * Importing npm packages
 */
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import stringify from 'fast-safe-stringify';
import Transport from 'winston-transport';

/**
 * Importing user defined packages
 */
import { Config } from '@app/shared/services/internal';

/**
 * Defining types
 */

interface LogEvent {
  timestamp: number;
  message: string;
}

/**
 * Declaring the constants
 */
export class CloudWatchTransport extends Transport {
  private readonly cloudWatchLogs = new CloudWatchLogs({ region: Config.get('aws.region') });
  private readonly logGroupName = Config.get('aws.cloudwatch.log-group');
  private readonly logStreamName = Config.get('aws.cloudwatch.log-stream');
  private readonly uploadRate = Config.get('aws.cloudwatch.upload-rate');

  private timeout: NodeJS.Timeout | null = null;
  private logEvents: LogEvent[] = [];
  private isStreamPresent = false;

  private add(log: any): void {
    this.logEvents.push({ timestamp: Date.now(), message: stringify(log) });
    if (!this.timeout) this.timeout = setTimeout(() => this.flush(), this.uploadRate);
  }

  private async checkStream(): Promise<void> {
    try {
      const streams = await this.cloudWatchLogs.describeLogStreams({ logGroupName: this.logGroupName });
      const streamExists = streams.logStreams?.some(stream => stream.logStreamName === this.logStreamName) ?? false;
      if (!streamExists) await this.cloudWatchLogs.createLogStream({ logGroupName: this.logGroupName, logStreamName: this.logStreamName });
      this.isStreamPresent = true;
    } catch (err) {
      console.error('Error checking log stream', err); // eslint-disable-line no-console
    }
  }

  private async flush(): Promise<void> {
    if (this.logEvents.length === 0) return;
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;

    const logEvents = this.logEvents;
    this.logEvents = [];
    if (!this.isStreamPresent) await this.checkStream();
    await this.cloudWatchLogs
      .putLogEvents({ logEvents, logGroupName: this.logGroupName, logStreamName: this.logStreamName })
      .catch(err => console.error('Error flushing cloudwatch logs', err)); // eslint-disable-line no-console
  }

  override log(info: object, next: () => void): void {
    setImmediate(() => this.emit('logged', info));
    this.add(info);
    next();
  }

  override close(): Promise<void> {
    return this.flush();
  }
}
