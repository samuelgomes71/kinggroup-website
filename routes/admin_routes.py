"""
Admin routes for KingGroup backend
Handles administrative functions and statistics
"""
from flask import Blueprint, request, jsonify
import datetime
from sqlalchemy import func
from models.user import User
from models.map import Map
from models.download import Download
from config.database import db_config
from auth.jwt_auth import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats(current_user_id):
    """Get comprehensive system statistics"""
    try:
        session = db_config.get_session()
        
        # User statistics
        user_stats = {
            'total': session.query(User).count(),
            'active': session.query(User).filter(User.is_active == True).count(),
            'premium': session.query(User).filter(User.is_premium == True).count(),
            'new_today': session.query(User).filter(
                func.date(User.created_at) == datetime.date.today()
            ).count(),
            'new_this_week': session.query(User).filter(
                User.created_at >= datetime.datetime.now() - datetime.timedelta(days=7)
            ).count()
        }
        
        # Map statistics
        map_stats = {
            'total': session.query(Map).count(),
            'active': session.query(Map).filter(Map.is_active == True).count(),
            'premium': session.query(Map).filter(Map.is_premium == True).count(),
            'by_type': {}
        }
        
        # Map types breakdown
        map_types = session.query(
            Map.map_type,
            func.count(Map.id).label('count')
        ).filter(Map.is_active == True).group_by(Map.map_type).all()
        
        for map_type in map_types:
            map_stats['by_type'][map_type.map_type] = map_type.count
        
        # Download statistics
        download_stats = {
            'total': session.query(Download).count(),
            'today': session.query(Download).filter(
                func.date(Download.download_date) == datetime.date.today()
            ).count(),
            'this_week': session.query(Download).filter(
                Download.download_date >= datetime.datetime.now() - datetime.timedelta(days=7)
            ).count(),
            'this_month': session.query(Download).filter(
                Download.download_date >= datetime.datetime.now() - datetime.timedelta(days=30)
            ).count()
        }
        
        # Top downloaded maps
        top_maps = session.query(Map).filter(
            Map.is_active == True
        ).order_by(Map.download_count.desc()).limit(5).all()
        
        # Recent activity
        recent_downloads = session.query(Download).order_by(
            Download.download_date.desc()
        ).limit(10).all()
        
        session.close()
        
        return jsonify({
            'users': user_stats,
            'maps': map_stats,
            'downloads': download_stats,
            'top_maps': [
                {
                    'id': map_obj.id,
                    'name': map_obj.map_name,
                    'country': map_obj.country,
                    'download_count': map_obj.download_count
                }
                for map_obj in top_maps
            ],
            'recent_activity': [
                {
                    'download_id': download.id,
                    'user_id': download.user_id,
                    'map_id': download.map_id,
                    'date': download.download_date.isoformat() if download.download_date else None
                }
                for download in recent_downloads
            ],
            'generated_at': datetime.datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users(current_user_id):
    """Get users list with filtering and pagination"""
    try:
        session = db_config.get_session()
        
        # Filters
        active_only = request.args.get('active_only') == 'true'
        premium_only = request.args.get('premium_only') == 'true'
        search = request.args.get('search')
        
        # Pagination
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        offset = (page - 1) * per_page
        
        # Build query
        query = session.query(User)
        
        if active_only:
            query = query.filter(User.is_active == True)
        if premium_only:
            query = query.filter(User.is_premium == True)
        if search:
            query = query.filter(
                (User.username.ilike(f'%{search}%')) |
                (User.email.ilike(f'%{search}%')) |
                (User.country.ilike(f'%{search}%'))
            )
        
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(offset).limit(per_page).all()
        
        session.close()
        
        return jsonify({
            'users': [user.to_dict(include_sensitive=True) for user in users],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@admin_required
def toggle_user_status(current_user_id, user_id):
    """Toggle user active status"""
    try:
        session = db_config.get_session()
        
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            session.close()
            return jsonify({'message': 'Usuário não encontrado'}), 404
        
        # Don't allow deactivating admin
        if user.username == 'admin':
            session.close()
            return jsonify({'message': 'Não é possível desativar o usuário admin'}), 400
        
        user.is_active = not user.is_active
        session.commit()
        
        user_data = user.to_dict(include_sensitive=True)
        session.close()
        
        return jsonify({
            'message': f'Usuário {"ativado" if user.is_active else "desativado"} com sucesso',
            'user': user_data
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/users/<int:user_id>/toggle-premium', methods=['POST'])
@admin_required
def toggle_user_premium(current_user_id, user_id):
    """Toggle user premium status"""
    try:
        session = db_config.get_session()
        
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            session.close()
            return jsonify({'message': 'Usuário não encontrado'}), 404
        
        user.is_premium = not user.is_premium
        session.commit()
        
        user_data = user.to_dict(include_sensitive=True)
        session.close()
        
        return jsonify({
            'message': f'Status premium {"ativado" if user.is_premium else "desativado"} com sucesso',
            'user': user_data
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

