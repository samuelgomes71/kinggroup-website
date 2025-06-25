"""
KingGroup Backend - Main Application
Clean, modular Flask application with Cloud SQL integration
"""
from flask import Flask, jsonify
from flask_cors import CORS
import os
import datetime

# Import configuration and models
from config.database import db_config
from models.user import User
from models.map import Map
from models.download import Download

# Import route blueprints
from routes.user_routes import user_bp
from routes.map_routes import map_bp
from routes.admin_routes import admin_bp

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'kinggroup-secret-key-2025')
    
    # CORS configuration
    CORS(app, origins=[
        'https://kinggrouptech.com', 
        'https://www.kinggrouptech.com', 
        'https://kinggrouptech-93908.web.app',
        'http://localhost:3000',  # Development
        'http://localhost:8080'   # Local testing
    ])
    
    # Register blueprints
    app.register_blueprint(user_bp)
    app.register_blueprint(map_bp)
    app.register_blueprint(admin_bp)
    
    return app

# Create Flask application
app = create_app()

# Initialize database when module is imported (required for App Engine)
try:
    db_config.initialize_database()
    print("✅ Database initialized successfully")
except Exception as e:
    print(f"⚠️ Database initialization warning: {str(e)}")

# === MAIN ROUTES ===

@app.route('/', methods=['GET'])
def index():
    """API root endpoint"""
    return jsonify({
        'message': 'KingGroup API v2.0 - Modular Architecture',
        'version': '2.0.0',
        'status': 'active',
        'database': 'Cloud SQL PostgreSQL' if db_config.database_url.startswith('postgresql') else 'SQLite (dev)',
        'architecture': 'modular',
        'endpoints': {
            'users': '/api/user/',
            'maps': '/api/maps/',
            'admin': '/api/admin/'
        },
        'features': [
            'Modular architecture',
            'Cloud SQL integration',
            'JWT authentication',
            'Premium content support',
            'Download tracking',
            'Admin dashboard'
        ],
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        session = db_config.get_session()
        user_count = session.query(User).count()
        map_count = session.query(Map).count()
        download_count = session.query(Download).count()
        session.close()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'database': {
                'status': 'connected',
                'type': 'Cloud SQL PostgreSQL' if db_config.database_url.startswith('postgresql') else 'SQLite',
                'users': user_count,
                'maps': map_count,
                'downloads': download_count
            },
            'version': '2.0.0',
            'architecture': 'modular'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'version': '2.0.0'
        }), 500

@app.route('/api/info', methods=['GET'])
def api_info():
    """API information and documentation"""
    return jsonify({
        'api_version': '2.0.0',
        'architecture': 'modular',
        'authentication': 'JWT Bearer Token',
        'endpoints': {
            'authentication': {
                'register': 'POST /api/user/register',
                'login': 'POST /api/user/login',
                'profile': 'GET /api/user/profile'
            },
            'maps': {
                'list': 'GET /api/maps/',
                'details': 'GET /api/maps/{id}',
                'download': 'POST /api/maps/{id}/download',
                'categories': 'GET /api/maps/categories'
            },
            'admin': {
                'stats': 'GET /api/admin/stats',
                'users': 'GET /api/admin/users',
                'user_management': 'POST /api/admin/users/{id}/toggle-status'
            }
        },
        'features': {
            'modular_architecture': 'Separated concerns and maintainable code',
            'cloud_sql': 'PostgreSQL database for production scalability',
            'jwt_auth': 'Secure token-based authentication',
            'premium_content': 'Tiered access control',
            'download_tracking': 'Analytics and user behavior tracking',
            'admin_panel': 'Administrative functions and statistics'
        }
    })

# === ERROR HANDLERS ===

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint não encontrado',
        'message': 'Verifique a URL e tente novamente',
        'available_endpoints': [
            '/',
            '/health',
            '/api/info',
            '/api/user/*',
            '/api/maps/*',
            '/api/admin/*'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Erro interno do servidor',
        'message': 'Tente novamente em alguns instantes'
    }), 500

# === APPLICATION STARTUP ===

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 Starting KingGroup API v2.0")
    print(f"📊 Database: {'Cloud SQL PostgreSQL' if db_config.database_url.startswith('postgresql') else 'SQLite (development)'}")
    print(f"🌐 Port: {port}")
    print(f"🔧 Debug: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

# Version: 2.0.0 - Modular Architecture
# Cloud SQL integration - Wed Jun 25 19:45:00 EDT 2025

