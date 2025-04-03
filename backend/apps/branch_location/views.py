from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .models import BranchLocation
from .serializers import BranchLocationSerializer
from staff_members.permissions import IsAdminOrBranchManager
from staff_members.serializers import StaffMemberListSerializer
from django.db.models import Count

class BranchLocationViewSet(viewsets.ModelViewSet):
    serializer_class = BranchLocationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrBranchManager]
    filterset_fields = ['is_active', 'country', 'city']
    search_fields = ['name', 'code', 'manager__email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Filter branches based on user role"""
        queryset = BranchLocation.objects.annotate(
            staff_count=Count('staff_members')
        )

        user = self.request.user
        if user.is_admin:
            return queryset
        elif user.is_branch_manager:
            # Branch managers can only access their managed branch
            return queryset.filter(manager=user)
        return queryset.none()

    def perform_create(self, serializer):
        """Set manager if creating as branch manager"""
        if self.request.user.is_branch_manager:
            serializer.save(manager=self.request.user)
        else:
            serializer.save()

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
        queryset = self.filter_queryset(
            self.get_queryset().filter(is_active=True))
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
