from django.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils.text import slugify

class Branch(models.Model):
    """Model representing physical branch locations"""
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_('branch name'),
        help_text=_('Official name of the branch location')
    )
    code = models.CharField(
        max_length=10,
        unique=True,
        verbose_name=_('branch code'),
        help_text=_('Short unique code for the branch'),
        blank=True
    )
    address = models.TextField(
        verbose_name=_('full address'),
        help_text=_('Complete physical address of the branch')
    )
    city = models.CharField(
        max_length=100,
        verbose_name=_('city')
    )
    state = models.CharField(
        max_length=100,
        verbose_name=_('state/province')
    )
    manager = models.OneToOneField(
        'staff_members.StaffMember',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_branch',
        verbose_name=_('branch manager'),
        limit_choices_to={'role': 'branch_manager'}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('branch')
        verbose_name_plural = _('branches')
        ordering = ['name']
        permissions = [
            ('can_manage_branches', 'Can manage branch locations'),
        ]

    def __str__(self):
        return f"{self.name} ({self.city}, {self.state})"

    def clean(self):
        """Validate manager assignment and branch code"""
        if self.manager:
            # Lazy import to prevent circular imports
            from staff_members.models import StaffMember
            
            if not isinstance(self.manager, StaffMember):
                raise ValidationError(_('Invalid manager type'))
                
            if self.manager.role != StaffMember.Role.BRANCH_MANAGER:
                raise ValidationError(
                    _('Only branch managers can be assigned as branch managers.')
                )
                
            if hasattr(self.manager, 'managed_branch') and self.manager.managed_branch != self:
                raise ValidationError(
                    _('Manager must be assigned to this branch.')
                )
        
        if not self.code:
            self.code = self.generate_branch_code()
        elif not self.code.isalnum():
            raise ValidationError(
                _('Branch code must contain only alphanumeric characters.')
            )

    def save(self, *args, **kwargs):
        """Override save to include clean validation"""
        self.full_clean()  # Perform validation
        super().save(*args, **kwargs)

    def generate_branch_code(self):
        """Generate a unique branch code from the name"""
        code = slugify(self.name).upper().replace('-', '')[:6]
        
        # Ensure the branch code is unique
        counter = 1
        original_code = code
        while Branch.objects.filter(code=code).exists():
            code = f"{original_code[:5]}{counter}"
            counter += 1
            
        return code

    def get_staff_count(self):
        """Returns the number of staff members assigned to this branch"""
        return self.staff_members.count() if hasattr(self, 'staff_members') else 0

    def get_active_staff(self):
        """Returns queryset of active staff at this branch"""
        return self.staff_members.filter(is_active=True) if hasattr(self, 'staff_members') else self.staff_members.none()

    @property
    def full_address(self):
        """Returns formatted full address string"""
        return f"{self.address}, {self.city}, {self.state}"
