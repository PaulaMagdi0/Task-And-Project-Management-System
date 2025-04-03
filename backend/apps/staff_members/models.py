from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator

class StaffMember(AbstractUser):
    # Email configuration
    email = models.EmailField(
        unique=True,
        verbose_name=_('email address'),
        help_text=_('Required. Must be a valid email address.')
    )

    # Role choices with proper case handling
    class Role(models.TextChoices):
        BRANCH_MANAGER = 'branch_manager', _('Branch Manager')
        SUPERVISOR = 'supervisor', _('Supervisor')
        INSTRUCTOR = 'instructor', _('Instructor')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.INSTRUCTOR,
        verbose_name=_('staff role')
    )

    # Branch location field
    branch_location = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_('branch location'),
        help_text=_('The physical branch location this staff member is associated with')
    )

    # Phone number validation
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message=_("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    )
    phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        null=True,
        verbose_name=_('phone number')
    )

    # Permission settings
    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        help_text=_('The groups this user belongs to.'),
        related_name="staffmember_groups",
        related_query_name="staffmember"
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="staffmember_permissions",
        related_query_name="staffmember"
    )

    # Authentication configuration
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'staff_member'
        verbose_name = _('staff member')
        verbose_name_plural = _('staff members')
        ordering = ['last_name', 'first_name']

    def clean(self):
        """Validate model before saving"""
        super().clean()
        if self.role not in self.Role.values:
            raise ValidationError(
                {'role': _('Invalid role selected.')}
            )
        
        # Branch managers must have a branch location
        if self.role == self.Role.BRANCH_MANAGER and not self.branch_location:
            raise ValidationError(
                {'branch_location': _('Branch managers must have an associated branch location.')}
            )
        
        # Normalize email
        self.email = self.__class__.objects.normalize_email(self.email)

    def save(self, *args, **kwargs):
        """Override save to include clean validation"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        location = f" at {self.branch_location}" if self.branch_location else ""
        return f"{self.get_full_name()} ({self.get_role_display()}{location})"

    @property
    def is_branch_manager(self):
        return self.role == self.Role.BRANCH_MANAGER

    @property
    def is_supervisor(self):
        return self.role == self.Role.SUPERVISOR

    @property
    def is_instructor(self):
        return self.role == self.Role.INSTRUCTOR

    def get_full_name(self):
        """Return full name with fallback to username"""
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name if full_name else self.username