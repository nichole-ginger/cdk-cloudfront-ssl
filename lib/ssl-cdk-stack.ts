import * as cdk from '@aws-cdk/core';
import { ValidationMethod } from "@aws-cdk/aws-certificatemanager";
import * as cm from '@aws-cdk/aws-certificatemanager';
import * as ssm from '@aws-cdk/aws-ssm';


const domainName = "nichole.is";

export class SslCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct) {
    super(scope, "CertificateStack", {
      env: { region: "us-east-1" },
    });

    const certificate = new cm.Certificate(this, "CustomDomainCertificate", {
      domainName: domainName,
      validationMethod: ValidationMethod.DNS,
    });

    const certificateArn = certificate.certificateArn;
    new cdk.CfnOutput(this, "CertificateArn", {
      value: certificateArn,
    });
  }
}