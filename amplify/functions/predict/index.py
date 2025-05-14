import json
import boto3
import os
import base64
import json

# Create SageMaker runtime client
sagemaker_client = boto3.client('sagemaker-runtime')

# Get the endpoint name from environment variables
ENDPOINT_NAME = os.environ.get('SAGEMAKER_ENDPOINT_NAME')

def handler(event, context):
    try:
        # Extract base64 image from request body
        image_base64 = event.get('arguments', {}).get('image')
        if not image_base64:
            return {"statusCode": 400, "body": json.dumps({"error": "Image not provided"})}

        if ',' in image_base64:
            image_base64 = image_base64.split(',')[-1]

        # Decode the base64 image to bytes
        image_bytes = base64.b64decode(image_base64)

        # Call the SageMaker endpoint
        response = sagemaker_client.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            ContentType='application/x-image',  # This triggers your input_fn in SageMaker
            Body=image_bytes
        )

        # Read the response body
        prediction_result = response['Body'].read().decode('utf-8')

        # Return prediction
        return json.dumps({
            "statusCode": 200,
            "body": prediction_result
        })

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }