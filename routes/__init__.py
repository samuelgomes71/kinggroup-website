"""
Routes package for KingGroup backend
"""
from .user_routes import user_bp
from .map_routes import map_bp
from .admin_routes import admin_bp

__all__ = ['user_bp', 'map_bp', 'admin_bp']

