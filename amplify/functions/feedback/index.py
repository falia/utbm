import json
import boto3
import os
from datetime import datetime
import uuid

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('FEEDBACK_TABLE_NAME')

def handler(event, context):
    try:

        arguments = event.get('arguments', {})
        
        rating = arguments.get('rating')
        selected_class = arguments.get('selectedClass')
        predictions = arguments.get('predictions')
        timestamp = arguments.get('timestamp')
        
        if not all([rating, selected_class, predictions, timestamp]):
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing required fields"})
            }
        
        table = dynamodb.Table(TABLE_NAME)
        
        feedback_item = {
            'id': str(uuid.uuid4()),
            'rating': rating,
            'selectedClass': selected_class,
            'predictions': predictions,
            'timestamp': timestamp,
            'createdAt': datetime.utcnow().isoformat()
        }
        
        table.put_item(Item=feedback_item)
        
        return json.dumps({
            "statusCode": 200,
            "body": json.dumps({
                "message": "Feedback saved successfully",
                "id": feedback_item['id']
            })
        })
        
    except Exception as e:
        print(f"Error saving feedback: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Failed to save feedback: {str(e)}"})
        }