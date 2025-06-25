"""
User model for KingGroup backend
Modern SQLAlchemy implementation with best practices
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from config.database import Base
from werkzeug.security import generate_password_hash, check_password_hash

class User(Base):
    """User model with enhanced features"""
    
    __tablename__ = 'users'
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Authentication fields
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile fields
    country = Column(String(50))
    region = Column(String(100))
    invite_code = Column(String(20), unique=True, index=True)
    license_expires = Column(String(20))  # ISO date format
    
    # Status fields
    is_active = Column(Boolean, default=True, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Additional fields for enhanced functionality
    profile_image = Column(String(255))  # URL to profile image
    phone = Column(String(20))
    company = Column(String(100))
    notes = Column(Text)  # Admin notes
    
    def __init__(self, username, email, password, **kwargs):
        """Initialize user with password hashing"""
        self.username = username
        self.email = email
        self.set_password(password)
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary for API responses"""
        user_dict = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'country': self.country,
            'region': self.region,
            'invite_code': self.invite_code,
            'license_expires': self.license_expires,
            'is_active': self.is_active,
            'is_premium': self.is_premium,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'profile_image': self.profile_image,
            'phone': self.phone,
            'company': self.company
        }
        
        if include_sensitive:
            user_dict['notes'] = self.notes
            
        return user_dict
    
    def __repr__(self):
        return f"<User {self.username} ({self.email})>"

    @classmethod
    def create_admin_user(cls):
        """Create default admin user"""
        return cls(
            username='admin',
            email='admin@kinggrouptech.com',
            password='KIN(1903)nik',
            country='Brazil',
            region='São Paulo',
            is_premium=True,
            company='KingGroup Tech'
        )

