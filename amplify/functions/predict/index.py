import os
import json
import base64
import boto3
import uuid
from datetime import datetime

# Create clients
sagemaker_client = boto3.client("sagemaker-runtime")
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
ENDPOINT_NAME = os.environ["SAGEMAKER_ENDPOINT_NAME"]  # required
IC_NAME = os.environ.get("SAGEMAKER_INFERENCE_COMPONENT_NAME")  # required for IC endpoints
IMAGES_BUCKET_NAME = os.environ.get('IMAGES_BUCKET_NAME')
HISTORY_TABLE_NAME = os.environ.get('HISTORY_TABLE_NAME')

def handler(event, context):
    try:
        # Extract data from request
        arguments = event.get("arguments", {})
        image_base64 = arguments.get("image")
        image_name = arguments.get('imageName', f'image_{int(datetime.now().timestamp())}.jpg')
        
        # Get user ID from context (Cognito)
        user_id = event.get('requestContext', {}).get('identity', {}).get('cognitoIdentityId', 'anonymous')
        
        if not image_base64:
            return json.dumps({
                "statusCode": 400, 
                "body": json.dumps({"error": "Image not provided"})
            })

        # Strip data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[-1]

        image_bytes = base64.b64decode(image_base64)

        # Ensure IC name is configured for IC endpoints
        if not IC_NAME:
            return json.dumps({
                "statusCode": 500,
                "body": json.dumps({"error": "SAGEMAKER_INFERENCE_COMPONENT_NAME is not set"})
            })

        # Generate unique diagnosis ID and timestamp
        diagnosis_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Upload image to S3 (if bucket is configured)
        image_key = None
        if IMAGES_BUCKET_NAME:
            try:
                image_key = f"diagnoses/{user_id}/{diagnosis_id}/{image_name}"
                s3_client.put_object(
                    Bucket=IMAGES_BUCKET_NAME,
                    Key=image_key,
                    Body=image_bytes,
                    ContentType='image/jpeg',
                    Metadata={
                        'diagnosisId': diagnosis_id,
                        'userId': user_id,
                        'uploadTime': timestamp
                    }
                )
                print(f"Image uploaded to S3: {image_key}")
            except Exception as e:
                print(f"Warning: Failed to upload to S3: {str(e)}")
                # Continue with prediction even if S3 upload fails

        # Invoke SageMaker (IC)
        response = sagemaker_client.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            InferenceComponentName=IC_NAME,   # <-- key addition
            ContentType="application/x-image",
            Body=image_bytes,
        )

        prediction_result = response["Body"].read().decode("utf-8")

        # Save to history table (if table is configured)
        if HISTORY_TABLE_NAME:
            try:
                history_table = dynamodb.Table(HISTORY_TABLE_NAME)
                history_table.put_item(
                    Item={
                        'id': diagnosis_id,
                        'timestamp': timestamp,
                        'userId': user_id,
                        'imageName': image_name,
                        'imagePath': image_key or '',
                        'predictions': prediction_result,
                        'createdAt': timestamp,
                        'endpointName': ENDPOINT_NAME,
                        'inferenceComponent': IC_NAME
                    }
                )
                print(f"Diagnosis saved to history: {diagnosis_id}")
            except Exception as e:
                print(f"Warning: Failed to save to DynamoDB: {str(e)}")
                # Continue with response even if DynamoDB save fails

        # Return prediction with additional metadata
        return json.dumps({
            "statusCode": 200,
            "body": json.dumps({
                "predictions": prediction_result,
                "diagnosisId": diagnosis_id,
                "imageName": image_name,
                "timestamp": timestamp,
                "imageStored": image_key is not None
            })
        })

    except Exception as e:
        print(f"Error in predict handler: {str(e)}")
        return json.dumps({
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        })