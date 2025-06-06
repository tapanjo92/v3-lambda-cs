import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchLogsEvent } from 'aws-lambda';
import { gunzipSync } from 'zlib';

export interface ColdStartReport {
  type: 'ColdStartReport';
  tenantId: string;
  functionName: string;
  memorySizeMb: number;
  initDurationMs: number;
}

const PRICE_PER_GB_SECOND = 0.0000166667;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export function computeCost(memorySizeMb: number, initDurationMs: number): number {
  const memoryGb = memorySizeMb / 1024;
  const durationSeconds = initDurationMs / 1000;
  return memoryGb * durationSeconds * PRICE_PER_GB_SECOND;
}

export async function handler(event: CloudWatchLogsEvent): Promise<void> {
  let payload: any;
  try {
    const decompressed = gunzipSync(Buffer.from(event.awslogs.data, 'base64')).toString('utf8');
    payload = JSON.parse(decompressed);
  } catch (err) {
    console.error('Failed to decode logs payload', err);
    throw err;
  }

  for (const logEvent of payload.logEvents) {
    try {
      const report = JSON.parse(logEvent.message) as ColdStartReport;
      const cost = computeCost(report.memorySizeMb, report.initDurationMs);
      const timestamp = new Date(logEvent.timestamp).toISOString();

      await ddb.send(new PutCommand({
        TableName: process.env.TABLE_NAME!,
        Item: {
          tenantId: report.tenantId,
          'timestamp#functionName': `${timestamp}#${report.functionName}`,
          memorySizeMb: report.memorySizeMb,
          initDurationMs: report.initDurationMs,
          cost
        }
      }));
    } catch (err) {
      console.error('Failed to process log event', err);
      throw err;
    }
  }
}
