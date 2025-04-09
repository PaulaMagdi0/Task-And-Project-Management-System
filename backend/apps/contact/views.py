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
            
            # Validate required fields
            required_fields = ['name', 'email', 'subject', 'message']
            if not all(data.get(field) for field in required_fields):
                return JsonResponse({'error': 'All fields are required'}, status=400)

            # Construct email message
            email_body = f"""
            From: {data['name']} <{data['email']}>
            Subject: {data['subject']}
            
            Message:
            {data['message']}
            """

            send_mail(
                subject=data['subject'],
                message=email_body,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[settings.EMAIL_HOST_USER],
                fail_silently=False,
            )

            return JsonResponse({'message': 'Your message has been sent. Thank you!'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)