"""
Map model for KingGroup backend
Handles offline maps and truck stop data
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from sqlalchemy.sql import func
from config.database import Base

class Map(Base):
    """Map model for offline maps management"""
    
    __tablename__ = 'maps'
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Location fields
    country = Column(String(50), nullable=False, index=True)
    state = Column(String(50), index=True)
    city = Column(String(100), index=True)
    region = Column(String(100))  # Additional region info
    
    # Map details
    map_type = Column(String(50), nullable=False, index=True)  # 'offline', 'truck_stops', 'routes'
    map_name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # File information
    file_size = Column(Integer)  # Size in bytes
    file_format = Column(String(20))  # 'gpx', 'kml', 'osm', etc.
    download_url = Column(String(500))
    file_hash = Column(String(64))  # SHA256 hash for integrity
    
    # Coordinates (for map bounds)
    lat_min = Column(Float)
    lat_max = Column(Float)
    lng_min = Column(Float)
    lng_max = Column(Float)
    
    # Status and access
    is_premium = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    download_count = Column(Integer, default=0)
    
    # Version control
    version = Column(String(20), default='1.0')
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional metadata
    tags = Column(String(500))  # Comma-separated tags
    difficulty_level = Column(String(20))  # 'easy', 'medium', 'hard'
    estimated_download_time = Column(Integer)  # Minutes for average connection
    
    def __init__(self, **kwargs):
        """Initialize map with provided data"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self, include_download_url=False):
        """Convert map to dictionary for API responses"""
        map_dict = {
            'id': self.id,
            'country': self.country,
            'state': self.state,
            'city': self.city,
            'region': self.region,
            'map_type': self.map_type,
            'map_name': self.map_name,
            'description': self.description,
            'file_size': self.file_size,
            'file_format': self.file_format,
            'is_premium': self.is_premium,
            'is_active': self.is_active,
            'download_count': self.download_count,
            'version': self.version,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'tags': self.tags.split(',') if self.tags else [],
            'difficulty_level': self.difficulty_level,
            'estimated_download_time': self.estimated_download_time,
            'bounds': {
                'lat_min': self.lat_min,
                'lat_max': self.lat_max,
                'lng_min': self.lng_min,
                'lng_max': self.lng_max
            } if all([self.lat_min, self.lat_max, self.lng_min, self.lng_max]) else None
        }
        
        if include_download_url:
            map_dict['download_url'] = self.download_url
            map_dict['file_hash'] = self.file_hash
            
        return map_dict
    
    def increment_download_count(self):
        """Increment download counter"""
        self.download_count += 1
    
    def __repr__(self):
        return f"<Map {self.map_name} ({self.country}/{self.state})>"

    @classmethod
    def create_sample_maps(cls):
        """Create sample maps for testing"""
        sample_maps = [
            cls(
                country='Brazil',
                state='São Paulo',
                city='São Paulo',
                map_type='offline',
                map_name='São Paulo Offline Map',
                description='Complete offline map of São Paulo metropolitan area',
                file_size=45000000,  # 45MB
                file_format='osm',
                is_premium=False,
                tags='urban,metropolitan,truck-friendly',
                difficulty_level='medium',
                estimated_download_time=5
            ),
            cls(
                country='Brazil',
                state='Rio de Janeiro',
                city='Rio de Janeiro',
                map_type='truck_stops',
                map_name='Rio Truck Stops',
                description='Truck stops and service areas in Rio de Janeiro',
                file_size=2500000,  # 2.5MB
                file_format='gpx',
                is_premium=True,
                tags='truck-stops,services,fuel',
                difficulty_level='easy',
                estimated_download_time=1
            )
        ]
        return sample_maps

