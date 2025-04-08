# apps/contact/views.py
from django.core.mail import send_mail
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def contact_form(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            name = data.get('name')
            email = data.get('email')
            subject = data.get('subject')
            message = data.get('message')

            # Send the email
            send_mail(
                subject,
                message,
                email,
                [settings.EMAIL_HOST_USER],
                fail_silently=False,
            )

            return JsonResponse({'message': 'Your message has been sent. Thank you!'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)
