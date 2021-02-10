import * as cdk from '@aws-cdk/core';
import { ValidationMethod } from "@aws-cdk/aws-certificatemanager";
import * as cm from '@aws-cdk/aws-certificatemanager';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import { bucketRef, account, cloudfrontComment } from './myconstants';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import console = require('console');


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

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        viewerCertificate: {
          aliases: ['ablink.nichole.is', 'ablinks.nichole.is'],
          props: {
            acmCertificateArn: certificateArn,
            sslSupportMethod: "sni-only",
          },
        },
        comment: cloudfrontComment,
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

      // new route53.ARecord(this, "SiteAliasRecord", {
      //   recordName: 'ablink.nichole.is',
      //   target: route53.RecordTarget.fromAlias(
      //     new targets.CloudFrontTarget(distribution)
      //   ),
      //   zone,
      // })

      new route53.CnameRecord(this, "SiteAliasRecord", {
        zone: zone,
        domainName: distribution.distributionDomainName,
        recordName: 'ablink.nichole.is',
        comment: 'this is a test comment'
      })


  }
}