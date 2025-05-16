import json
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Hugging Face Inference Client
HF_API_KEY = os.getenv("HF_API_KEY")
client = InferenceClient(api_key=HF_API_KEY)

@csrf_exempt
def chat_with_hf(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message')

            if not user_message:
                return JsonResponse({"error": "Message is required"}, status=400)

            # Validate parameters
            top_p = 0.9  # Must be > 0.0 and < 1.0
            temperature = 0.7  # Standard value for coherent responses
            max_tokens = 500

            if not (0.0 < top_p < 1.0):
                return JsonResponse({"error": "Invalid top_p: must be > 0.0 and < 1.0"}, status=400)
            if not (0.1 <= temperature <= 2.0):
                return JsonResponse({"error": "Invalid temperature: must be between 0.1 and 2.0"}, status=400)

            # Send request to Hugging Face Inference API
            response = client.chat_completion(
                model="mistralai/Mixtral-8x7B-Instruct-v0.1",
                messages=[{"role": "user", "content": user_message}],
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p
            )

            # Extract the response message
            response_message = response.choices[0].message.content
            return JsonResponse({"response": response_message}, status=200)

        except Exception as e:
            return JsonResponse({"error": f"API error: {str(e)}"}, status=500)

    return JsonResponse({"error": "Invalid method"}, status=405)