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

# Configuração do banco de dados
DATABASE = 'kinggroup.db'

def init_db():
    """Inicializa o banco de dados com as tabelas necessárias"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Tabela de usuários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            country TEXT,
            region TEXT,
            invite_code TEXT,
            license_expires TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Tabela de mapas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS maps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country TEXT NOT NULL,
            state TEXT,
            city TEXT,
            map_type TEXT NOT NULL,
            file_size INTEGER,
            download_url TEXT,
            is_premium BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabela de downloads
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            map_id INTEGER,
            download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (map_id) REFERENCES maps (id)
        )
    ''')
    
    # Inserir usuário admin padrão
    admin_password = generate_password_hash('KIN(1903)nik')
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, email, password_hash, country, region)
        VALUES (?, ?, ?, ?, ?)
    ''', ('admin', 'admin@kinggrouptech.com', admin_password, 'BR', 'Global'))
    
    # Inserir dados de exemplo para mapas
    sample_maps = [
        ('BR', 'SP', 'São Paulo', 'standard', 52428800, None, 0),
        ('BR', 'RJ', 'Rio de Janeiro', 'standard', 41943040, None, 0),
        ('BR', 'MG', 'Belo Horizonte', 'standard', 31457280, None, 0),
        ('US', 'CA', 'Los Angeles', 'premium', 104857600, None, 1),
        ('US', 'NY', 'New York', 'premium', 125829120, None, 1),
    ]
    
    for map_data in sample_maps:
        cursor.execute('''
            INSERT OR IGNORE INTO maps (country, state, city, map_type, file_size, download_url, is_premium)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', map_data)
    
    conn.commit()
    conn.close()

def token_required(f):
    """Decorator para verificar token JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# === ROTA PRINCIPAL ===

@app.route('/', methods=['GET'])
def index():
    """Página inicial da API"""
    return jsonify({
        'message': 'KingGroup API is running!',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/login, /api/auth/register-testador',
            'maps': '/api/maps/regions, /api/maps/download, /api/maps/stats',
            'admin': '/api/admin/stats'
        },
        'status': 'active'
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check para monitoramento"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'database': 'connected'
    })

# === ROTAS DE AUTENTICAÇÃO ===

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login de usuário"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('SELECT id, password_hash FROM users WHERE username = ? AND is_active = 1', (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user[1], password):
        token = jwt.encode({
            'user_id': user[0],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'success': True,
            'token': token,
            'message': 'Login successful'
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/register-testador', methods=['POST'])
def register_testador():
    """Registro de novo testador"""
    data = request.get_json()
    
    required_fields = ['username', 'email', 'password', 'country', 'region']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Verificar se usuário já existe
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM users WHERE username = ? OR email = ?', 
                   (data['username'], data['email']))
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'User already exists'}), 400
    
    # Criar novo usuário
    password_hash = generate_password_hash(data['password'])
    license_expires = (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
    
    cursor.execute('''
        INSERT INTO users (username, email, password_hash, country, region, 
                          invite_code, license_expires)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (data['username'], data['email'], password_hash, data['country'], 
          data['region'], data.get('invite_code', ''), license_expires))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Gerar token
    token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'])
    
    return jsonify({
        'success': True,
        'token': token,
        'message': 'User registered successfully',
        'license_expires': license_expires
    })

# === ROTAS DE MAPAS OFFLINE ===

@app.route('/api/maps/regions', methods=['GET'])
@token_required
def get_regions(current_user_id):
    """Lista regiões disponíveis para download"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT DISTINCT country, state, city, map_type, file_size, is_premium
        FROM maps ORDER BY country, state, city
    ''')
    maps = cursor.fetchall()
    conn.close()
    
    regions = []
    for map_data in maps:
        regions.append({
            'country': map_data[0],
            'state': map_data[1],
            'city': map_data[2],
            'map_type': map_data[3],
            'file_size': map_data[4],
            'is_premium': bool(map_data[5])
        })
    
    return jsonify({'regions': regions})

@app.route('/api/maps/download', methods=['POST'])
@token_required
def download_map(current_user_id):
    """Inicia download de mapa offline"""
    data = request.get_json()
    country = data.get('country')
    state = data.get('state', '')
    city = data.get('city', '')
    map_type = data.get('map_type', 'standard')
    
    if not country:
        return jsonify({'error': 'Country is required'}), 400
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Buscar mapa
    cursor.execute('''
        SELECT id, file_size, is_premium, download_url
        FROM maps WHERE country = ? AND state = ? AND city = ? AND map_type = ?
    ''', (country, state, city, map_type))
    map_data = cursor.fetchone()
    
    if not map_data:
        conn.close()
        return jsonify({'error': 'Map not found'}), 404
    
    map_id, file_size, is_premium, download_url = map_data
    
    # Verificar se é premium e usuário tem licença
    if is_premium:
        cursor.execute('SELECT license_expires FROM users WHERE id = ?', (current_user_id,))
        user = cursor.fetchone()
        if not user or datetime.datetime.fromisoformat(user[0]) < datetime.datetime.now():
            conn.close()
            return jsonify({'error': 'Premium license required'}), 403
    
    # Registrar download
    cursor.execute('''
        INSERT INTO downloads (user_id, map_id, ip_address)
        VALUES (?, ?, ?)
    ''', (current_user_id, map_id, request.remote_addr))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'download_url': download_url or f'/api/maps/file/{map_id}',
        'file_size': file_size,
        'estimated_time': file_size // 1024 if file_size else 30  # segundos estimados
    })

@app.route('/api/maps/stats', methods=['GET'])
@token_required
def maps_stats(current_user_id):
    """Estatísticas de downloads de mapas"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Total de downloads do usuário
    cursor.execute('SELECT COUNT(*) FROM downloads WHERE user_id = ?', (current_user_id,))
    user_downloads = cursor.fetchone()[0]
    
    # Downloads por país
    cursor.execute('''
        SELECT m.country, COUNT(*) as downloads
        FROM downloads d
        JOIN maps m ON d.map_id = m.id
        WHERE d.user_id = ?
        GROUP BY m.country
        ORDER BY downloads DESC
    ''', (current_user_id,))
    downloads_by_country = cursor.fetchall()
    
    conn.close()
    
    return jsonify({
        'total_downloads': user_downloads,
        'downloads_by_country': [{'country': row[0], 'count': row[1]} 
                                for row in downloads_by_country]
    })

# === ROTAS ADMINISTRATIVAS ===

@app.route('/api/admin/stats', methods=['GET'])
@token_required
def admin_stats(current_user_id):
    """Estatísticas administrativas"""
    # Verificar se é admin
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('SELECT username FROM users WHERE id = ?', (current_user_id,))
    user = cursor.fetchone()
    
    if not user or user[0] != 'admin':
        conn.close()
        return jsonify({'error': 'Admin access required'}), 403
    
    # Estatísticas gerais
    cursor.execute('SELECT COUNT(*) FROM users WHERE is_active = 1')
    total_users = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM downloads')
    total_downloads = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM maps')
    total_maps = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'total_users': total_users,
        'total_downloads': total_downloads,
        'total_maps': total_maps
    })

# === INICIALIZAÇÃO ===

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)

# Deploy test Wed Jun 25 12:27:09 EDT 2025
# Workflow test Wed Jun 25 13:46:32 EDT 2025
# Backend deploy test Wed Jun 25 14:13:49 EDT 2025
# API ativada - teste Wed Jun 25 14:17:44 EDT 2025
