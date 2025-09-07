import json
import boto3
import os
from datetime import datetime
from boto3.dynamodb.conditions import Key

# Create DynamoDB and S3 clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Get table names from environment variables
HISTORY_TABLE_NAME = os.environ.get('HISTORY_TABLE_NAME')
FEEDBACK_TABLE_NAME = os.environ.get('FEEDBACK_TABLE_NAME')
IMAGES_BUCKET_NAME = os.environ.get('IMAGES_BUCKET_NAME')

def handler(event, context):
    try:
        # Extract operation from request
        operation = event.get('arguments', {}).get('operation', 'list')
        user_id = event.get('requestContext', {}).get('identity', {}).get('cognitoIdentityId', 'anonymous')
        
        if operation == 'list':
            return list_diagnosis_history(user_id)
        elif operation == 'get':
            diagnosis_id = event.get('arguments', {}).get('diagnosisId')
            return get_diagnosis_details(diagnosis_id)
        else:
            return json.dumps({
                "statusCode": 400,
                "body": json.dumps({"error": "Invalid operation"})
            })
            
    except Exception as e:
        print(f"Error in history handler: {str(e)}")
        return json.dumps({
            "statusCode": 500,
            "body": json.dumps({"error": f"Failed to process request: {str(e)}"})
        })

def list_diagnosis_history(user_id):
    """List all diagnosis history for a user"""
    try:
        history_table = dynamodb.Table(HISTORY_TABLE_NAME)
        
        # Query history by user ID (using GSI)
        response = history_table.query(
            IndexName='UserIndex',
            KeyConditionExpression=Key('userId').eq(user_id),
            ScanIndexForward=False,  # Sort by timestamp descending (newest first)
            Limit=50  # Limit to last 50 diagnoses
        )
        
        history_items = []
        
        for item in response['Items']:
            # Get feedback if exists
            feedback = get_feedback_for_diagnosis(item['id'])
            
            # Generate presigned URL for image
            image_url = None
            if item.get('imagePath'):
                try:
                    image_url = s3.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': IMAGES_BUCKET_NAME, 'Key': item['imagePath']},
                        ExpiresIn=3600  # 1 hour
                    )
                except Exception as e:
                    print(f"Error generating presigned URL: {str(e)}")
            
            history_items.append({
                'id': item['id'],
                'imageName': item.get('imageName', 'Unknown'),
                'timestamp': item['timestamp'],
                'predictions': item.get('predictions', '[]'),
                'imagePath': item.get('imagePath', ''),
                'imageUrl': image_url,
                'feedback': feedback,
                'topPrediction': get_top_prediction(item.get('predictions', '[]'))
            })
        
        return json.dumps({
            "statusCode": 200,
            "body": json.dumps({
                "history": history_items,
                "total": len(history_items)
            })
        })
        
    except Exception as e:
        print(f"Error listing history: {str(e)}")
        raise e

def get_diagnosis_details(diagnosis_id):
    """Get detailed information for a specific diagnosis"""
    try:
        history_table = dynamodb.Table(HISTORY_TABLE_NAME)
        
        # Get diagnosis record
        response = history_table.query(
            KeyConditionExpression=Key('id').eq(diagnosis_id)
        )
        
        if not response['Items']:
            return json.dumps({
                "statusCode": 404,
                "body": json.dumps({"error": "Diagnosis not found"})
            })
        
        diagnosis = response['Items'][0]
        
        # Get feedback
        feedback = get_feedback_for_diagnosis(diagnosis_id)
        
        # Generate presigned URL for image
        image_url = None
        if diagnosis.get('imagePath'):
            try:
                image_url = s3.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': IMAGES_BUCKET_NAME, 'Key': diagnosis['imagePath']},
                    ExpiresIn=3600  # 1 hour
                )
            except Exception as e:
                print(f"Error generating presigned URL: {str(e)}")
        
        return json.dumps({
            "statusCode": 200,
            "body": json.dumps({
                "diagnosis": {
                    'id': diagnosis['id'],
                    'imageName': diagnosis.get('imageName', 'Unknown'),
                    'timestamp': diagnosis['timestamp'],
                    'predictions': diagnosis.get('predictions', '[]'),
                    'imagePath': diagnosis.get('imagePath', ''),
                    'imageUrl': image_url,
                    'feedback': feedback
                }
            })
        })
        
    except Exception as e:
        print(f"Error getting diagnosis details: {str(e)}")
        raise e

def get_feedback_for_diagnosis(diagnosis_id):
    """Get feedback for a specific diagnosis"""
    try:
        feedback_table = dynamodb.Table(FEEDBACK_TABLE_NAME)
        
        response = feedback_table.get_item(
            Key={'diagnosisId': diagnosis_id}
        )
        
        if 'Item' in response:
            return {
                'rating': response['Item'].get('rating'),
                'selectedClass': response['Item'].get('selectedClass'),
                'submittedAt': response['Item'].get('createdAt')
            }
        
        return None
        
    except Exception as e:
        print(f"Error getting feedback: {str(e)}")
        return None

def get_top_prediction(predictions_json):
    """Extract the top prediction from predictions JSON"""
    try:
        predictions = json.loads(predictions_json) if isinstance(predictions_json, str) else predictions_json
        if predictions and len(predictions) > 0:
            return {
                'label': predictions[0].get('label', 'Unknown'),
                'confidence': predictions[0].get('confidence', '0')
            }
        return None
    except Exception as e:
        print(f"Error parsing predictions: {str(e)}")
        return None