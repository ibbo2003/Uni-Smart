"""
JWT Authentication Middleware for Exam Seating Service
Validates JWT tokens from Django backend and enforces RBAC
"""

import jwt
from functools import wraps
from flask import request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

# Must match Django's SECRET_KEY for JWT validation
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-here')
JWT_ALGORITHM = 'HS256'


def decode_jwt_token(token):
    """
    Decode and validate JWT token from Django backend
    Returns user data if valid, None if invalid
    """
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]

        # Decode token
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_user_from_token():
    """
    Extract user information from Authorization header
    Returns user dict with id, role, etc. or None if invalid
    """
    auth_header = request.headers.get('Authorization')

    if not auth_header:
        return None

    payload = decode_jwt_token(auth_header)
    if not payload:
        return None

    # Extract user info from JWT payload
    # Django Simple JWT stores user_id in 'user_id' field
    return {
        'id': payload.get('user_id'),
        'role': payload.get('role', 'STUDENT'),
        'email': payload.get('email'),
    }


def require_auth(allowed_roles=None):
    """
    Decorator to require authentication and optionally check roles

    Usage:
        @require_auth()  # Any authenticated user
        @require_auth(['ADMIN'])  # Only admins
        @require_auth(['ADMIN', 'FACULTY'])  # Admins or faculty
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_user_from_token()

            if not user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please provide a valid authentication token'
                }), 401

            # Check role if specified
            if allowed_roles and user['role'] not in allowed_roles:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'message': f'This action requires one of the following roles: {", ".join(allowed_roles)}',
                    'your_role': user['role']
                }), 403

            # Add user to request context
            request.current_user = user

            return f(*args, **kwargs)

        return decorated_function
    return decorator


def require_admin(f):
    """Shortcut decorator for admin-only endpoints"""
    return require_auth(['ADMIN'])(f)


def require_admin_or_faculty(f):
    """Shortcut decorator for admin or faculty endpoints"""
    return require_auth(['ADMIN', 'FACULTY'])(f)
