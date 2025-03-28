from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests
import os
import json
import logging

# Set up logging
logger = logging.getLogger(__name__)

@csrf_exempt
def chat(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        message = data.get('message')

        try:
            # Log the request payload
            logger.info(f"Sending request to Hugging Face API: {message}")

            # Call the Hugging Face API
            response = requests.post(
                "https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-2.7B",  # Hugging Face endpoint
                headers={
                    "Authorization": f"Bearer {os.getenv('HUGGING_FACE_API_KEY')}",
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": message,
                },
            )

            # Log the API response
            logger.info(f"Hugging Face API response: {response.status_code}, {response.text}")

            # Check for errors in the response
            if response.status_code != 200:
                logger.error(f"Hugging Face API error: {response.status_code}, {response.text}")
                return JsonResponse({"error": response.json()}, status=500)

            # Extract the reply from the response
            reply = response.json()[0]["generated_text"]
            return JsonResponse({"reply": reply})
        except Exception as e:
            logger.error(f"Exception in chat view: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)