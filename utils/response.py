"""
SignBridge - Standardized API Response Helpers
"""

from flask import jsonify


def success_response(data, status_code=200):
    """Create a standardized success response"""
    response = {
        'success': True,
        'data': data
    }
    return jsonify(response), status_code


def error_response(message, status_code=400, details=None):
    """Create a standardized error response"""
    response = {
        'success': False,
        'error': {
            'message': message,
            'code': status_code
        }
    }
    if details:
        response['error']['details'] = details
    return jsonify(response), status_code
