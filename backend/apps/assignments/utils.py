import logging
import os
import tempfile
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
from django.conf import settings

logger = logging.getLogger(__name__)

# Initialize Google Drive API client globally
def initialize_google_drive_service():
    creds = service_account.Credentials.from_service_account_file(
        settings.GOOGLE_SERVICE_ACCOUNT_FILE,
        scopes=['https://www.googleapis.com/auth/drive']
    )
    service = build('drive', 'v3', credentials=creds)
    return service

def upload_file_to_google_drive(file):
    """
    Uploads a file to Google Drive and returns the file URL.
    If the file is large, it uses MediaIoBaseUpload for better performance.
    """
    try:
        service = initialize_google_drive_service()

        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        # Create file metadata
        file_metadata = {
            'name': file.name,
            'parents': [settings.GOOGLE_DRIVE_FOLDER_ID]
        }

        # Upload the file
        media = MediaFileUpload(temp_file_path, mimetype=file.content_type)

        # Use the Google Drive API to upload
        uploaded_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='webViewLink'
        ).execute()

        # Clean up the temporary file
        os.unlink(temp_file_path)

        return uploaded_file.get('webViewLink')

    except Exception as e:
        logger.error(f"Error uploading to Google Drive: {str(e)}")
        raise  # Re-raise the exception after logging it

def delete_file_from_google_drive(file_url):
    """
    Deletes a file from Google Drive using its URL.
    """
    try:
        service = initialize_google_drive_service()

        # Extract file ID from URL
        file_id = file_url.split('/')[-2]
        
        # Delete the file
        service.files().delete(fileId=file_id).execute()
        
    except Exception as e:
        logger.error(f"Error deleting from Google Drive: {str(e)}")
        raise  # Re-raise the exception after logging it
