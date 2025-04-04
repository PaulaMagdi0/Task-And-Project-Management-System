from django.db import models
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

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
    address = models.TextField(verbose_name=_('full address'))
    city = models.CharField(max_length=100, verbose_name=_('city'))
    state = models.CharField(max_length=100, verbose_name=_('state/province'))

    manager = models.OneToOneField(
        'staff_members.StaffMember',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_branch',
        verbose_name=_('branch manager'),
        limit_choices_to={'role': 'branch_manager'}
    )
    supervisors = models.ManyToManyField(
        'staff_members.StaffMember',
        related_name='supervised_branches',
        verbose_name=_('supervisors'),
        blank=True,
        limit_choices_to={'role': 'supervisor'}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('branch')
        verbose_name_plural = _('branches')
        ordering = ['name']
        permissions = [('can_manage_branches', 'Can manage branch locations')]

    def __str__(self):
        return f"{self.name} ({self.city}, {self.state})"

    def clean(self):
        """Validate manager assignment and branch code"""
        if self.manager:
            from apps.staff_members.models import StaffMember

            # Ensure manager is a valid instance of StaffMember
            if not isinstance(self.manager, StaffMember):
                raise ValidationError(_('Invalid manager type'))

            # Ensure manager role is BRANCH_MANAGER
            if self.manager.role != StaffMember.Role.BRANCH_MANAGER:
                raise ValidationError(_('Only branch managers can be assigned as branch managers.'))

            # Ensure manager is not already managing another branch
            if (hasattr(self.manager, 'managed_branch') and 
                self.manager.managed_branch and 
                self.manager.managed_branch != self):
                raise ValidationError(_('A branch manager can only manage one branch.'))

        # Generate or validate the branch code
        if not self.code:
            self.code = self.generate_branch_code()
        elif not self.code.isalnum():
            raise ValidationError(_('Branch code must contain only alphanumeric characters.'))

    def save(self, *args, **kwargs):
        """Override save to include clean validation"""
        self.full_clean()
        super().save(*args, **kwargs)

    def generate_branch_code(self):
        """Generate a unique branch code from the name"""
        code = slugify(self.name).upper().replace('-', '')[:6]

        counter = 1
        original_code = code
        while Branch.objects.filter(code=code).exists():
            code = f"{original_code[:5]}{counter}"
            counter += 1

        return code

    def get_staff_count(self):
        """Returns total staff count (manager + supervisors + other staff)"""
        count = self.staff_members.count() if hasattr(self, 'staff_members') else 0
        if self.manager:
            count += 1
        count += self.supervisors.count()
        return count

    def get_active_staff(self):
        """Returns queryset of active staff (excluding manager and supervisors)"""
        if hasattr(self, 'staff_members'):
            return self.staff_members.filter(is_active=True)
        return Branch.objects.none()

    @property
    def full_address(self):
        """Returns formatted full address string"""
        return f"{self.address}, {self.city}, {self.state}"

    @property
    def manager_info(self):
        """Returns manager information if exists"""
        if not self.manager:
            return None
        return {
            'id': self.manager.id,
            'name': self.manager.get_full_name(),
            'email': self.manager.email,
            'phone': self.manager.phone
        }

    @property
    def supervisors_info(self):
        """Returns list of supervisors information"""
        return [{
            'id': s.id,
            'name': s.get_full_name(),
            'email': s.email,
            'phone': s.phone
        } for s in self.supervisors.all()]

    def get_staff_member_info(self):
        """Fetch and return a list of all staff info"""
        staff_info = []

        # Add manager if exists
        if self.manager:
            staff_info.append({
                'id': self.manager.id,
                'name': self.manager.get_full_name(),
                'role': 'branch_manager',
                'email': self.manager.email,
                'phone': self.manager.phone,
                'is_manager': True
            })

        # Add supervisors
        staff_info.extend({
            'id': s.id,
            'name': s.get_full_name(),
            'role': 'supervisor',
            'email': s.email,
            'phone': s.phone,
            'is_manager': False
        } for s in self.supervisors.all())

        # Add other staff members
        staff_info.extend({
            'id': s.id,
            'name': s.get_full_name(),
            'role': s.role,
            'email': s.email,
            'phone': s.phone,
            'is_manager': False
        } for s in self.get_active_staff())

        return staff_info
