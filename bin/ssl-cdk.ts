#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SslCdkStack } from '../lib/ssl-cdk-stack';

const app = new cdk.App();
new SslCdkStack(app, 'SslCdkStack');
