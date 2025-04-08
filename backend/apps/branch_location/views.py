from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count
from .models import Branch
from .serializers import BranchSerializer
from apps.staff_members.serializers import StaffMemberListSerializer
from apps.staff_members.models import StaffMember

class BranchLocationViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = []  # Allow unauthenticated access
    filterset_fields = ['is_active', 'country', 'city']
    search_fields = ['name', 'code', 'manager__email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Filter branches based on user role if authenticated"""
        queryset = Branch.objects.annotate(staff_count=Count('staff_members'))
        user = self.request.user

        if user.is_authenticated:
            if getattr(user, 'is_admin', False):  # Safe check for admin role
                return queryset  
            elif getattr(user, 'is_branch_manager', False):  # Safe check for branch managers
                return queryset.filter(manager=user)

        return queryset.all()

    def perform_create(self, serializer):
        """Assign a manager if the provided staff member has the 'branch_manager' role"""
        instance = serializer.save()

        if instance.manager and instance.manager.role == StaffMember.Role.BRANCH_MANAGER:
            instance.manager.branch = instance
            instance.manager.save()

    @action(detail=True, methods=['get'])
    def staff(self, request, pk=None):
        """Get all staff members for a specific branch"""
        branch = self.get_object()
        staff_members = branch.staff_members.all()
        serializer = StaffMemberListSerializer(staff_members, many=True)
        return Response({
            'branch': branch.name,
            'staff_count': staff_members.count(),
            'staff_members': serializer.data
        })

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active branches"""
        queryset = self.filter_queryset(self.get_queryset().filter(is_active=True))
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion if branch has staff members"""
        instance = self.get_object()
        if instance.staff_members.exists():
            return Response(
                {'error': 'Cannot delete branch with assigned staff members.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
