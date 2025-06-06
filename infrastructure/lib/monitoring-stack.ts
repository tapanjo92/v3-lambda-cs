import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as alarms from 'aws-cdk-lib/aws-cloudwatch';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integ from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as destinations from 'aws-cdk-lib/aws-logs-destinations';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface MonitoringStackProps extends StackProps {
  environmentName: string; // e.g. 'prod'
}

export class MonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'RecordsTable', {
      partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp#functionName', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.env?.account ? undefined : undefined
    });

    const dlq = new sqs.Queue(this, 'ProcessingDLQ', {
      retentionPeriod: Duration.days(14)
    });

    const processingFn = new lambda.Function(this, 'ProcessingLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = async ()=>{}'),
      deadLetterQueue: dlq,
      deadLetterQueueEnabled: true
    });

    const dlqAlarm = new alarms.Alarm(this, 'DLQAlarm', {
      metric: dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1
    });

    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = async ()=>{}')
    });

    table.grantReadWriteData(processingFn);
    table.grantReadData(apiHandler);

    const httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      defaultIntegration: new integ.HttpLambdaIntegration('DefaultIntegration', apiHandler)
    });

    const userPool = new cognito.UserPool(this, 'UserPool');
    const userPoolClient = userPool.addClient('UserPoolClient');

    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName
        }
      ]
    });

    const authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
        'StringEquals': {'cognito-identity.amazonaws.com:aud': identityPool.ref},
        'ForAnyValue:StringLike': {'cognito-identity.amazonaws.com:amr': 'authenticated'}
      }, 'sts:AssumeRoleWithWebIdentity')
    });

    authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [httpApi.arnForExecuteApi()]
    }));

    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoles', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn
      }
    });

    const logGroup = new logs.LogGroup(this, 'CustomerLogGroup');

    new logs.SubscriptionFilter(this, 'LogSubscription', {
      logGroup,
      destination: new destinations.LambdaDestination(processingFn),
      filterPattern: logs.FilterPattern.literal('{ $.type = "ColdStartReport" }')
    });

    const prefix = `/${props.environmentName}`;

    new ssm.StringParameter(this, 'ApiUrlParameter', {
      parameterName: `${prefix}/api/url`,
      stringValue: httpApi.apiEndpoint
    });

    new ssm.StringParameter(this, 'UserPoolIdParameter', {
      parameterName: `${prefix}/cognito/userPoolId`,
      stringValue: userPool.userPoolId
    });

    new ssm.StringParameter(this, 'UserPoolClientIdParameter', {
      parameterName: `${prefix}/cognito/userPoolClientId`,
      stringValue: userPoolClient.userPoolClientId
    });

    new ssm.StringParameter(this, 'IdentityPoolIdParameter', {
      parameterName: `${prefix}/cognito/identityPoolId`,
      stringValue: identityPool.ref
    });

    new ssm.StringParameter(this, 'AuthenticatedRoleArnParameter', {
      parameterName: `${prefix}/cognito/authenticatedRoleArn`,
      stringValue: authenticatedRole.roleArn
    });

    new ssm.StringParameter(this, 'TableNameParameter', {
      parameterName: `${prefix}/dynamodb/tableName`,
      stringValue: table.tableName
    });

  }
}
