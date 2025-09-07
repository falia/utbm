import json
import boto3
import os
from datetime import datetime

# Create DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Get table name from environment variables
FEEDBACK_TABLE_NAME = os.environ.get('FEEDBACK_TABLE_NAME')

def handler(event, context):
    try:
        # Extract feedback data from request
        arguments = event.get('arguments', {})
        
        diagnosis_id = arguments.get('diagnosisId')
        rating = arguments.get('rating')
        selected_class = arguments.get('selectedClass')
        
        # Validate required fields
        if not all([diagnosis_id, rating, selected_class]):
            return json.dumps({
                "statusCode": 400,
                "body": json.dumps({"error": "Missing required fields"})
            })
        
        # Get the DynamoDB table
        table = dynamodb.Table(FEEDBACK_TABLE_NAME)
        
        # Create feedback item
        feedback_item = {
            'diagnosisId': diagnosis_id,
            'rating': rating,
            'selectedClass': selected_class,
            'createdAt': datetime.utcnow().isoformat()
        }
        
        # Save to DynamoDB (will overwrite if exists)
        table.put_item(Item=feedback_item)
        
        return json.dumps({
            "statusCode": 200,
            "body": json.dumps({
                "message": "Feedback saved successfully",
                "diagnosisId": diagnosis_id
            })
        })
        
    except Exception as e:
        print(f"Error saving feedback: {str(e)}")
        return json.dumps({
            "statusCode": 500,
            "body": json.dumps({"error": f"Failed to save feedback: {str(e)}"})
        })