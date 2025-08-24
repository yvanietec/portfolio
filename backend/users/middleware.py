import time
from django.core.cache import cache
from django.http import HttpResponseForbidden
from django.conf import settings
import logging
import hashlib

logger = logging.getLogger(__name__)


class RateLimitMiddleware:
    """
    Middleware to prevent rapid form submissions and database flooding
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only apply rate limiting to POST requests (form submissions)
        if request.method == 'POST':
            # Create a unique key for this user/IP
            if request.user.is_authenticated:
                key = f"rate_limit_{request.user.id}"
            else:
                # For anonymous users, use IP address
                ip = self.get_client_ip(request)
                key = f"rate_limit_anon_{hashlib.md5(ip.encode()).hexdigest()}"

            # Check if user has exceeded rate limit
            current_time = time.time()
            request_history = cache.get(key, [])

            # Remove requests older than 1 minute
            request_history = [req_time for req_time in request_history
                               if current_time - req_time < 60]

            # Allow maximum 10 requests per minute
            if len(request_history) >= 10:
                return HttpResponseForbidden(
                    "Too many requests. Please wait a moment before trying again."
                )

            # Add current request to history
            request_history.append(current_time)
            cache.set(key, request_history, 60)  # Cache for 1 minute

        response = self.get_response(request)
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware:
    """
    Add security headers to responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        return response


class RequestLoggingMiddleware:
    """
    Log all requests for debugging and monitoring.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        duration = time.time() - start_time

        # Log slow requests
        if duration > 1.0:  # Log requests taking more than 1 second
            logger.warning(
                f"Slow request: {request.path} took {duration:.2f}s")

        return response


class TermsAcceptanceMiddleware:
    """
    Middleware to ensure users accept terms and conditions before accessing the site.
    Only applies to authenticated users who haven't accepted terms yet.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only check for authenticated users
        if request.user.is_authenticated:
            try:
                # Get user profile
                user_profile = request.user.userprofile

                # Check if user hasn't accepted terms yet
                if not user_profile.terms_accepted:
                    # Define paths that are allowed without terms acceptance
                    allowed_paths = [
                        '/accept-terms/',
                        '/logout/',
                        '/static/',
                        '/media/',
                        '/admin/',
                    ]

                    # Check if current path is allowed
                    current_path = request.path
                    is_allowed = any(current_path.startswith(path)
                                     for path in allowed_paths)

                    if not is_allowed:
                        from django.shortcuts import redirect
                        return redirect('accept_terms')

            except Exception:
                # If there's any error (e.g., user profile doesn't exist), continue
                pass

        return self.get_response(request)


class FormSubmissionSecurityMiddleware:
    """
    Middleware to add security headers and prevent form abuse
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'

        # Prevent caching of form pages to avoid stale data
        if 'portfolio' in request.path or 'form' in request.path:
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'

        return response
