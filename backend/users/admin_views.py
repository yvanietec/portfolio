"""
Admin views for monitoring and security management.
"""
from django.shortcuts import render
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.core.cache import cache
from django.db import connection
from .monitoring import security_monitor, performance_monitor, error_monitor
from .models import UserActivity, AdminLog
import json


@login_required
@user_passes_test(lambda u: u.is_staff)
def monitoring_dashboard(request):
    """
    Admin dashboard for monitoring system health and security.
    """
    # Get security metrics
    security_metrics = {
        'blocked_ips': len(security_monitor.blocked_ips),
        'suspicious_activities': len(security_monitor.suspicious_activities),
        'failed_login_attempts': len(security_monitor.failed_login_attempts),
    }

    # Get performance metrics
    performance_report = performance_monitor.get_performance_report()

    # Get error metrics
    error_metrics = {
        'total_errors': len(error_monitor.errors),
        'error_counts': error_monitor.error_counts,
    }

    # Get recent activities
    recent_activities = UserActivity.objects.order_by('-timestamp')[:10]

    # Get database stats
    db_stats = performance_monitor.get_database_stats()

    context = {
        'security_metrics': security_metrics,
        'performance_report': performance_report,
        'error_metrics': error_metrics,
        'recent_activities': recent_activities,
        'db_stats': db_stats,
    }

    return render(request, 'portfolio/admin/simple_monitoring.html', context)


@login_required
@user_passes_test(lambda u: u.is_staff)
def security_logs(request):
    """
    View security logs and suspicious activities.
    """
    suspicious_activities = security_monitor.suspicious_activities[-50:]  # Last 50 activities

    # Get blocked IPs from cache
    blocked_ips = []
    for key in cache.keys('blocked_ip_*'):
        ip = key.replace('blocked_ip_', '')
        reason = cache.get(key)
        blocked_ips.append({'ip': ip, 'reason': reason})

    context = {
        'suspicious_activities': suspicious_activities,
        'blocked_ips': blocked_ips,
    }

    return render(request, 'portfolio/admin/security_logs.html', context)


@login_required
@user_passes_test(lambda u: u.is_staff)
def performance_metrics(request):
    """
    View detailed performance metrics.
    """
    performance_report = performance_monitor.get_performance_report()

    # Get slow queries
    slow_queries = performance_report.get('slow_queries', [])

    # Get performance metrics by endpoint
    endpoint_metrics = performance_report.get('performance_metrics', {})

    context = {
        'slow_queries': slow_queries,
        'endpoint_metrics': endpoint_metrics,
        'db_stats': performance_report.get('database_stats', {}),
    }

    return render(request, 'portfolio/admin/performance_metrics.html', context)


@login_required
@user_passes_test(lambda u: u.is_staff)
def api_monitoring_data(request):
    """
    API endpoint for real-time monitoring data.
    """
    # Get current metrics
    data = {
        'security': {
            'blocked_ips_count': len(security_monitor.blocked_ips),
            'suspicious_activities_count': len(security_monitor.suspicious_activities),
            'recent_suspicious': security_monitor.suspicious_activities[-5:] if security_monitor.suspicious_activities else [],
        },
        'performance': {
            'slow_queries_count': len(performance_monitor.slow_queries),
            'recent_slow_queries': performance_monitor.slow_queries[-5:] if performance_monitor.slow_queries else [],
            'db_stats': performance_monitor.get_database_stats(),
        },
        'errors': {
            'total_errors': len(error_monitor.errors),
            'error_counts': error_monitor.error_counts,
            'recent_errors': error_monitor.errors[-5:] if error_monitor.errors else [],
        },
        'system': {
            'active_users': cache.get('active_users_count', 0),
            'memory_usage': cache.get('memory_usage', 0),
            'cpu_usage': cache.get('cpu_usage', 0),
        }
    }

    return JsonResponse(data)


@login_required
@user_passes_test(lambda u: u.is_staff)
def block_ip(request):
    """
    Manually block an IP address.
    """
    if request.method == 'POST':
        ip_address = request.POST.get('ip_address')
        reason = request.POST.get('reason', 'Manual block')

        if ip_address:
            security_monitor.block_ip(ip_address, reason)

            # Log the action
            AdminLog.objects.create(
                admin=request.user,
                action=f"Manually blocked IP {ip_address}: {reason}"
            )

            return JsonResponse({'status': 'success', 'message': f'IP {ip_address} blocked successfully'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request'})


@login_required
@user_passes_test(lambda u: u.is_staff)
def unblock_ip(request):
    """
    Unblock an IP address.
    """
    if request.method == 'POST':
        ip_address = request.POST.get('ip_address')

        if ip_address:
            # Remove from blocked IPs
            security_monitor.blocked_ips.discard(ip_address)
            cache.delete(f"blocked_ip_{ip_address}")

            # Log the action
            AdminLog.objects.create(
                admin=request.user,
                action=f"Unblocked IP {ip_address}"
            )

            return JsonResponse({'status': 'success', 'message': f'IP {ip_address} unblocked successfully'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request'})


@login_required
@user_passes_test(lambda u: u.is_staff)
def clear_logs(request):
    """
    Clear old logs and monitoring data.
    """
    if request.method == 'POST':
        log_type = request.POST.get('log_type')

        if log_type == 'security':
            # Clear old suspicious activities (keep last 100)
            if len(security_monitor.suspicious_activities) > 100:
                security_monitor.suspicious_activities = security_monitor.suspicious_activities[-100:]

        elif log_type == 'performance':
            # Clear old slow queries (keep last 50)
            if len(performance_monitor.slow_queries) > 50:
                performance_monitor.slow_queries = performance_monitor.slow_queries[-50:]

        elif log_type == 'errors':
            # Clear old errors (keep last 100)
            if len(error_monitor.errors) > 100:
                error_monitor.errors = error_monitor.errors[-100:]

        # Log the action
        AdminLog.objects.create(
            admin=request.user,
            action=f"Cleared {log_type} logs"
        )

        return JsonResponse({'status': 'success', 'message': f'{log_type} logs cleared successfully'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request'})


@login_required
@user_passes_test(lambda u: u.is_staff)
def export_monitoring_data(request):
    """
    Export monitoring data for analysis.
    """
    import csv
    from django.http import HttpResponse

    data_type = request.GET.get('type', 'security')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{data_type}_data.csv"'

    writer = csv.writer(response)

    if data_type == 'security':
        writer.writerow(['Timestamp', 'Type', 'IP Address', 'Details'])
        for activity in security_monitor.suspicious_activities:
            writer.writerow([
                activity.get('timestamp', ''),
                activity.get('type', ''),
                activity.get('ip_address', ''),
                json.dumps(activity.get('details', {}))
            ])

    elif data_type == 'performance':
        writer.writerow(['Timestamp', 'Path', 'Duration', 'Query Count'])
        for query in performance_monitor.slow_queries:
            writer.writerow([
                query.get('timestamp', ''),
                query.get('path', ''),
                query.get('duration', ''),
                query.get('query_count', '')
            ])

    elif data_type == 'errors':
        writer.writerow(['Timestamp', 'Type', 'Message'])
        for error in error_monitor.errors:
            writer.writerow([
                error.get('timestamp', ''),
                error.get('type', ''),
                error.get('message', '')
            ])

    return response
