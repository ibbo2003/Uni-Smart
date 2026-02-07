"""
Custom Authentication Backend for UniSmart

This backend allows:
- Students and Faculty: Login with email + password
- Admins: Login with username + password (handled by default ModelBackend)
"""

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailOrUsernameBackend(ModelBackend):
    """
    Custom authentication backend that allows login with either email or username.

    - If the username parameter looks like an email, try to authenticate by email first
    - Otherwise, fall back to username-based authentication
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None

        user = None

        # Check if username parameter contains '@' (likely an email)
        if '@' in username:
            try:
                # Try to find user by email
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                # Email not found, return None
                return None
        else:
            try:
                # Try to find user by username (for admin login)
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None

        # Verify password
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None
