let sendMock: jest.Mock;

jest.mock('@aws-sdk/lib-dynamodb', () => {
  sendMock = jest.fn().mockResolvedValue({ Items: [{ id: 1 }] });
  return {
    DynamoDBDocumentClient: { from: jest.fn().mockReturnValue({ send: sendMock }) },
    QueryCommand: jest.fn().mockImplementation((input) => ({ input }))
  };
});

import { handler } from '../src/index';

describe('handler', () => {
  it('queries records for tenant', async () => {
    process.env.TABLE_NAME = 'table';
    const event = {
      requestContext: { authorizer: { tenantId: 't1' } }
    } as any;

    const res = await handler(event);

    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({
        TableName: 'table',
        KeyConditionExpression: 'tenantId = :tid',
        ExpressionAttributeValues: { ':tid': 't1' }
      })
    }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 1 }]);
  });

  it('returns 400 if tenantId missing', async () => {
    const event = { requestContext: { authorizer: {} } } as any;

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
  });
});
