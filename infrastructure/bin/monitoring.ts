#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new App();
const envName = app.node.tryGetContext('envName') || 'prod';

new MonitoringStack(app, 'MonitoringStack', {
  environmentName: envName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
