import json
import os
import boto3
import cfnresponse

def handler(event, context):
    print('Event:', json.dumps(event))
    
    if event['RequestType'] == 'Delete':
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
        return
    
    try:
        cognito_client = boto3.client('cognito-idp')
        user_pool_id = os.environ['USER_POOL_ID']
        
        # Get admin user details from environment variables
        admin_email = os.environ.get('ADMIN_EMAIL')
        admin_first_name = os.environ.get('ADMIN_FIRST_NAME', 'Admin')
        admin_last_name = os.environ.get('ADMIN_LAST_NAME', 'User')
        admin_password = os.environ.get('ADMIN_PASSWORD')
        
        if not admin_email or not admin_password:
            print('ADMIN_EMAIL or ADMIN_PASSWORD not provided, skipping admin user creation')
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Message': 'Admin user creation skipped - no credentials provided'
            })
            return
        
        print(f'Creating admin user: {admin_email}')
        
        # Check if user already exists
        try:
            cognito_client.admin_get_user(
                UserPoolId=user_pool_id,
                Username=admin_email
            )
            print(f'User {admin_email} already exists, skipping creation')
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Message': f'Admin user {admin_email} already exists'
            })
            return
        except cognito_client.exceptions.UserNotFoundException:
            # User doesn't exist, proceed with creation
            pass
        
        # Create the admin user
        response = cognito_client.admin_create_user(
            UserPoolId=user_pool_id,
            Username=admin_email,
            UserAttributes=[
                {'Name': 'email', 'Value': admin_email},
                {'Name': 'email_verified', 'Value': 'true'},
                {'Name': 'given_name', 'Value': admin_first_name},
                {'Name': 'family_name', 'Value': admin_last_name},
                {'Name': 'custom:organization', 'Value': 'Default'},
            ],
            TemporaryPassword=admin_password,
            MessageAction='SUPPRESS'  # Don't send welcome email
        )
        
        print(f'✓ Created user: {admin_email}')
        
        # Set permanent password
        cognito_client.admin_set_user_password(
            UserPoolId=user_pool_id,
            Username=admin_email,
            Password=admin_password,
            Permanent=True
        )
        
        print(f'✓ Set permanent password for: {admin_email}')
        
        # Add user to admin group
        cognito_client.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=admin_email,
            GroupName='admin'
        )
        
        print(f'✓ Added {admin_email} to admin group')
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {
            'Message': f'Admin user {admin_email} created successfully',
            'Username': admin_email
        })
        
    except Exception as e:
        print(f'Error creating admin user: {str(e)}')
        cfnresponse.send(event, context, cfnresponse.FAILED, {
            'Message': str(e)
        })
