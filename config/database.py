"""
Database configuration for KingGroup backend
Production-ready Cloud SQL PostgreSQL integration
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Base class for all models
Base = declarative_base()

class DatabaseConfig:
    """Database configuration manager for Cloud SQL PostgreSQL"""
    
    def __init__(self):
        self.database_url = self._get_database_url()
        self.engine = None
        self.SessionLocal = None
        
    def _get_database_url(self):
        """Get database URL based on environment"""
        
        # Check if running on App Engine
        if os.getenv('GAE_ENV', '').startswith('standard'):
            # Production - Cloud SQL PostgreSQL
            db_user = os.environ.get('DB_USER', 'kinggroup_user')
            db_pass = os.environ.get('DB_PASS', 'KingGroup2025Secure!')
            db_name = os.environ.get('DB_NAME', 'kinggroup_db')
            connection_name = os.environ.get('CLOUD_SQL_CONNECTION_NAME', 
                                           'kinggrouptech-93908:us-central1:kinggroup-db')
            
            # Cloud SQL connection string for App Engine
            return f'postgresql+psycopg2://{db_user}:{db_pass}@/{db_name}?host=/cloudsql/{connection_name}'
        else:
            # Local development - use SQLite for simplicity
            return 'sqlite:///kinggroup_dev.db'
    
    def initialize(self):
        """Initialize database connection with production settings"""
        try:
            # Production-grade connection settings
            if 'postgresql' in self.database_url:
                self.engine = create_engine(
                    self.database_url,
                    echo=False,  # Set to True for SQL debugging
                    pool_size=10,
                    max_overflow=20,
                    pool_pre_ping=True,
                    pool_recycle=3600,  # Recycle connections every hour
                    connect_args={
                        "connect_timeout": 60,
                        "application_name": "KingGroup_Backend"
                    }
                )
            else:
                # SQLite for local development
                self.engine = create_engine(
                    self.database_url,
                    echo=False,
                    pool_pre_ping=True
                )
            
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            # Create all tables
            Base.metadata.create_all(bind=self.engine)
            
            print(f"✅ Database initialized successfully: {self._get_safe_url()}")
            return True
            
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            return False
    
    def _get_safe_url(self):
        """Get database URL without sensitive information for logging"""
        if 'postgresql' in self.database_url:
            return "Cloud SQL PostgreSQL (production)"
        else:
            return self.database_url
    
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

