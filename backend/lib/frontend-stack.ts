import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface FrontendStackProps extends cdk.StackProps {
  appSyncApi: appsync.GraphqlApi;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  environment: string;
}

export class FrontendStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);
    
    // S3 bucket for frontend hosting
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `agentic-ai-factory-frontend-${props.environment}-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create OAI
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    this.bucket.grantRead(oai);

    // CloudFront distribution using L1 construct
    const cfnDistribution = new cloudfront.CfnDistribution(this, 'FrontendDistribution', {
      distributionConfig: {
        enabled: true,
        defaultRootObject: 'index.html',
        priceClass: 'PriceClass_100',
        comment: 'Agentic AI Factory Frontend Distribution',
        origins: [
          {
            id: 's3-origin',
            domainName: this.bucket.bucketRegionalDomainName,
            s3OriginConfig: {
              originAccessIdentity: `origin-access-identity/cloudfront/${oai.originAccessIdentityId}`,
            },
          },
          {
            id: 'appsync-origin',
            domainName: cdk.Fn.select(2, cdk.Fn.split('/', props.appSyncApi.graphqlUrl)),
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'https-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],
        defaultCacheBehavior: {
          targetOriginId: 's3-origin',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          compress: true,
          cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized
        },
        cacheBehaviors: [
          {
            pathPattern: '/api/*',
            targetOriginId: 'appsync-origin',
            viewerProtocolPolicy: 'https-only',
            allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
            cachedMethods: ['GET', 'HEAD'],
            cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
            originRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // CORS-S3Origin
          },
        ],
        customErrorResponses: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: '/index.html',
            errorCachingMinTtl: 1800,
          },
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: '/index.html',
            errorCachingMinTtl: 1800,
          },
        ],
      },
    });

    this.distribution = cloudfront.Distribution.fromDistributionAttributes(this, 'Distribution', {
      distributionId: cfnDistribution.ref,
      domainName: cfnDistribution.attrDomainName,
    }) as cloudfront.Distribution;

    // Create a configuration file for the frontend
    const frontendConfig = {
      aws_project_region: this.region,
      aws_appsync_graphqlEndpoint: props.appSyncApi.graphqlUrl,
      aws_appsync_region: this.region,
      aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      aws_cognito_region: this.region,
      aws_user_pools_id: props.userPool.userPoolId,
      aws_user_pools_web_client_id: props.userPoolClient.userPoolClientId, 
      aws_cognito_identity_pool_id: '', // Optional: Add if using Identity Pool
      aws_mandatory_sign_in: 'enable',
      aws_cognito_username_attributes: ['EMAIL'],
      aws_cognito_social_providers: [],
      aws_cognito_signup_attributes: ['EMAIL', 'GIVEN_NAME', 'FAMILY_NAME'],
      aws_cognito_mfa_configuration: 'OPTIONAL',
      aws_cognito_mfa_types: ['SMS', 'TOTP'],
      aws_cognito_password_protection_settings: {
        passwordPolicyMinLength: 8,
        passwordPolicyCharacters: ['REQUIRES_LOWERCASE', 'REQUIRES_UPPERCASE', 'REQUIRES_NUMBERS', 'REQUIRES_SYMBOLS'],
      },
      aws_cognito_verification_mechanisms: ['EMAIL'],
    };

    // Deploy frontend build files to S3
    const frontendBuildPath = process.env.FRONTEND_BUILD_PATH || '../frontend/build';
    new s3deploy.BucketDeployment(this, 'FrontendBuildDeployment', {
      sources: [s3deploy.Source.asset(frontendBuildPath), s3deploy.Source.jsonData('aws-exports.json', frontendConfig)],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths:["/*"]
    });

    // Outputs
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'Frontend URL',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.bucket.bucketName,
      description: 'Frontend S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });
  }
}