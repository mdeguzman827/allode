# Quick Start Guide

## Architecture Overview

✅ **Database Schema** - SQLite with indexed tables for fast search
✅ **Data Transformation** - Normalizes NWMLS API data to frontend-friendly format
✅ **FastAPI Backend** - RESTful API with search, filter, and pagination
✅ **Database Population Script** - Fetches and stores first 500 properties

## Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
./setup.sh
```

This will:
1. Install all dependencies
2. Create database tables
3. Populate database with first 500 properties

### Option 2: Manual Setup

1. **Install dependencies:**
```bash
pip3 install -r requirements.txt
```

2. **Populate database:**
```bash
python3 scripts/populate_database.py --limit 500
```

3. **Start API server:**
```bash
cd backend
python3 main.py
```

Or:
```bash
uvicorn backend.main:app --reload --port 8000
```

## Testing the API

Once the server is running at `http://localhost:8000`:

### Get all properties (paginated)
```bash
curl "http://localhost:8000/api/properties?page=1&page_size=20"
```

### Filter by city and price
```bash
curl "http://localhost:8000/api/properties?city=Seattle&min_price=100000&max_price=1000000"
```

### Search properties
```bash
curl "http://localhost:8000/api/properties/search?q=Seattle&page=1"
```

### Get property by ID
```bash
curl "http://localhost:8000/api/properties/NWM1555351"
```

### Get statistics
```bash
curl "http://localhost:8000/api/stats"
```

## Project Structure

```
allode v1/
├── database/
│   ├── __init__.py
│   └── models.py          # SQLAlchemy models with indexes
├── services/
│   ├── __init__.py
│   └── property_transformer.py  # Data transformation utilities
├── scripts/
│   └── populate_database.py     # Database population script
├── backend/
│   └── main.py                  # FastAPI application
├── requirements.txt              # Python dependencies
├── setup.sh                     # Automated setup script
└── README.md                    # Full documentation
```

## Database Features

- **Indexed fields** for fast search:
  - `listing_id`, `city`, `state_or_province`
  - `list_price`, `bedrooms_total`, `living_area`
  - `standard_status`
  
- **Composite indexes** for common queries:
  - City + State
  - Price + Bedrooms
  - Status + City
  - Latitude + Longitude (for map search)

## API Response Format

Properties are returned in normalized format:

```json
{
  "properties": [
    {
      "id": "NWM1555351",
      "mlsNumber": "NWM1555351",
      "price": 824900,
      "address": {
        "street": "21717 SE 33rd Place",
        "city": "Sammamish",
        "state": "WA",
        "zipCode": "98075",
        "full": "21717 SE 33rd Place, Sammamish, WA 98075-6267"
      },
      "propertyDetails": {
        "type": "Residential",
        "bedrooms": 4,
        "bathrooms": 3,
        "squareFeet": 2310
      },
      "images": [...],
      "description": "...",
      "coordinates": { "lat": 47.6, "lng": -122.0 }
    }
  ],
  "total": 500,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

## Next Steps

1. ✅ Database populated with 500 properties
2. ✅ API server running
3. 🔄 Implement Next.js frontend
4. 🔄 Add React Query for data fetching
5. 🔄 Create property listing pages
6. 🔄 Add property detail pages
7. 🔄 Implement map integration

## Troubleshooting

**Database not found:**
- Make sure you ran `populate_database.py` first
- Check that `properties.db` exists in project root

**Import errors:**
- Run `pip3 install -r requirements.txt`
- Make sure you're in the project root directory

**API not responding:**
- Check that the server is running on port 8000
- Verify database file exists and has data

