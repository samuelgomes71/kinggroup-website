"""
User routes for KingGroup backend
Handles user registration, login, and profile management
"""
from flask import Blueprint, request, jsonify
from sqlalchemy.sql import func
from models.user import User
from config.database import db_config
from auth.jwt_auth import JWTAuth, token_required

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route('/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        # Basic validation
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Username, email e password são obrigatórios'}), 400
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'message': 'Formato de email inválido'}), 400
        
        # Validate password strength
        if len(data['password']) < 6:
            return jsonify({'message': 'Password deve ter pelo menos 6 caracteres'}), 400
        
        session = db_config.get_session()
        
        # Check if user already exists
        existing_user = session.query(User).filter(
            (User.username == data['username']) | (User.email == data['email'])
        ).first()
        
        if existing_user:
            session.close()
            return jsonify({'message': 'Usuário ou email já existe'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            country=data.get('country'),
            region=data.get('region'),
            invite_code=data.get('invite_code'),
            phone=data.get('phone'),
            company=data.get('company')
        )
        
        session.add(user)
        session.commit()
        
        # Generate token
        token = JWTAuth.generate_token(user.id)
        
        user_data = user.to_dict()
        session.close()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'token': token,
            'user': user_data
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'message': 'Username e password são obrigatórios'}), 400
        
        session = db_config.get_session()
        
        # Find user
        user = session.query(User).filter(User.username == data['username']).first()
        
        if not user or not user.check_password(data['password']):
            session.close()
            return jsonify({'message': 'Credenciais inválidas'}), 401
        
        if not user.is_active:
            session.close()
            return jsonify({'message': 'Conta desativada'}), 401
        
        # Update last login
        user.last_login = func.now()
        session.commit()
        
        # Generate token
        token = JWTAuth.generate_token(user.id)
        
        user_data = user.to_dict()
        session.close()
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'token': token,
            'user': user_data
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get user profile"""
    try:
        session = db_config.get_session()
        user = session.query(User).filter(User.id == current_user_id).first()
        
        if not user:
            session.close()
            return jsonify({'message': 'Usuário não encontrado'}), 404
        
        user_data = user.to_dict()
        session.close()
        
        return jsonify({'user': user_data})
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    """Update user profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'Dados não fornecidos'}), 400
        
        session = db_config.get_session()
        user = session.query(User).filter(User.id == current_user_id).first()
        
        if not user:
            session.close()
            return jsonify({'message': 'Usuário não encontrado'}), 404
        
        # Update allowed fields
        updatable_fields = ['country', 'region', 'phone', 'company', 'profile_image']
        
        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])
        
        # Update password if provided
        if 'password' in data and data['password']:
            if len(data['password']) < 6:
                session.close()
                return jsonify({'message': 'Password deve ter pelo menos 6 caracteres'}), 400
            user.set_password(data['password'])
        
        session.commit()
        user_data = user.to_dict()
        session.close()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': user_data
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

