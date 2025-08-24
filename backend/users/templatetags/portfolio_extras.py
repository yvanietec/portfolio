from django import template

register = template.Library()


@register.filter
def split_technologies(value, delimiter=','):
    """Split a string by delimiter and return a list of stripped values"""
    if not value:
        return []
    return [tech.strip() for tech in value.split(delimiter) if tech.strip()]
