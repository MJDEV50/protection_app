import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class RefugeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'RefugeVpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24,
        },
      ],
    });

    // Security Groups
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for PostgreSQL',
      allowAllOutbound: true,
    });

    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc,
      description: 'Security group for Redis',
      allowAllOutbound: true,
    });

    // Allow Lambda/App to access database
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // Allow Lambda/App to access cache
    cacheSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC'
    );

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'RefugeKmsKey', {
      enableKeyRotation: true,
    });

    // RDS PostgreSQL
    const database = new rds.DatabaseInstance(this, 'RefugeDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
      securityGroups: [dbSecurityGroup],
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      allocatedStorage: 100,
      databaseName: 'refuge_prod',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(30),
      multiAz: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      enableIamAuthentication: true,
      enableCloudwatchLogsExports: ['postgresql'],
    });

    // ElastiCache Redis
    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'CacheSubnetGroup',
      {
        description: 'Subnet group for Redis',
        subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
      }
    );

    const cache = new elasticache.CfnCacheCluster(this, 'RefugeCache', {
      engine: 'redis',
      engineVersion: '7.0',
      cacheNodeType: 'cache.t3.micro',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [cacheSecurityGroup.securityGroupId],
      cacheSubnetGroupName: cacheSubnetGroup.ref,
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      transitEncryptionMode: 'preferred',
      autoFailoverEnabled: false,
      multiAzEnabled: false,
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
    });

    // S3 Bucket for avatars and media
    const mediaBucket = new s3.Bucket(this, 'RefugeMediaBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90),
          prefix: 'temp/',
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'RefugeUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        phone: true,
      },
      autoVerifiedAttributes: [
        cognito.UserPoolAttribute.EMAIL,
      ],
      userVerification: {
        emailSubject: 'Welcome to Refuge! Verify your email',
        emailBody: 'Your verification code is {####}',
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
    });

    // Cognito App Client
    userPool.addClient('RefugeAppClient', {
      authFlows: {
        userPassword: true,
        custom: true,
        userSrp: true,
        adminUserPassword: true,
      },
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(7),
      accessTokenValidity: cdk.Duration.minutes(15),
      idTokenValidity: cdk.Duration.minutes(15),
    });

    // SNS Topics for notifications
    const sosAlertTopic = new sns.Topic(this, 'SosAlertTopic', {
      displayName: 'SOS Alerts',
      masterKey: kmsKey,
    });

    const locationUpdateTopic = new sns.Topic(this, 'LocationUpdateTopic', {
      displayName: 'Location Updates',
      masterKey: kmsKey,
    });

    const safeWalkTopic = new sns.Topic(this, 'SafeWalkTopic', {
      displayName: 'Safe Walk Updates',
      masterKey: kmsKey,
    });

    // CloudWatch Log Groups
    new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: '/aws/lambda/refuge-api',
      retention: logs.RetentionDays.TWO_WEEKS,
      encryption: kmsKey,
    });

    new logs.LogGroup(this, 'DatabaseLogGroup', {
      logGroupName: '/aws/rds/refuge-database',
      retention: logs.RetentionDays.ONE_MONTH,
      encryption: kmsKey,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseHost', {
      value: database.dbInstanceEndpointAddress,
      exportName: 'RefugeDatabaseHost',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.dbInstanceEndpointPort,
      exportName: 'RefugeDatabasePort',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret?.secretArn || '',
      exportName: 'RefugeDatabaseSecretArn',
    });

    new cdk.CfnOutput(this, 'CacheEndpoint', {
      value: cache.attrRedisEndpoint.address,
      exportName: 'RefugeCacheEndpoint',
    });

    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
      exportName: 'RefugeMediaBucketName',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: 'RefugeUserPoolId',
    });

    new cdk.CfnOutput(this, 'SosAlertTopicArn', {
      value: sosAlertTopic.topicArn,
      exportName: 'RefugeSosAlertTopicArn',
    });
  }
}
