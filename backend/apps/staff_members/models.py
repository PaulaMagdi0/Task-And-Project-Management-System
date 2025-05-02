from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from apps.branch_location.models import Branch

class StaffMember(AbstractUser):
    email = models.EmailField(unique=True, verbose_name=_('email'))
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # required when creating superuser via command line
    class Role(models.TextChoices):
        BRANCH_MANAGER = 'branch_manager', _('Branch Manager')
        SUPERVISOR = 'supervisor', _('Supervisor')
        INSTRUCTOR = 'instructor', _('Instructor')
        ADMIN = 'admin', _('System Administrator')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ADMIN,
        verbose_name=_('staff role')
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='staff_members',
        verbose_name=_('assigned branch')
    )

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

    is_verified = models.BooleanField(default=False, verbose_name=_('verification status'))
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name=_('date joined'))

    class Meta:
        db_table = 'staff_member'
        verbose_name = _('staff member')
        verbose_name_plural = _('staff members')
        ordering = ['last_name', 'first_name']
        permissions = [('can_manage_branches', 'Can manage branch locations')]

    def clean(self):
        super().clean()
        if self.role not in self.Role.values:
            raise ValidationError({'role': _('Invalid role selected.')})
        if self.role in [self.Role.BRANCH_MANAGER, self.Role.SUPERVISOR] and not self.branch:
            raise ValidationError({'branch': _('Branch managers and supervisors must be assigned to a branch.')})
        if self.role == self.Role.BRANCH_MANAGER and self.branch:
            if self.branch.manager and self.branch.manager != self:
                raise ValidationError({'branch': _('This branch already has a manager assigned.')})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        if self.role == self.Role.BRANCH_MANAGER and self.branch:
            if self.branch.manager_id != self.pk:
                self.branch.manager = self
                self.branch.save()
        else:
            branches = Branch.objects.filter(manager=self)
            for branch in branches:
                branch.manager = None
                branch.save()
        return self

    def __str__(self):
        branch_info = f" at {self.branch.name}" if self.branch else ""
        return f"{self.get_full_name()} ({self.get_role_display()}{branch_info})"

    def get_full_name(self):
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name if full_name else self.username

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

    @property
    def managed_branch(self):
        """Returns the branch this user manages, if any"""
        if self.is_branch_manager and hasattr(self, 'branch'):
            return self.branch
        return None

    def get_branch_location(self):
        """Helper method to get branch location details"""
        if self.branch:
            return {
                'id': self.branch.id,
                'name': self.branch.name,
                'address': self.branch.address,
            }
        return None
