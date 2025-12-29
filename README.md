# Allode Real Estate Platform

A real estate platform with property search, PDF automation, and AI features. This is a test.

## Architecture

- **Frontend**: Next.js + TypeScript (to be implemented)
- **Backend**: Python FastAPI
- **Database**: SQLite (can be upgraded to PostgreSQL)
- **Data Source**: NWMLS Grid API

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Populate Database

Run the script to fetch and store the first 500 properties from NWMLS API:

```bash
python scripts/populate_database.py
```

Options:
- `--database`: Database URL (default: `sqlite:///properties.db`)
- `--limit`: Number of properties to fetch (default: 500)

Example:
```bash
python scripts/populate_database.py --limit 500
```

### 3. Start FastAPI Backend

```bash
cd backend
python main.py
```

Or using uvicorn directly:
```bash
uvicorn backend.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Get Properties (with filters)
```
GET /api/properties?page=1&page_size=20&city=Seattle&min_price=100000&max_price=1000000&bedrooms=3
```

Query Parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `city`: Filter by city
- `state`: Filter by state
- `min_price`: Minimum price
- `max_price`: Maximum price
- `bedrooms`: Number of bedrooms
- `property_type`: Property type
- `status`: Listing status

### Get Property by ID
```
GET /api/properties/{property_id}
```

### Search Properties
```
GET /api/properties/search?q=Seattle&page=1&page_size=20
```

### Get Statistics
```
GET /api/stats
```

## Database Schema

### Properties Table
- Primary key: `id` (ListingId)
- Indexed fields: `listing_id`, `city`, `state_or_province`, `list_price`, `bedrooms_total`, `living_area`, `standard_status`
- Composite indexes for common search patterns

### Property Media Table
- Stores property images/media
- Foreign key: `property_id` → `properties.id`

## Data Flow

1. **NWMLS API** → Raw JSON data
2. **Property Transformer** → Normalized format
3. **Database** → Stored with indexes
4. **FastAPI** → Search & filter with database queries
5. **Frontend** → Typed TypeScript interfaces

## Next Steps

1. Implement Next.js frontend
2. Add React Query for data fetching
3. Implement property detail pages
4. Add map integration
5. Upgrade to PostgreSQL for production
6. Add Redis caching layer
7. Implement Elasticsearch for advanced search

