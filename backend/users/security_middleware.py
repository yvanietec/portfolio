"""
Advanced security middleware to protect against hacking attempts.
"""
import re
import logging
from django.http import HttpResponseForbidden, HttpResponse
from django.conf import settings
from django.core.cache import cache
from .monitoring import security_monitor, get_client_ip, is_suspicious_request

logger = logging.getLogger(__name__)


class AdvancedSecurityMiddleware:
    """
    Comprehensive security middleware with multiple protection layers.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.blocked_ips = set()
        self.suspicious_patterns = [
            # SQL Injection patterns
            r"(\b(union|select|insert|update|delete|drop|create|alter)\b)",
            r"(\b(and|or)\b\s+\d+\s*=\s*\d+)",
            r"(\b(and|or)\b\s+['\"].*['\"])",

            # XSS patterns
            r"<script[^>]*>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",

            # Path traversal
            r"\.\./",
            r"\.\.\\",

            # Command injection
            r"(\b(cat|ls|pwd|whoami|id|uname)\b)",
            r"(\||&|;|\$\(|\`)",

            # File inclusion
            r"include\s*[\(\"']",
            r"require\s*[\(\"']",

            # PHP code injection
            r"<\?php",
            r"<\?=",

            # LDAP injection
            r"\(\|.*\)",
            r"\(\&.*\)",
        ]

        # Compile patterns for efficiency
        self.compiled_patterns = [re.compile(
            pattern, re.IGNORECASE) for pattern in self.suspicious_patterns]

    def __call__(self, request):
        # Get client IP
        ip_address = get_client_ip(request)

        # Check if IP is blocked
        if self.is_ip_blocked(ip_address):
            return HttpResponseForbidden("Access denied. Your IP has been blocked due to suspicious activity.")

        # Skip malicious content detection for admin dashboard, dashboard, and create URLs
        skip_paths = ['/admin-dashboard/', '/dashboard/',
                      '/create/', '/select-template/', '/portfolio/delete/', '/portfolio/delete']
        if not any(request.path.startswith(p) for p in skip_paths):
            if self.detect_malicious_content(request):
                self.block_ip(ip_address, "Malicious content detected")
                return HttpResponseForbidden("Access denied. Malicious content detected.")

        # Rate limiting for sensitive endpoints
        if self.is_sensitive_endpoint(request.path):
            if not self.check_rate_limit(ip_address, f"sensitive_{request.path}"):
                return HttpResponseForbidden("Rate limit exceeded. Please try again later.")

        # Additional security checks
        if self.detect_attack_patterns(request):
            self.log_suspicious_activity(request, "Attack pattern detected")
            return HttpResponseForbidden("Access denied. Suspicious activity detected.")

        response = self.get_response(request)

        # Add security headers
        response = self.add_security_headers(response)

        return response

    def is_ip_blocked(self, ip_address):
        """Check if IP is blocked."""
        return cache.get(f"blocked_ip_{ip_address}") is not None

    def block_ip(self, ip_address, reason):
        """Block an IP address."""
        cache.set(f"blocked_ip_{ip_address}", reason, 3600)  # Block for 1 hour
        logger.warning(f"IP {ip_address} blocked: {reason}")
        security_monitor.block_ip(ip_address, reason)

    def detect_malicious_content(self, request):
        """Detect malicious content in request."""
        # Check URL path
        path = request.path.lower()
        for pattern in self.compiled_patterns:
            if pattern.search(path):
                return True

        # Check query parameters
        for key, value in request.GET.items():
            if self.check_malicious_string(value):
                return True

        # Check POST data
        if request.method == 'POST':
            for key, value in request.POST.items():
                if self.check_malicious_string(str(value)):
                    return True

        # Check headers
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        if self.check_malicious_string(user_agent):
            return True

        return False

    def check_malicious_string(self, string):
        """Check if string contains malicious patterns."""
        string_lower = string.lower()

        # Check for common attack patterns
        malicious_patterns = [
            'script', 'javascript:', 'vbscript:', 'onload', 'onerror',
            'union select', 'drop table', 'insert into', 'delete from',
            'exec(', 'eval(', 'system(', 'shell_exec',
            '../', '..\\', 'file://', 'data://',
            '<script', '<iframe', '<object', '<embed',
            '<?php', '<?=', 'include', 'require',
            'sqlmap', 'nikto', 'nmap', 'scanner'
        ]

        for pattern in malicious_patterns:
            if pattern in string_lower:
                return True

        return False

    def is_sensitive_endpoint(self, path):
        """Check if endpoint is sensitive and needs extra protection."""
        sensitive_paths = [
            '/admin/', '/login/', '/register/', '/payment/',
            '/dashboard/', '/api/', '/upload/', '/download/'
        ]

        return any(sensitive in path for sensitive in sensitive_paths)

    def check_rate_limit(self, ip_address, action_type, limit=10, window=300):
        """Check rate limiting."""
        cache_key = f"rate_limit_{action_type}_{ip_address}"
        attempts = cache.get(cache_key, 0)

        if attempts >= limit:
            return False

        cache.set(cache_key, attempts + 1, window)
        return True

    def detect_attack_patterns(self, request):
        """Detect specific attack patterns."""
        # Check for brute force attempts
        if request.path == '/login/' and request.method == 'POST':
            ip_address = get_client_ip(request)
            failed_attempts = cache.get(f"login_failed_{ip_address}", 0)

            if failed_attempts > 5:
                self.block_ip(ip_address, "Too many failed login attempts")
                return True

        # Check for directory traversal
        if '..' in request.path or '\\' in request.path:
            return True

        # Check for suspicious user agents
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        suspicious_agents = ['sqlmap', 'nikto',
                             'nmap', 'scanner', 'bot', 'crawler']
        if any(agent in user_agent for agent in suspicious_agents):
            return True

        return False

    def log_suspicious_activity(self, request, reason):
        """Log suspicious activity."""
        security_monitor.log_suspicious_activity(
            'suspicious_request',
            {
                'path': request.path,
                'method': request.method,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'ip_address': get_client_ip(request),
                'reason': reason
            },
            get_client_ip(request)
        )

    def add_security_headers(self, response):
        """Add comprehensive security headers."""
        # Basic security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Content Security Policy
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https://api.razorpay.com; "
            "frame-src https://checkout.razorpay.com; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
        response['Content-Security-Policy'] = csp_policy

        # Additional security headers
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        return response


class FileUploadSecurityMiddleware:
    """
    Security middleware specifically for file uploads.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_extensions = {'.pdf', '.doc',
                                   '.docx', '.jpg', '.jpeg', '.png'}
        self.max_file_size = 10 * 1024 * 1024  # 10MB

    def __call__(self, request):
        if request.method == 'POST' and request.FILES:
            for uploaded_file in request.FILES.values():
                if not self.validate_file(uploaded_file):
                    return HttpResponseForbidden("Invalid file type or size.")

        return self.get_response(request)

    def validate_file(self, uploaded_file):
        """Validate uploaded file for security."""
        # Check file extension
        file_name = uploaded_file.name.lower()
        file_extension = '.' + \
            file_name.split('.')[-1] if '.' in file_name else ''

        if file_extension not in self.allowed_extensions:
            return False

        # Check file size
        if uploaded_file.size > self.max_file_size:
            return False

        # Check file content (basic MIME type validation)
        content_type = uploaded_file.content_type
        allowed_mime_types = {
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
        }

        if content_type not in allowed_mime_types:
            return False

        return True


class SessionSecurityMiddleware:
    """
    Middleware to enhance session security.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Regenerate session ID on login to prevent session fixation
        if request.path == '/login/' and request.method == 'POST':
            if hasattr(request, 'session'):
                request.session.cycle_key()

        # Set secure session settings
        if hasattr(request, 'session'):
            request.session.set_expiry(3600)  # 1 hour timeout

        response = self.get_response(request)

        # Add session security headers
        if hasattr(request, 'session') and request.session.get('_auth_user_id'):
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'

        return response
