"""
Database configuration for KingGroup backend
Supports both Cloud SQL (production) and local development
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
        
        # Check if running on App Engine
        if os.getenv('GAE_ENV', '').startswith('standard'):
            # Production - Cloud SQL
            db_user = os.environ.get('DB_USER', 'kinggroup')
            db_pass = os.environ.get('DB_PASS', 'KingGroup2025!')
            db_name = os.environ.get('DB_NAME', 'kinggroup_db')
            connection_name = os.environ.get('CLOUD_SQL_CONNECTION_NAME', 
                                           'kinggrouptech-93908:us-central1:kinggroup-db')
            
            return f"postgresql+psycopg2://{db_user}:{db_pass}@/{db_name}?host=/cloudsql/{connection_name}"
        
        else:
            # Development - Local PostgreSQL or SQLite fallback
            local_db_url = os.environ.get('DATABASE_URL')
            if local_db_url:
                return local_db_url
            else:
                # Fallback to SQLite for local development
                return "sqlite:///kinggroup_dev.db"
    
    def initialize_database(self):
        """Initialize database connection and create tables"""
        try:
            # Create engine
            if self.database_url.startswith('postgresql'):
                # PostgreSQL configuration
                self.engine = create_engine(
                    self.database_url,
                    pool_size=5,
                    max_overflow=10,
                    pool_pre_ping=True,
                    pool_recycle=300
                )
            else:
                # SQLite configuration (development only)
                self.engine = create_engine(
                    self.database_url,
                    connect_args={"check_same_thread": False}
                )
            
            # Create session factory
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            # Create all tables
            Base.metadata.create_all(bind=self.engine)
            
            print(f"✅ Database initialized successfully: {self.database_url.split('@')[0]}@***")
            return True
            
        except Exception as e:
            print(f"❌ Database initialization failed: {str(e)}")
            return False
    
    def get_session(self):
        """Get database session"""
        if self.SessionLocal is None:
            raise Exception("Database not initialized. Call initialize_database() first.")
        return self.SessionLocal()
    
    def close_connection(self):
        """Close database connection"""
        if self.engine:
            self.engine.dispose()

# Global database instance
db_config = DatabaseConfig()

def get_db():
    """Dependency to get database session"""
    db = db_config.get_session()
    try:
        yield db
    finally:
        db.close()

