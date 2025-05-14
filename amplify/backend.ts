import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

import { predictHandler } from './functions/predict/resource';

const backend = defineBackend({
  auth,
  data,
  predictHandler,
});

const predictLambda = backend.predictHandler.resources.lambda as unknown as lambda.Function;
predictLambda.addEnvironment('SAGEMAKER_ENDPOINT_NAME', 'pytorch-inference-2025-05-14-14-15-33-621');
