import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function getTenantId(event: APIGatewayProxyEventV2): string | undefined {
  const auth: any = (event as any).requestContext.authorizer;
  return auth?.tenantId || auth?.lambda?.tenantId || auth?.jwt?.claims?.tenantId;
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  const tenantId = getTenantId(event);
  if (!tenantId) {
    return { statusCode: 400, body: 'Missing tenantId' };
  }

  const result = await ddb.send(new QueryCommand({
    TableName: process.env.TABLE_NAME!,
    KeyConditionExpression: 'tenantId = :tid',
    ExpressionAttributeValues: { ':tid': tenantId }
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items ?? [])
  };
}
