"""
Map routes for KingGroup backend
Handles offline maps listing, filtering, and downloads
"""
from flask import Blueprint, request, jsonify
from models.user import User
from models.map import Map
from models.download import Download
from config.database import db_config
from auth.jwt_auth import token_required, premium_required

map_bp = Blueprint('map', __name__, url_prefix='/api/maps')

@map_bp.route('/', methods=['GET'])
def get_maps():
    """List available maps with filtering"""
    try:
        session = db_config.get_session()
        
        # Optional filters
        country = request.args.get('country')
        state = request.args.get('state')
        map_type = request.args.get('type')
        premium_only = request.args.get('premium') == 'true'
        search = request.args.get('search')
        
        # Pagination
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)  # Max 100 per page
        offset = (page - 1) * per_page
        
        # Build query
        query = session.query(Map).filter(Map.is_active == True)
        
        if country:
            query = query.filter(Map.country.ilike(f'%{country}%'))
        if state:
            query = query.filter(Map.state.ilike(f'%{state}%'))
        if map_type:
            query = query.filter(Map.map_type == map_type)
        if premium_only:
            query = query.filter(Map.is_premium == True)
        if search:
            query = query.filter(
                (Map.map_name.ilike(f'%{search}%')) |
                (Map.description.ilike(f'%{search}%'))
            )
        
        # Get total count for pagination
        total = query.count()
        
        # Apply pagination and ordering
        maps = query.order_by(Map.download_count.desc()).offset(offset).limit(per_page).all()
        
        session.close()
        
        return jsonify({
            'maps': [map_obj.to_dict() for map_obj in maps],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            },
            'filters': {
                'country': country,
                'state': state,
                'type': map_type,
                'premium_only': premium_only,
                'search': search
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@map_bp.route('/<int:map_id>', methods=['GET'])
def get_map_details(map_id):
    """Get detailed information about a specific map"""
    try:
        session = db_config.get_session()
        
        map_obj = session.query(Map).filter(Map.id == map_id, Map.is_active == True).first()
        
        if not map_obj:
            session.close()
            return jsonify({'message': 'Mapa não encontrado'}), 404
        
        map_data = map_obj.to_dict()
        session.close()
        
        return jsonify({'map': map_data})
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@map_bp.route('/<int:map_id>/download', methods=['POST'])
@token_required
def download_map(current_user_id, map_id):
    """Initiate map download"""
    try:
        session = db_config.get_session()
        
        # Check if map exists
        map_obj = session.query(Map).filter(Map.id == map_id, Map.is_active == True).first()
        if not map_obj:
            session.close()
            return jsonify({'message': 'Mapa não encontrado'}), 404
        
        # Check user access (premium)
        user = session.query(User).filter(User.id == current_user_id).first()
        if map_obj.is_premium and not user.is_premium:
            session.close()
            return jsonify({
                'message': 'Acesso premium necessário',
                'upgrade_required': True
            }), 403
        
        # Get request data
        request_data = request.get_json() or {}
        
        # Register download
        download = Download(
            user_id=current_user_id,
            map_id=map_id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', ''),
            device_type=request_data.get('device_type', 'unknown'),
            platform=request_data.get('platform', 'unknown'),
            app_version=request_data.get('app_version', '1.0')
        )
        
        session.add(download)
        
        # Increment download counter
        map_obj.download_count += 1
        session.commit()
        
        result = {
            'message': 'Download autorizado',
            'download_id': download.id,
            'map': map_obj.to_dict(include_download_url=True),
            'user_downloads_today': session.query(Download).filter(
                Download.user_id == current_user_id,
                Download.download_date >= func.current_date()
            ).count()
        }
        
        session.close()
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@map_bp.route('/categories', methods=['GET'])
def get_map_categories():
    """Get available map categories and statistics"""
    try:
        session = db_config.get_session()
        
        # Get map types with counts
        from sqlalchemy import func
        categories = session.query(
            Map.map_type,
            func.count(Map.id).label('count'),
            func.count(func.nullif(Map.is_premium, False)).label('premium_count')
        ).filter(Map.is_active == True).group_by(Map.map_type).all()
        
        # Get countries with counts
        countries = session.query(
            Map.country,
            func.count(Map.id).label('count')
        ).filter(Map.is_active == True).group_by(Map.country).order_by(
            func.count(Map.id).desc()
        ).limit(10).all()
        
        session.close()
        
        return jsonify({
            'categories': [
                {
                    'type': cat.map_type,
                    'total_maps': cat.count,
                    'premium_maps': cat.premium_count
                }
                for cat in categories
            ],
            'top_countries': [
                {
                    'country': country.country,
                    'map_count': country.count
                }
                for country in countries
            ]
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@map_bp.route('/user/downloads', methods=['GET'])
@token_required
def get_user_downloads(current_user_id):
    """Get user's download history"""
    try:
        session = db_config.get_session()
        
        # Pagination
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)
        offset = (page - 1) * per_page
        
        # Get downloads with map info
        downloads = session.query(Download).filter(
            Download.user_id == current_user_id
        ).order_by(Download.download_date.desc()).offset(offset).limit(per_page).all()
        
        total = session.query(Download).filter(Download.user_id == current_user_id).count()
        
        download_list = []
        for download in downloads:
            download_data = download.to_dict(include_map_info=True)
            download_list.append(download_data)
        
        session.close()
        
        return jsonify({
            'downloads': download_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

