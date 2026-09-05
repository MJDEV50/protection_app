import * as cdk from 'aws-cdk-lib';
import { RefugeStack } from '../lib/refuge-stack';

const app = new cdk.App();

new RefugeStack(app, 'RefugeStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Refuge Women Safety App - Production Infrastructure',
});

app.synth();
