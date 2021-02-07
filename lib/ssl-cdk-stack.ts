import * as cdk from '@aws-cdk/core';
import { ValidationMethod } from "@aws-cdk/aws-certificatemanager";
import * as cm from '@aws-cdk/aws-certificatemanager';
import * as s3 from '@aws-cdk/aws-s3'
import * as ssm from '@aws-cdk/aws-ssm';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import { bucketRef, account } from './myconstants';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';


const domainName = "nichole.is";
const bucket = bucketRef;

export class SslCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, "CertificateStack", {
      env: { region: "us-east-1",
            account: account, },
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
            customOriginSource: {
              domainName: 'sendgrid.net',
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      });

      // Route53 alias record for the CloudFront distribution
      const zone = route53.HostedZone.fromLookup(this, "Zone", {
        domainName: 'nichole.is',
      });

      new route53.ARecord(this, "SiteAliasRecord", {
        recordName: 'cdk.nichole.is',
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution)
        ),
        zone,
      })


  }
}