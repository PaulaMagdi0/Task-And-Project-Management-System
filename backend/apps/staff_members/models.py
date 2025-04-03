from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator  # Add this import

class StaffMember(AbstractUser):
    # Ensure email is explicitly defined and unique
    email = models.EmailField(unique=True, verbose_name=_('email'))

    class Role(models.TextChoices):
        BRANCH_MANAGER = 'branch_manager', _('Branch Manager')
        SUPERVISOR = 'supervisor', _('Supervisor')
        INSTRUCTOR = 'instructor', _('Instructor')
        ADMIN = 'admin', _('System Administrator')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.INSTRUCTOR,
        verbose_name=_('staff role')
    )
    
    branch = models.ForeignKey(
        'branch_location.Branch',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='staff_members',
        verbose_name=_('assigned branch')
    )

    # Add related_name to avoid conflict
    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        help_text=_('The groups this user belongs to.'),
        related_name="staffmember_groups",  # Added unique related_name
        related_query_name="staffmember"
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="staffmember_permissions",  # Added unique related_name
        related_query_name="staffmember"
    )
    
    # Other fields and methods as before

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

    # Additional fields
    is_verified = models.BooleanField(
        default=False,
        verbose_name=_('verification status')
    )
    date_joined = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('date joined')
    )

    class Meta:
        db_table = 'staff_member'
        verbose_name = _('staff member')
        verbose_name_plural = _('staff members')
        ordering = ['last_name', 'first_name']
        permissions = [
            ('can_manage_branches', 'Can manage branch locations'),
        ]

    def clean(self):
        """Validate model before saving"""
        super().clean()
        
        # Role validation
        if self.role not in self.Role.values:
            raise ValidationError(
                {'role': _('Invalid role selected.')}
            )
        
        # Branch validation
        if self.role in [self.Role.BRANCH_MANAGER, self.Role.SUPERVISOR] and not self.branch:
            raise ValidationError(
                {'branch': _('Branch managers and supervisors must be assigned to a branch.')}
            )
        
        if self.role == self.Role.BRANCH_MANAGER:
            # Check if this user is already managing another branch
            if hasattr(self, 'managed_branch') and self.managed_branch != self.branch:
                raise ValidationError(
                    {'branch': _('A manager can only manage one branch.')}
                )
        
        if self.role not in [self.Role.BRANCH_MANAGER, self.Role.SUPERVISOR] and self.branch:
            raise ValidationError(
                {'branch': _('Only branch managers and supervisors should be assigned to specific branches.')}
            )

    def save(self, *args, **kwargs):
        """Override save to include clean validation"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        branch_info = f" at {self.branch.name}" if self.branch else ""
        return f"{self.get_full_name()} ({self.get_role_display()}{branch_info})"

    @property
    def is_branch_manager(self):
        return self.role == self.Role.BRANCH_MANAGER

    @property
    def is_supervisor(self):
        return self.role == self.Role.SUPERVISOR

    @property
    def is_instructor(self):
        return self.role == self.Role.INSTRUCTOR

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    def get_full_name(self):
        """Return full name with fallback to username"""
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name if full_name else self.username

    def get_branch_location(self):
        """Helper method to get branch location details"""
        if self.branch:
            return {
                'id': self.branch.id,
                'name': self.branch.name,
                'address': self.branch.address,
                'phone': self.branch.phone,
                'is_active': self.branch.is_active
            }
        return None
