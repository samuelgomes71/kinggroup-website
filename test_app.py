#!/usr/bin/env python3
"""
Minimal Flask app test to isolate the issue
"""
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/', methods=['GET'])
def test_root():
    """Test root endpoint"""
    return jsonify({
        'message': 'MINIMAL TEST APP WORKING!',
        'status': 'success',
        'test': True
    })

@app.route('/health', methods=['GET'])
def test_health():
    """Test health endpoint"""
    return jsonify({
        'status': 'healthy',
        'test': 'minimal_app'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)

