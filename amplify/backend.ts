import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';

import { predictHandler } from './functions/predict/resource';
import { feedbackHandler } from './functions/feedback/resource';
import { historyHandler } from './functions/history/resource';

const backend = defineBackend({
  auth,
  data,
  predictHandler,
  feedbackHandler,
  historyHandler,
});

// Create S3 bucket for storing images
const imagesBucket = new s3.Bucket(backend.stack, 'ImagesBucket', {
  bucketName: 'alzheimer-diagnosis-images',
  removalPolicy: RemovalPolicy.DESTROY, // Use RETAIN for production
  cors: [
    {
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
    },
  ],
});

// Create DynamoDB table for diagnosis history
const historyTable = new dynamodb.Table(backend.stack, 'DiagnosisHistoryTable', {
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
  tableName: 'alzheimer-diagnosis-history-v4',
  removalPolicy: RemovalPolicy.DESTROY, // Use RETAIN for production
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
});

// Add Global Secondary Index for querying by user
historyTable.addGlobalSecondaryIndex({
  indexName: 'UserIndex',
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
});

// Create DynamoDB table for feedback (separate from history)
const feedbackTable = new dynamodb.Table(backend.stack, 'FeedbackTable', {
  partitionKey: { name: 'diagnosisId', type: dynamodb.AttributeType.STRING },
  tableName: 'alzheimer-feedback-v4',
  removalPolicy: RemovalPolicy.DESTROY,
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
});

// Configure predict lambda
const predictLambda = backend.predictHandler.resources.lambda as unknown as lambda.Function;
predictLambda.addEnvironment('SAGEMAKER_ENDPOINT_NAME', 'Alzheimer-ResNet18-Endpoint-20250906-232521');
predictLambda.addEnvironment('SAGEMAKER_INFERENCE_COMPONENT_NAME', 'Alzheimer-ResNet18-20250906-2325210');
predictLambda.addEnvironment('IMAGES_BUCKET_NAME', imagesBucket.bucketName);
predictLambda.addEnvironment('HISTORY_TABLE_NAME', historyTable.tableName);

// Configure feedback lambda
const feedbackLambda = backend.feedbackHandler.resources.lambda as unknown as lambda.Function;
feedbackLambda.addEnvironment('FEEDBACK_TABLE_NAME', feedbackTable.tableName);

// Configure history lambda
const historyLambda = backend.historyHandler.resources.lambda as unknown as lambda.Function;
historyLambda.addEnvironment('HISTORY_TABLE_NAME', historyTable.tableName);
historyLambda.addEnvironment('FEEDBACK_TABLE_NAME', feedbackTable.tableName);
historyLambda.addEnvironment('IMAGES_BUCKET_NAME', imagesBucket.bucketName);

// Grant permissions
imagesBucket.grantReadWrite(predictLambda);
imagesBucket.grantRead(historyLambda);
historyTable.grantFullAccess(predictLambda);
historyTable.grantReadData(historyLambda);
feedbackTable.grantFullAccess(feedbackLambda);
feedbackTable.grantReadData(historyLambda);