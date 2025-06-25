"""
Download tracking model for KingGroup backend
Tracks user downloads and analytics
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base

class Download(Base):
    """Download tracking model"""
    
    __tablename__ = 'downloads'
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    map_id = Column(Integer, ForeignKey('maps.id'), nullable=False, index=True)
    
    # Download details
    download_date = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(String(500))
    
    # Download status
    status = Column(String(20), default='completed')  # 'started', 'completed', 'failed', 'cancelled'
    download_size = Column(Integer)  # Actual downloaded bytes
    download_time = Column(Float)  # Download time in seconds
    
    # Location info (optional)
    country_code = Column(String(2))
    city = Column(String(100))
    
    # Device info
    device_type = Column(String(50))  # 'mobile', 'tablet', 'desktop'
    platform = Column(String(50))  # 'android', 'ios', 'web'
    app_version = Column(String(20))
    
    # Quality metrics
    connection_speed = Column(Float)  # Mbps
    success_rate = Column(Float)  # Percentage of successful download
    
    # Timestamps
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", backref="downloads")
    map = relationship("Map", backref="downloads")
    
    def __init__(self, user_id, map_id, **kwargs):
        """Initialize download record"""
        self.user_id = user_id
        self.map_id = map_id
        self.started_at = func.now()
        
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def mark_completed(self, download_size=None, download_time=None):
        """Mark download as completed"""
        self.status = 'completed'
        self.completed_at = func.now()
        if download_size:
            self.download_size = download_size
        if download_time:
            self.download_time = download_time
            
        # Calculate success rate
        if self.download_size and hasattr(self.map, 'file_size') and self.map.file_size:
            self.success_rate = min(100.0, (self.download_size / self.map.file_size) * 100)
    
    def mark_failed(self, reason=None):
        """Mark download as failed"""
        self.status = 'failed'
        self.completed_at = func.now()
        if reason:
            self.notes = reason
    
    def calculate_speed(self):
        """Calculate download speed in Mbps"""
        if self.download_time and self.download_size:
            # Convert bytes to megabits and calculate speed
            megabits = (self.download_size * 8) / 1_000_000
            return megabits / self.download_time
        return None
    
    def to_dict(self, include_user_info=False, include_map_info=False):
        """Convert download to dictionary for API responses"""
        download_dict = {
            'id': self.id,
            'user_id': self.user_id,
            'map_id': self.map_id,
            'download_date': self.download_date.isoformat() if self.download_date else None,
            'status': self.status,
            'download_size': self.download_size,
            'download_time': self.download_time,
            'connection_speed': self.connection_speed,
            'success_rate': self.success_rate,
            'device_type': self.device_type,
            'platform': self.platform,
            'app_version': self.app_version,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
        
        if include_user_info and self.user:
            download_dict['user'] = {
                'username': self.user.username,
                'email': self.user.email,
                'country': self.user.country
            }
            
        if include_map_info and self.map:
            download_dict['map'] = {
                'map_name': self.map.map_name,
                'map_type': self.map.map_type,
                'country': self.map.country,
                'state': self.map.state
            }
            
        return download_dict
    
    def __repr__(self):
        return f"<Download {self.id} - User:{self.user_id} Map:{self.map_id} ({self.status})>"

    @classmethod
    def get_user_downloads(cls, session, user_id, limit=50):
        """Get recent downloads for a user"""
        return session.query(cls).filter(
            cls.user_id == user_id
        ).order_by(cls.download_date.desc()).limit(limit).all()
    
    @classmethod
    def get_popular_maps(cls, session, limit=10):
        """Get most downloaded maps"""
        from sqlalchemy import func
        return session.query(
            cls.map_id,
            func.count(cls.id).label('download_count')
        ).group_by(cls.map_id).order_by(
            func.count(cls.id).desc()
        ).limit(limit).all()

