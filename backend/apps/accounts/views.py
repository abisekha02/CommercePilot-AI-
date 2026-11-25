from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, UserRole
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    StaffUserManagementSerializer,
)
from .permissions import IsAdminUserRole, IsStaffRole


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class StaffManagementListView(generics.ListCreateAPIView):
    """Admin-only endpoint to list all staff or create staff members."""
    queryset = User.objects.exclude(role=UserRole.CUSTOMER).order_by('-date_joined')
    serializer_class = StaffUserManagementSerializer
    permission_classes = [IsAdminUserRole]

    def perform_create(self, serializer):
        user = serializer.save()
        # Default staff initial password if not provided
        if not user.password:
            user.set_password("StaffPass123!")
            user.save()


class StaffManagementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = StaffUserManagementSerializer
    permission_classes = [IsAdminUserRole]
