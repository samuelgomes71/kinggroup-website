#!/usr/bin/env python3
"""
Database Initialization Script for KingGroup Backend
Creates tables and populates with initial data for Cloud SQL PostgreSQL
"""
import os
import sys
from datetime import datetime
from werkzeug.security import generate_password_hash

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.database import db_config, Base
from models.user import User
from models.map import Map
from models.download import Download

def init_database():
    """Initialize database with tables and sample data"""
    print("🗄️ Initializing KingGroup Database...")
    
    try:
        # Initialize database connection
        if not db_config.initialize():
            print("❌ Failed to initialize database connection")
            return False
        
        print("✅ Database connection established")
        
        # Create all tables
        Base.metadata.create_all(bind=db_config.engine)
        print("✅ Database tables created")
        
        # Get database session
        session = db_config.get_session()
        
        try:
            # Check if admin user already exists
            admin_user = session.query(User).filter_by(email='admin@kinggrouptech.com').first()
            
            if not admin_user:
                # Create admin user
                admin_user = User(
                    username='admin',
                    email='admin@kinggrouptech.com',
                    password='KingGroupAdmin2025!',
                    is_premium=True,
                    is_admin=True
                )
                session.add(admin_user)
                print("✅ Admin user created")
            else:
                print("ℹ️ Admin user already exists")
            
            # Check if sample maps exist
            sample_map = session.query(Map).filter_by(map_name='Brasil Completo').first()
            
            if not sample_map:
                # Create sample maps
                maps_data = [
                    {
                        'country': 'Brasil',
                        'map_type': 'offline',
                        'map_name': 'Brasil Completo',
                        'description': 'Mapa completo do Brasil com todas as rodovias',
                        'file_size': 2500000000,  # 2.5GB
                        'file_format': 'osm',
                        'is_premium': False
                    },
                    {
                        'country': 'América do Sul',
                        'map_type': 'offline',
                        'map_name': 'América do Sul',
                        'description': 'Mapa completo da América do Sul',
                        'file_size': 4200000000,  # 4.2GB
                        'file_format': 'osm',
                        'is_premium': True
                    },
                    {
                        'country': 'Europa',
                        'map_type': 'offline',
                        'map_name': 'Europa Completa',
                        'description': 'Mapa detalhado da Europa',
                        'file_size': 3800000000,  # 3.8GB
                        'file_format': 'osm',
                        'is_premium': True
                    }
                ]
                
                for map_data in maps_data:
                    new_map = Map(**map_data)
                    session.add(new_map)
                
                print("✅ Sample maps created")
            else:
                print("ℹ️ Sample maps already exist")
            
            # Commit all changes
            session.commit()
            print("✅ Database initialization completed successfully")
            
            # Print summary
            user_count = session.query(User).count()
            map_count = session.query(Map).count()
            download_count = session.query(Download).count()
            
            print(f"\n📊 Database Summary:")
            print(f"   👥 Users: {user_count}")
            print(f"   🗺️ Maps: {map_count}")
            print(f"   📥 Downloads: {download_count}")
            
            return True
            
        except Exception as e:
            session.rollback()
            print(f"❌ Error during data initialization: {e}")
            return False
        finally:
            session.close()
            
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def check_database_status():
    """Check database connection and status"""
    print("🔍 Checking database status...")
    
    try:
        if not db_config.initialize():
            print("❌ Database connection failed")
            return False
        
        session = db_config.get_session()
        
        try:
            # Test queries
            user_count = session.query(User).count()
            map_count = session.query(Map).count()
            
            print(f"✅ Database connection successful")
            print(f"   Database type: {'PostgreSQL' if 'postgresql' in db_config.database_url else 'SQLite'}")
            print(f"   Users: {user_count}")
            print(f"   Maps: {map_count}")
            
            return True
            
        except Exception as e:
            print(f"❌ Database query failed: {e}")
            return False
        finally:
            session.close()
            
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        return False

if __name__ == '__main__':
    print("🚀 KingGroup Database Initialization")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == 'check':
        # Just check database status
        success = check_database_status()
    else:
        # Full initialization
        success = init_database()
    
    print("=" * 50)
    if success:
        print("🎉 Operation completed successfully!")
        sys.exit(0)
    else:
        print("💥 Operation failed!")
        sys.exit(1)

