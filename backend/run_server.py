#!/usr/bin/env python3
"""
EduRAG Backend Server Startup Script
"""
import os
import sys

# Get the absolute path to the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Backend directory: {backend_dir}")

# Add the backend directory to Python path
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
    print(f"Added {backend_dir} to Python path")

# Now try to import the main application
try:
    print("Importing main module...")
    from main import app
    print("✓ Main module imported successfully")
    
    print("Importing uvicorn...")
    import uvicorn
    print("✓ Uvicorn imported successfully")
    
    print("\n" + "="*60)
    print("🚀 EduRAG Backend Server Starting...")
    print(f"📍 Server URL: http://localhost:8000")
    print(f"📍 API Docs: http://localhost:8000/docs")
    print("="*60)
    
    # Start the server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=True
    )
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("\nDebugging information:")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path[:3]}...")  # Show first 3 entries
    print(f"Backend directory exists: {os.path.exists(backend_dir)}")
    print(f"main.py exists: {os.path.exists(os.path.join(backend_dir, 'main.py'))}")
    
    # List files in backend directory
    if os.path.exists(backend_dir):
        print(f"Files in {backend_dir}:")
        for f in os.listdir(backend_dir)[:10]:  # Show first 10 files
            print(f"  - {f}")
    
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Error starting server: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)