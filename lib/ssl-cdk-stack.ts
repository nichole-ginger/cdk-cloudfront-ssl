import * as cdk from '@aws-cdk/core';
import { ValidationMethod } from "@aws-cdk/aws-certificatemanager";
import * as cm from '@aws-cdk/aws-certificatemanager';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as custom from './myconstants';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';


export class SslCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, "CertificateStack", {
      env: { 
            // region is required to be us-east-1 for CloudFront
            region: "us-east-1",
            // Add your account ID in a constants file
            account: custom.account, },
    });

    // Create certificate with SAN name of *.example.com, you must own the domain - validation is done through DNS on AWS
    const certificate = new cm.Certificate(this, "CustomDomainCertificate", {
      domainName: custom.ownDomainName,
      subjectAlternativeNames: [custom.sanName],
      validationMethod: ValidationMethod.DNS,
    });

    // Save certificate arn in a variable to tie in with the CloudFront Distribution
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
        comment: custom.cloudfrontComment,
        originConfigs: [
          {
            customOriginSource: {
              // domainName should the destination you want to forward to
              domainName: custom.cloudfrontOriginName,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      });

      // Route53 alias record for the CloudFront distribution
      const zone = route53.HostedZone.fromLookup(this, "Zone", {
        domainName: 'nichole.is',
      });

      // Creating CNAME record, routing traffic to CloudFront Distribution
      new route53.CnameRecord(this, "SiteAliasRecord", {
        zone: zone,
        domainName: distribution.distributionDomainName,
        recordName: custom.recordName
      })


  }
}