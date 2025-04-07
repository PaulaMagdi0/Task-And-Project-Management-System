class StudentSerializer(serializers.ModelSerializer):
    track = serializers.StringRelatedField(read_only=True)
    track_id = serializers.PrimaryKeyRelatedField(
        queryset=Track.objects.all(),
        write_only=True,
        required=False,
        source='track'
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )

    class Meta:
        model = Student
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'track', 'track_id', 'password', 'is_active',
            'verified', 'date_joined', 'verification_code'
        ]
        read_only_fields = [
            'id', 'username', 'is_active', 'verified', 'date_joined', 
            'verification_code'
        ]
        extra_kwargs = {
            'email': {'required': True}
        }

    def validate_email(self, value):
        """Validate email uniqueness."""
        if self.instance and self.instance.email == value:
            return value
            
        if Student.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        """Create a new student account."""
        password = validated_data.pop('password', None)
        track = validated_data.get('track')

        # Generate password if not provided
        if not password:
            password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # Generate verification code
        verification_code = secrets.token_urlsafe(24)
        
        # Create student
        student = Student(
            **validated_data,
            verification_code=verification_code,
            verified=False
        )
        student.set_password(password)
        student.save()

        # Send verification email
        try:
            verification_url = f"{settings.SITE_URL}/api/student/verify/{verification_code}/"
            send_mail(
                f"Your {student.role} Account Verification",
                f"""Hello {student.first_name},
                
Your account has been created:
Email: {student.email}
Temporary Password: {password}

Please verify your email by visiting:
{verification_url}""",
                settings.DEFAULT_FROM_EMAIL,
                [student.email],
                fail_silently=False
            )
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")

        return student

    def update(self, instance, validated_data):
        """Update student information."""
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance