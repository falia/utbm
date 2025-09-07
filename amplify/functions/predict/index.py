import os
import json
import base64
import boto3

# SageMaker runtime client
sagemaker_client = boto3.client("sagemaker-runtime")

# Env vars
ENDPOINT_NAME = os.environ["SAGEMAKER_ENDPOINT_NAME"]  # required
IC_NAME = os.environ.get("SAGEMAKER_INFERENCE_COMPONENT_NAME")  # required for IC endpoints

def handler(event, context):
    try:
        # Get base64 image from AppSync/Amplify-style args
        image_base64 = event.get("arguments", {}).get("image")
        if not image_base64:
            return {"statusCode": 400, "body": json.dumps({"error": "Image not provided"})}

        # Strip data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[-1]

        image_bytes = base64.b64decode(image_base64)

        # Ensure IC name is configured for IC endpoints
        if not IC_NAME:
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "SAGEMAKER_INFERENCE_COMPONENT_NAME is not set"})
            }

        # Invoke SageMaker (IC)
        response = sagemaker_client.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            InferenceComponentName=IC_NAME,   # <-- key addition
            ContentType="application/x-image",
            Body=image_bytes,
        )

        prediction_result = response["Body"].read().decode("utf-8")

        return json.dumps({
            "statusCode": 200,
            "body": prediction_result
        })

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
