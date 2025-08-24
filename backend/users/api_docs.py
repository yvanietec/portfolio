"""
API Documentation for Portfolio Management System

This module provides comprehensive documentation for all API endpoints
and their usage patterns.
"""

API_ENDPOINTS = {
    "authentication": {
        "login": {
            "url": "/login/",
            "method": "POST",
            "description": "User authentication endpoint",
            "parameters": {
                "username": "string (required)",
                "password": "string (required)"
            },
            "response": {
                "success": "Redirect to dashboard",
                "error": "Error message"
            }
        },
        "register": {
            "url": "/register/",
            "method": "POST",
            "description": "User registration endpoint",
            "parameters": {
                "username": "string (required)",
                "email": "string (required)",
                "password": "string (required)",
                "password2": "string (required)"
            }
        }
    },

    "portfolio_management": {
        "create_portfolio": {
            "url": "/create/",
            "method": "POST",
            "description": "Create a new portfolio",
            "requirements": "User must be authenticated and have available slots"
        },
        "edit_portfolio": {
            "url": "/portfolio/edit/",
            "method": "POST",
            "description": "Edit existing portfolio",
            "requirements": "User must own the portfolio"
        },
        "delete_portfolio": {
            "url": "/portfolio/delete/",
            "method": "POST",
            "description": "Delete portfolio",
            "requirements": "User must own the portfolio"
        }
    },

    "payment": {
        "initiate_payment": {
            "url": "/payment/initiate/",
            "method": "GET",
            "description": "Start payment process",
            "response": "Razorpay payment form"
        },
        "payment_success": {
            "url": "/payment/success/",
            "method": "POST",
            "description": "Handle successful payment",
            "parameters": {
                "razorpay_order_id": "string",
                "razorpay_payment_id": "string",
                "razorpay_signature": "string"
            }
        }
    },

    "admin": {
        "admin_dashboard": {
            "url": "/dashboard/admin/",
            "method": "GET",
            "description": "Admin dashboard",
            "requirements": "User must be staff"
        },
        "user_management": {
            "url": "/admin-dashboard/users/",
            "method": "GET",
            "description": "User management interface",
            "requirements": "User must be staff"
        }
    }
}

ERROR_CODES = {
    "400": "Bad Request - Invalid parameters",
    "401": "Unauthorized - Authentication required",
    "403": "Forbidden - Insufficient permissions",
    "404": "Not Found - Resource not found",
    "429": "Too Many Requests - Rate limit exceeded",
    "500": "Internal Server Error - Server error"
}

SECURITY_GUIDELINES = [
    "All sensitive data should be transmitted over HTTPS",
    "API keys should be stored in environment variables",
    "User passwords are hashed using Django's built-in hashing",
    "CSRF protection is enabled for all POST requests",
    "Rate limiting is implemented for login attempts",
    "File uploads are validated for type and size",
    "SQL injection protection is handled by Django ORM"
]


def get_api_version():
    """Return current API version."""
    return "1.0.0"


def get_supported_formats():
    """Return supported response formats."""
    return ["JSON", "HTML"]


def get_rate_limits():
    """Return current rate limiting configuration."""
    return {
        "anonymous": "10 requests per minute",
        "authenticated": "100 requests per minute",
        "login_attempts": "5 attempts per 15 minutes"
    }
