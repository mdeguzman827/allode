#!/bin/bash

# Setup script for Allode Real Estate Platform

echo "=========================================="
echo "Allode Platform Setup"
echo "=========================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Install dependencies
echo ""
echo "Installing dependencies..."
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "✗ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p database
mkdir -p services
mkdir -p scripts
mkdir -p backend

echo "✓ Directories created"

# Populate database
echo ""
echo "Populating database with first 500 properties..."
python3 scripts/populate_database.py --limit 500

if [ $? -ne 0 ]; then
    echo "✗ Failed to populate database"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "To start the API server, run:"
echo "  cd backend && python3 main.py"
echo ""
echo "Or:"
echo "  uvicorn backend.main:app --reload --port 8000"
echo ""

