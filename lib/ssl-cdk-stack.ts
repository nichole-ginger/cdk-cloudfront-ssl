import * as cdk from '@aws-cdk/core';
import { ValidationMethod } from "@aws-cdk/aws-certificatemanager";
import * as cm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as custom from './myconstants';
import * as route53 from '@aws-cdk/aws-route53';


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


    //CloudFront Distribution 
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        viewerCertificate: {
          // In constants file: cloudfrontAliases = []
          aliases: custom.cloudfrontAliases,
          props: {
            acmCertificateArn: certificateArn,
            // Accepting HTTPS connections from only viewers that support SNI (recommended)
            sslSupportMethod: "sni-only",
          },
        },
        // Optional comment
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
        domainName: custom.ownDomainName,
      });

      // Creating CNAME record, routing traffic to CloudFront Distribution
      new route53.CnameRecord(this, "SiteAliasRecord", {
        zone: zone,
        // domainName should be the CloudFront Distro name - routes traffic to it
        domainName: distribution.distributionDomainName,
        recordName: custom.recordName
      })
  }
}