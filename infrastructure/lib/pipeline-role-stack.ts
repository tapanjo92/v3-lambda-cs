import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface PipelineRoleStackProps extends StackProps {
  repo: string; // GitHub repository in the form "owner/name"
}

export class PipelineRoleStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineRoleStackProps) {
    super(scope, id, props);

    const role = new iam.Role(this, 'GithubActionsRole', {
      assumedBy: new iam.WebIdentityPrincipal('token.actions.githubusercontent.com', {
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${props.repo}:*`
        },
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com'
        }
      })
    });

    role.addToPolicy(new iam.PolicyStatement({
      actions: [
        'cloudformation:*',
        's3:*',
        'iam:PassRole',
        'ssm:GetParameter',
        'ssm:GetParameters'
      ],
      resources: ['*']
    }));
  }
}
