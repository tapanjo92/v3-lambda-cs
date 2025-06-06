import { gzipSync } from 'zlib';

let sendMock: jest.Mock;

jest.mock('@aws-sdk/lib-dynamodb', () => {
  sendMock = jest.fn();
  return {
    DynamoDBDocumentClient: { from: jest.fn().mockReturnValue({ send: sendMock }) },
    PutCommand: jest.fn().mockImplementation((input) => ({ input }))
  };
});

import { handler, computeCost } from '../src/index';

describe('computeCost', () => {
  it('calculates cost correctly', () => {
    const cost = computeCost(512, 2000);
    expect(cost).toBeCloseTo((512/1024) * 2 * 0.0000166667);
  });
});

describe('handler', () => {
  it('stores parsed record in DynamoDB', async () => {
    process.env.TABLE_NAME = 'table';
    const report = {
      type: 'ColdStartReport',
      tenantId: 't1',
      functionName: 'fn',
      memorySizeMb: 128,
      initDurationMs: 100
    };
    const payload = {
      logEvents: [
        { id: '1', timestamp: 0, message: JSON.stringify(report) }
      ]
    };
    const event = {
      awslogs: { data: gzipSync(Buffer.from(JSON.stringify(payload))).toString('base64') }
    } as any;

    await handler(event);

    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({
        TableName: 'table',
        Item: expect.objectContaining({
          tenantId: 't1',
          memorySizeMb: 128,
          initDurationMs: 100,
          cost: computeCost(128, 100)
        })
      })
    }));
  });
});
