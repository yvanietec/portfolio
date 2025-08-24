# papp/utils.py

import logging
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.conf import settings
import hmac
import hashlib

logger = logging.getLogger(__name__)


def safe_get_user_profile(user):
    """
    Safely get or create a UserProfile for a user with proper error handling.
    """
    try:
        return user.userprofile
    except Exception as e:
        logger.error(f"Error getting user profile for {user.username}: {e}")
        return None


def verify_razorpay_signature_secure(order_id, payment_id, signature, secret):
    """
    Enhanced Razorpay signature verification with better error handling.
    """
    try:
        if not all([order_id, payment_id, signature, secret]):
            logger.warning(
                "Missing required parameters for signature verification")
            return False

        # Create the signature string
        message = f"{order_id}|{payment_id}"

        # Generate expected signature
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        logger.error(f"Signature verification error: {e}")
        return False


def validate_file_upload(file, allowed_types=None, max_size_mb=10):
    """
    Validate file uploads with security checks.
    """
    if not file:
        raise ValidationError("No file provided")

    if allowed_types is None:
        allowed_types = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']

    # Check file extension
    file_name = file.name.lower()
    if not any(file_name.endswith(ext) for ext in allowed_types):
        raise ValidationError(
            f"File type not allowed. Allowed types: {', '.join(allowed_types)}")

    # Check file size (max_size_mb in MB)
    max_size_bytes = max_size_mb * 1024 * 1024
    if file.size > max_size_bytes:
        raise ValidationError(f"File too large. Maximum size: {max_size_mb}MB")

    return True


def create_json_response(data, status=200, message=""):
    """
    Create a standardized JSON response.
    """
    response_data = {
        'status': 'success' if status < 400 else 'error',
        'data': data,
        'message': message
    }
    return JsonResponse(response_data, status=status)


def log_user_activity(user, action, description=""):
    """
    Log user activities for audit trail.
    """
    try:
        from .models import UserActivity
        UserActivity.objects.create(
            user=user,
            action=action,
            description=description
        )
    except Exception as e:
        logger.error(f"Failed to log user activity: {e}")


def sanitize_filename(filename):
    """
    Sanitize filename for safe storage.
    """
    import re
    # Remove or replace dangerous characters
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    # Limit length
    if len(filename) > 100:
        name, ext = filename.rsplit('.', 1)
        filename = name[:95] + '.' + ext
    return filename
