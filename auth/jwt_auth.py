"""
JWT Authentication module for KingGroup backend
Handles token generation, validation and user authentication
"""
import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app
from models.user import User
from config.database import db_config

class JWTAuth:
    """JWT Authentication handler"""
    
    @staticmethod
    def generate_token(user_id, expires_hours=24):
        """Generate JWT token for user"""
        try:
            payload = {
                'user_id': user_id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=expires_hours),
                'iat': datetime.datetime.utcnow()
            }
            
            token = jwt.encode(
                payload, 
                current_app.config['SECRET_KEY'], 
                algorithm='HS256'
            )
            
            return token
            
        except Exception as e:
            raise Exception(f"Token generation failed: {str(e)}")
    
    @staticmethod
    def decode_token(token):
        """Decode and validate JWT token"""
        try:
            if token.startswith('Bearer '):
                token = token[7:]
                
            payload = jwt.decode(
                token, 
                current_app.config['SECRET_KEY'], 
                algorithms=['HS256']
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise Exception("Token expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid token")
        except Exception as e:
            raise Exception(f"Token decode failed: {str(e)}")
    
    @staticmethod
    def get_current_user(token):
        """Get current user from token"""
        try:
            payload = JWTAuth.decode_token(token)
            user_id = payload['user_id']
            
            session = db_config.get_session()
            user = session.query(User).filter(User.id == user_id).first()
            session.close()
            
            if not user or not user.is_active:
                raise Exception("User not found or inactive")
                
            return user
            
        except Exception as e:
            raise Exception(f"User retrieval failed: {str(e)}")

def token_required(f):
    """Decorator for routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token é obrigatório'}), 401
            
        try:
            payload = JWTAuth.decode_token(token)
            current_user_id = payload['user_id']
            
            # Verify user exists and is active
            session = db_config.get_session()
            user = session.query(User).filter(User.id == current_user_id).first()
            session.close()
            
            if not user or not user.is_active:
                return jsonify({'message': 'Usuário inválido ou inativo'}), 401
                
        except Exception as e:
            return jsonify({'message': f'Token inválido: {str(e)}'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator for routes that require admin access"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token é obrigatório'}), 401
            
        try:
            user = JWTAuth.get_current_user(token)
            
            if user.username != 'admin':
                return jsonify({'message': 'Acesso administrativo necessário'}), 403
                
            current_user_id = user.id
            
        except Exception as e:
            return jsonify({'message': f'Erro de autenticação: {str(e)}'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

def premium_required(f):
    """Decorator for routes that require premium access"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token é obrigatório'}), 401
            
        try:
            user = JWTAuth.get_current_user(token)
            
            if not user.is_premium:
                return jsonify({'message': 'Acesso premium necessário'}), 403
                
            current_user_id = user.id
            
        except Exception as e:
            return jsonify({'message': f'Erro de autenticação: {str(e)}'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

