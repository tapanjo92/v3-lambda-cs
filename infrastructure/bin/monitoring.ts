#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { MonitoringStack } from '../lib/monitoring-stack';
import { PipelineRoleStack } from '../lib/pipeline-role-stack';

const app = new App();
const envName = app.node.tryGetContext('envName') || 'prod';
const repo = app.node.tryGetContext('githubRepo') || 'owner/repo';

new MonitoringStack(app, 'MonitoringStack', {
  environmentName: envName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});

new PipelineRoleStack(app, 'PipelineRoleStack', {
  repo,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
