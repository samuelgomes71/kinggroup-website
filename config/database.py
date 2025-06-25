"""
Database configuration for KingGroup backend
Temporary version using SQLite for App Engine compatibility
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Base class for all models
Base = declarative_base()

class DatabaseConfig:
    """Database configuration manager"""
    
    def __init__(self):
        self.database_url = self._get_database_url()
        self.engine = None
        self.SessionLocal = None
        
    def _get_database_url(self):
        """Get database URL based on environment"""
        
        # TEMPORARY: Use SQLite for both local and App Engine
        # This ensures the modular architecture works in production
        if os.getenv('GAE_ENV', '').startswith('standard'):
            # App Engine - use in-memory SQLite (temporary)
            return 'sqlite:///:memory:'
        else:
            # Local development
            return 'sqlite:///kinggroup_dev.db'
    
    def initialize(self):
        """Initialize database connection"""
        try:
            self.engine = create_engine(
                self.database_url,
                echo=False,  # Set to True for SQL debugging
                pool_pre_ping=True
            )
            
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            # Create all tables
            Base.metadata.create_all(bind=self.engine)
            
            print(f"✅ Database initialized successfully: {self.database_url}")
            return True
            
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            return False
    
    def get_session(self):
        """Get database session"""
        if not self.SessionLocal:
            self.initialize()
        return self.SessionLocal()

# Global database configuration
db_config = DatabaseConfig()

def get_db():
    """Dependency to get database session"""
    db = db_config.get_session()
    try:
        yield db
    finally:
        db.close()

