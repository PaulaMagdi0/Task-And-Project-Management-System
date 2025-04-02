import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

# The SCOPES variable determines the level of access your app will have to Google Drive.
SCOPES = ['https://www.googleapis.com/auth/drive.file']

# Authenticate and create a service object for Google Drive API
def authenticate_google_drive():
    creds = None
    # The file token.pickle stores the user's access and refresh tokens, and is created automatically
    # when the authorization flow completes for the first time.
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    
    # Build the Drive API client
    service = build('drive', 'v3', credentials=creds)
    return service

def upload_file_to_google_drive(file_path):
    # Authenticate Google Drive API
    service = authenticate_google_drive()

    # File metadata (optional)
    file_metadata = {'name': os.path.basename(file_path)}
    
    # Upload file to Google Drive
    media = MediaFileUpload(file_path, mimetype='application/octet-stream')
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    
    # Return the file ID or URL (you can choose to return the URL or the file ID for later retrieval)
    return f"https://drive.google.com/file/d/{file['id']}/view?usp=sharing"
