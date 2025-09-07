import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';

import { predictHandler } from './functions/predict/resource';
import { feedbackHandler } from './functions/feedback/resource';

const backend = defineBackend({
  auth,
  data,
  predictHandler,
  feedbackHandler,
});

const feedbackTable = new dynamodb.Table(backend.stack, 'FeedbackTable', {
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  tableName: 'alzheimer-feedback',
  removalPolicy: RemovalPolicy.DESTROY,
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
});


feedbackTable.addGlobalSecondaryIndex({
  indexName: 'TimestampIndex',
  partitionKey: { name: 'rating', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
});


const predictLambda = backend.predictHandler.resources.lambda as unknown as lambda.Function;
predictLambda.addEnvironment('SAGEMAKER_ENDPOINT_NAME', 'Alzheimer-ResNet18-Endpoint-20250906-232521');
predictLambda.addEnvironment('SAGEMAKER_INFERENCE_COMPONENT_NAME', 'Alzheimer-ResNet18-20250906-2325210');

const feedbackLambda = backend.feedbackHandler.resources.lambda as unknown as lambda.Function;
feedbackLambda.addEnvironment('FEEDBACK_TABLE_NAME', feedbackTable.tableName);

feedbackTable.grantFullAccess(feedbackLambda);