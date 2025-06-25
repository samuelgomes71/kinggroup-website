from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import hashlib
import sqlite3
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'kinggroup-secret-key-2025'

# CORS configurado para permitir acesso do frontend
CORS(app, origins=[
    'https://kinggrouptech.com', 
    'https://www.kinggrouptech.com', 
    'https://kinggrouptech-93908.web.app',
    'http://localhost:3000',  # Para desenvolvimento local
    'http://localhost:8080'   # Para testes locais
])

# === ROTA PRINCIPAL ===

@app.route('/', methods=['GET'])
def index():
    """Página inicial da API - TESTE SEM DATABASE"""
    return jsonify({
        'message': 'KingGroup API is running! (TEST VERSION - NO DATABASE)',
        'version': '1.0.0-test',
        'status': 'active',
        'test': 'database_disabled'
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check para monitoramento"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'database': 'disabled_for_test'
    })

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Endpoint de teste"""
    return jsonify({
        'test': 'success',
        'message': 'Flask app is working without database!',
        'app_engine': 'compatible'
    })

# === INICIALIZAÇÃO ===

# DATABASE INITIALIZATION COMMENTED OUT FOR TESTING
# init_db()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)

# Deploy test Wed Jun 25 12:27:09 EDT 2025
# Workflow test Wed Jun 25 13:46:32 EDT 2025
# Backend deploy test Wed Jun 25 14:13:49 EDT 2025
# API ativada - teste Wed Jun 25 14:17:44 EDT 2025
# TEST VERSION - DATABASE DISABLED

