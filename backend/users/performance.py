"""
Performance monitoring utilities for the portfolio application.
"""
import time
import logging
from functools import wraps
from django.core.cache import cache
from django.db import connection
from django.conf import settings

logger = logging.getLogger(__name__)


def monitor_performance(func_name=None):
    """
    Decorator to monitor function performance.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            start_queries = len(connection.queries)

            try:
                result = func(*args, **kwargs)
                success = True
            except Exception as e:
                success = False
                raise e
            finally:
                end_time = time.time()
                end_queries = len(connection.queries)

                duration = end_time - start_time
                query_count = end_queries - start_queries

                # Log performance metrics
                logger.info(f"Performance: {func.__name__} took {duration:.3f}s, "
                            f"{query_count} queries, success={success}")

                # Cache slow operations for analysis
                if duration > 1.0:
                    cache_key = f"slow_operation_{func.__name__}"
                    slow_ops = cache.get(cache_key, [])
                    slow_ops.append({
                        'duration': duration,
                        'query_count': query_count,
                        'timestamp': time.time()
                    })
                    # Keep only last 10 slow operations
                    cache.set(cache_key, slow_ops[-10:], 3600)

            return result
        return wrapper
    return decorator


class PerformanceMonitor:
    """
    Class for monitoring application performance.
    """

    def __init__(self):
        self.metrics = {}

    def start_timer(self, operation_name):
        """Start timing an operation."""
        self.metrics[operation_name] = {
            'start_time': time.time(),
            'start_queries': len(connection.queries)
        }

    def end_timer(self, operation_name):
        """End timing an operation and log results."""
        if operation_name in self.metrics:
            start_data = self.metrics[operation_name]
            end_time = time.time()
            end_queries = len(connection.queries)

            duration = end_time - start_data['start_time']
            query_count = end_queries - start_data['start_queries']

            logger.info(f"Operation '{operation_name}' completed in {duration:.3f}s "
                        f"with {query_count} database queries")

            del self.metrics[operation_name]

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


def cache_result(timeout=300):
    """
    Decorator to cache function results.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}_{hash(str(args) + str(kwargs))}"

            # Try to get from cache first
            result = cache.get(cache_key)
            if result is not None:
                return result

            # If not in cache, execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator


def optimize_queryset(queryset, select_related=None, prefetch_related=None):
    """
    Optimize queryset with select_related and prefetch_related.
    """
    if select_related:
        queryset = queryset.select_related(*select_related)
    if prefetch_related:
        queryset = queryset.prefetch_related(*prefetch_related)
    return queryset


# Global performance monitor instance
performance_monitor = PerformanceMonitor()
