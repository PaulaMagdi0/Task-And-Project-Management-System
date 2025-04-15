import openai
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

openai.api_key = "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"

@csrf_exempt
def chat_with_openai(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message')

            if not user_message:
                return JsonResponse({"error": "Message is required"}, status=400)

            # Sending the request to OpenAI API
            completion = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": user_message}],
                store=True
            )

            # Get the response message
            response_message = completion.choices[0].message['content']
            return JsonResponse({"response": response_message}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid method"}, status=405)
