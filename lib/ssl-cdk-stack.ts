import * as cdk from '@aws-cdk/core';
// import * as s3 from '@aws-cdk/aws-s3';
import { ValidationMethod } from "@aws-cdk/aws-certificatemanager";
import * as cm from '@aws-cdk/aws-certificatemanager';

// export class SslCdkStack extends cdk.Stack {
//   constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     new s3.Bucket(this, 'MyFirstBucket', {
//       versioned: true,
//       removalPolicy: cdk.RemovalPolicy.DESTROY
//     });
//   }
// }


const domainName = "*.nichole.is";

export class SslCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct) {
    super(scope, "CertificateStack", {
      env: { region: "us-east-2" },
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