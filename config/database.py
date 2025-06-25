"""
Database configuration for KingGroup backend
Intelligent fallback: Cloud SQL → SQLite
"""
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Base class for all models
Base = declarative_base()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConfig:
    """Intelligent database configuration with Cloud SQL fallback"""
    
    def __init__(self):
        self.database_url = None
        self.engine = None
        self.SessionLocal = None
        self.db_type = None
        self._initialize_database()
        
    def _initialize_database(self):
        """Initialize database with intelligent fallback"""
        
        # Try Cloud SQL first (production)
        if self._try_cloud_sql():
            return
            
        # Fallback to SQLite (development/backup)
        self._use_sqlite_fallback()
    
    def _try_cloud_sql(self):
        """Try to connect to Cloud SQL PostgreSQL"""
        try:
            # Check if running on App Engine with Cloud SQL config
            if os.getenv('GAE_ENV', '').startswith('standard'):
                db_user = os.environ.get('DB_USER', 'kinggroup_user')
                db_pass = os.environ.get('DB_PASS', 'KingGroup2025Secure!')
                db_name = os.environ.get('DB_NAME', 'kinggroup_db')
                connection_name = os.environ.get('CLOUD_SQL_CONNECTION_NAME', 
                    'kinggrouptech-93908:us-central1:kinggroup-db')
                
                # Cloud SQL connection string
                self.database_url = f"postgresql+psycopg2://{db_user}:{db_pass}@/{db_name}?host=/cloudsql/{connection_name}"
                
                # Test connection
                engine = create_engine(
                    self.database_url,
                    pool_size=10,
                    max_overflow=20,
                    pool_pre_ping=True,
                    pool_recycle=3600,
                    connect_args={
                        "application_name": "KingGroup_Backend",
                        "connect_timeout": 10
                    }
                )
                
                # Test connection with timeout
                connection = engine.connect()
                connection.close()
                
                self.engine = engine
                self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
                self.db_type = "cloud_sql"
                
                logger.info("✅ Cloud SQL PostgreSQL connected successfully")
                return True
                
        except Exception as e:
            logger.warning(f"⚠️ Cloud SQL connection failed: {str(e)}")
            return False
    
    def _use_sqlite_fallback(self):
        """Use SQLite as fallback database"""
        try:
            # SQLite fallback (works everywhere)
            if os.getenv('GAE_ENV', '').startswith('standard'):
                # App Engine: use in-memory SQLite
                self.database_url = "sqlite:///:memory:"
                logger.info("🔄 Using SQLite in-memory (App Engine)")
            else:
                # Local development: use file-based SQLite
                db_path = os.path.join(os.path.dirname(__file__), '..', 'kinggroup_production.db')
                self.database_url = f"sqlite:///{db_path}"
                logger.info(f"🔄 Using SQLite file: {db_path}")
            
            self.engine = create_engine(
                self.database_url,
                connect_args={"check_same_thread": False} if "sqlite" in self.database_url else {}
            )
            
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            self.db_type = "sqlite"
            
            logger.info("✅ SQLite fallback connected successfully")
            
        except Exception as e:
            logger.error(f"❌ SQLite fallback failed: {str(e)}")
            raise Exception("Database initialization failed completely")
    
    def get_database_info(self):
        """Get current database information"""
        return {
            "type": self.db_type,
            "url_masked": self.database_url.split('@')[0] + '@***' if '@' in self.database_url else self.database_url,
            "status": "connected" if self.engine else "disconnected"
        }

# Global database configuration
db_config = DatabaseConfig()

def get_db():
    """Get database session"""
    db = db_config.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database tables"""
    try:
        # Import all models to ensure they're registered
        from models.user import User
        from models.map import Map
        from models.download import Download
        
        # Create all tables
        Base.metadata.create_all(bind=db_config.engine)
        
        logger.info("✅ Database tables initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        return False

