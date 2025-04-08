from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.contrib.auth.models import User

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        send_mail(
            'Welcome to Our Platform',
            'Thanks for signing up! This is a test email from Django.',
            'your_verified_email@example.com',
            [instance.email],
            fail_silently=False,
        )
