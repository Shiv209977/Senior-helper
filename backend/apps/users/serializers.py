from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from rest_framework import serializers

from apps.audit.services import log_action

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "role", "is_active", "fast_mode", "created_at"]
        read_only_fields = ["id", "is_active", "created_at"]


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "role", "is_active", "created_at"]
        read_only_fields = ["id", "email", "role", "created_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "role", "password"]
        read_only_fields = ["id"]

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Admin users must be created by an existing admin.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)

        if user.role == User.Role.PATIENT:
            from apps.profiles.models import PatientProfile

            PatientProfile.objects.create(user=user)
        elif user.role == User.Role.CAREGIVER:
            from apps.profiles.models import CaregiverProfile

            CaregiverProfile.objects.create(user=user)

        log_action(user=user, action="user_registered", metadata={"role": user.role})
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")
        attrs["user"] = user
        return attrs
