#!/usr/bin/env python3
"""
Test script to verify database initialization
"""
import sqlite3
import os

def test_database():
    """Test if database can be created and initialized"""
    try:
        print("🔍 Testing database initialization...")
        
        # Test database connection
        DATABASE = 'kinggroup.db'
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Test table creation
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS test_table (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )
        ''')
        
        # Test insert
        cursor.execute("INSERT INTO test_table (name) VALUES (?)", ("test",))
        
        # Test select
        cursor.execute("SELECT * FROM test_table")
        result = cursor.fetchall()
        
        conn.commit()
        conn.close()
        
        print("✅ Database test successful!")
        print(f"📊 Test result: {result}")
        
        # Clean up
        if os.path.exists(DATABASE):
            os.remove(DATABASE)
            print("🧹 Test database cleaned up")
            
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_database()

