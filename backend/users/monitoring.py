"""
Comprehensive monitoring system for security, performance, and error tracking.
"""
import logging
import time
import json
from datetime import datetime, timedelta
from django.core.cache import cache
from django.http import HttpRequest
from django.conf import settings
from django.core.mail import send_mail
from django.db import connection
import hashlib
import hmac

logger = logging.getLogger(__name__)


class SecurityMonitor:
    """
    Monitor and detect security threats.
    """

    def __init__(self):
        self.suspicious_activities = []
        self.blocked_ips = set()
        self.failed_login_attempts = {}

    def log_suspicious_activity(self, activity_type, details, ip_address=None):
        """Log suspicious activities for analysis."""
        activity = {
            'type': activity_type,
            'details': details,
            'ip_address': ip_address,
            'timestamp': datetime.now().isoformat(),
            'user_agent': details.get('user_agent', ''),
            'request_path': details.get('path', ''),
        }

        self.suspicious_activities.append(activity)

        # Alert if too many suspicious activities
        if len(self.suspicious_activities) > 10:
            self.send_security_alert("Multiple suspicious activities detected")

        logger.warning(f"SECURITY ALERT: {activity_type} - {details}")

    def check_rate_limit(self, ip_address, action_type, limit=5, window=300):
        """Check if IP has exceeded rate limits."""
        cache_key = f"rate_limit_{action_type}_{ip_address}"
        attempts = cache.get(cache_key, 0)

        if attempts >= limit:
            self.block_ip(ip_address, f"Rate limit exceeded for {action_type}")
            return False

        cache.set(cache_key, attempts + 1, window)
        return True

    def block_ip(self, ip_address, reason):
        """Block an IP address temporarily."""
        self.blocked_ips.add(ip_address)
        cache.set(f"blocked_ip_{ip_address}", reason, 3600)  # Block for 1 hour
        logger.warning(f"IP {ip_address} blocked: {reason}")

    def is_ip_blocked(self, ip_address):
        """Check if IP is blocked."""
        return ip_address in self.blocked_ips or cache.get(f"blocked_ip_{ip_address}")

    def send_security_alert(self, message):
        """Send security alert via email."""
        try:
            send_mail(
                subject=f"SECURITY ALERT: {message}",
                message=f"""
                Security Alert Detected!
                
                Message: {message}
                Time: {datetime.now()}
                Server: {settings.SITE_URL}
                
                Please investigate immediately.
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.DEFAULT_FROM_EMAIL],  # Send to admin
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send security alert: {e}")


class PerformanceMonitor:
    """
    Monitor application performance and bottlenecks.
    """

    def __init__(self):
        self.slow_queries = []
        self.performance_metrics = {}

    def track_request_performance(self, request_path, duration, query_count):
        """Track request performance metrics."""
        if duration > 1.0:  # Log slow requests
            self.slow_queries.append({
                'path': request_path,
                'duration': duration,
                'query_count': query_count,
                'timestamp': datetime.now()
            })

            # Keep only last 100 slow queries
            if len(self.slow_queries) > 100:
                self.slow_queries = self.slow_queries[-100:]

        # Update performance metrics
        if request_path not in self.performance_metrics:
            self.performance_metrics[request_path] = {
                'count': 0,
                'total_duration': 0,
                'avg_duration': 0
            }

        metrics = self.performance_metrics[request_path]
        metrics['count'] += 1
        metrics['total_duration'] += duration
        metrics['avg_duration'] = metrics['total_duration'] / metrics['count']

    def get_performance_report(self):
        """Generate performance report."""
        return {
            'slow_queries': self.slow_queries[-10:],  # Last 10 slow queries
            'performance_metrics': self.performance_metrics,
            'database_stats': self.get_database_stats()
        }

    def get_database_stats(self):
        """Get database performance statistics."""
        total_queries = len(connection.queries)
        slow_queries = [q for q in connection.queries if float(
            q.get('time', 0)) > 0.1]

        return {
            'total_queries': total_queries,
            'slow_queries': len(slow_queries),
            'average_query_time': sum(float(q.get('time', 0)) for q in connection.queries) / total_queries if total_queries > 0 else 0
        }


class ErrorMonitor:
    """
    Monitor and track application errors.
    """

    def __init__(self):
        self.errors = []
        self.error_counts = {}

    def log_error(self, error_type, error_message, request_info=None):
        """Log application errors."""
        error = {
            'type': error_type,
            'message': error_message,
            'timestamp': datetime.now(),
            'request_info': request_info or {}
        }

        self.errors.append(error)

        # Count error types
        if error_type not in self.error_counts:
            self.error_counts[error_type] = 0
        self.error_counts[error_type] += 1

        # Alert if too many errors
        if self.error_counts[error_type] > 10:
            self.send_error_alert(error_type, self.error_counts[error_type])

        logger.error(f"ERROR: {error_type} - {error_message}")

    def send_error_alert(self, error_type, count):
        """Send error alert via email."""
        try:
            send_mail(
                subject=f"ERROR ALERT: {error_type} occurred {count} times",
                message=f"""
                Error Alert!
                
                Error Type: {error_type}
                Count: {count}
                Time: {datetime.now()}
                Server: {settings.SITE_URL}
                
                Please investigate the application logs.
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.DEFAULT_FROM_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send error alert: {e}")


# Global monitoring instances
security_monitor = SecurityMonitor()
performance_monitor = PerformanceMonitor()
error_monitor = ErrorMonitor()


def monitor_request(request, response, duration):
    """Monitor all aspects of a request."""
    # Security monitoring
    ip_address = get_client_ip(request)

    # Check for suspicious patterns
    if is_suspicious_request(request):
        security_monitor.log_suspicious_activity(
            'suspicious_request',
            {
                'path': request.path,
                'method': request.method,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'ip_address': ip_address
            },
            ip_address
        )

    # Performance monitoring
    query_count = len(connection.queries)
    performance_monitor.track_request_performance(
        request.path,
        duration,
        query_count
    )


def get_client_ip(request):
    """Get client IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def is_suspicious_request(request):
    """Detect suspicious request patterns."""
    suspicious_patterns = [
        '/admin/',  # Admin access attempts
        'script',   # XSS attempts
        'union',    # SQL injection attempts
        'eval(',    # Code injection attempts
        'javascript:',  # Protocol injection
    ]

    path = request.path.lower()
    user_agent = request.META.get('HTTP_USER_AGENT', '').lower()

    # Check for suspicious patterns in path
    for pattern in suspicious_patterns:
        if pattern in path:
            return True

    # Check for suspicious user agents
    suspicious_agents = ['sqlmap', 'nikto', 'nmap', 'scanner']
    for agent in suspicious_agents:
        if agent in user_agent:
            return True

    return False


def verify_request_signature(request, secret_key):
    """Verify request signature for API security."""
    signature = request.META.get('HTTP_X_SIGNATURE')
    timestamp = request.META.get('HTTP_X_TIMESTAMP')

    if not signature or not timestamp:
        return False

    # Check if timestamp is recent (within 5 minutes)
    try:
        request_time = datetime.fromtimestamp(int(timestamp))
        if datetime.now() - request_time > timedelta(minutes=5):
            return False
    except:
        return False

    # Verify signature
    message = f"{request.path}{timestamp}"
    expected_signature = hmac.new(
        secret_key.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)
