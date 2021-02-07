import * as cdk from '@aws-cdk/core';
import { ValidationMethod } from "@aws-cdk/aws-certificatemanager";
import * as cm from '@aws-cdk/aws-certificatemanager';
import * as s3 from '@aws-cdk/aws-s3'
import * as ssm from '@aws-cdk/aws-ssm';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import { bucketRef } from './myconstants';


const domainName = "nichole.is";
const bucket = bucketRef;

export class SslCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct) {
    super(scope, "CertificateStack", {
      env: { region: "us-east-1" },
    });

    const certificate = new cm.Certificate(this, "CustomDomainCertificate", {
      domainName: domainName,
      subjectAlternativeNames: ['*.nichole.is'],
      validationMethod: ValidationMethod.DNS,
    });

    const certificateArn = certificate.certificateArn;
    new cdk.CfnOutput(this, "CertificateArn", {
      value: certificateArn,
    });

    //CloudFront Distribution 
    // const distribution = new CloudFrontWebDistribution(this, 'cdk-example-cfront', {
    //   originConfigs: [
    //     {
    //       s3OriginSource: {
    //         s3BucketSource: sourceBucket
    //       },
    //       behaviors : [ {isDefaultBehavior: true}]
    //     }
    //   ],
    //   aliasConfiguration: {
    //     acmCertRef: certificateArn,
    //     names: ['cdk-example.awsexamples.dev']
    //   }
    // });
    const sourceBucket = new s3.Bucket(this, 'TestBucket',{
            versioned: false,
            removalPolicy: cdk.RemovalPolicy.DESTROY
          });

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        viewerCertificate: {
          aliases: ['cdk.nichole.is'],
          props: {
            acmCertificateArn: certificateArn,
            sslSupportMethod: "sni-only",
          },
        },
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: sourceBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      });
  }
}