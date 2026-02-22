"""
FastAPI backend for property search API
"""
from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, nullslast, func
import requests
from datetime import datetime, timedelta

import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
# Explicitly look in backend directory first, then project root as fallback
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)

# Try backend/.env first (preferred location)
backend_env = os.path.join(backend_dir, '.env')
if os.path.exists(backend_env):
    load_dotenv(dotenv_path=backend_env)
    print(f"✓ Loaded environment variables from: {backend_env}")
else:
    # Fallback to project root .env
    root_env = os.path.join(project_root, '.env')
    if os.path.exists(root_env):
        load_dotenv(dotenv_path=root_env)
        print(f"✓ Loaded environment variables from: {root_env}")
    else:
        # Last resort: try default load_dotenv() behavior
        load_dotenv()
        print("⚠️  No .env file found in backend/ or project root")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import get_engine, get_session, Property, PropertyMedia, AppMetadata, init_database
from services.property_transformer import transform_for_frontend, _normalize_address
from scripts.populate_database import populate_database
from services.r2_storage import R2Storage
from services.image_processor import ImageProcessor

# In-memory image cache: {cache_key: (image_data, content_type, expires_at)}
image_cache = {}
CACHE_DURATION_HOURS = 24  # Cache images for 24 hours

LAST_POPULATE_RUN_FILE = os.path.join(backend_dir, "last_populate_run.txt")


def _read_last_populate_run(db: Session) -> Optional[str]:
    """Read the date/time of the last populate_database run from DB, then file fallback."""
    row = db.query(AppMetadata).filter_by(key="last_populate_run").first()
    if row and row.value:
        return row.value.strip()
    try:
        if os.path.exists(LAST_POPULATE_RUN_FILE):
            with open(LAST_POPULATE_RUN_FILE) as f:
                return f.read().strip() or None
    except OSError:
        pass
    return None

# Initialize R2 storage and image processor (will fail gracefully if not configured)
try:
    r2_storage = R2Storage()
    image_processor = ImageProcessor()
    R2_ENABLED = True
    print("✓ R2 storage initialized successfully")
except (ValueError, Exception) as e:
    print(f"⚠️  Warning: R2 storage not configured: {str(e)}")
    print("   Make sure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and")
    print("   CLOUDFLARE_R2_SECRET_ACCESS_KEY are set in backend/.env")
    r2_storage = None
    image_processor = None
    R2_ENABLED = False

app = FastAPI(title="Allode Property API", version="1.0.0")

# CORS middleware for Next.js frontend
# Get allowed origins from environment variable, fallback to localhost for development
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup if they don't exist"""
    try:
        # Get database URL from environment variable
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            # Fallback to SQLite for local development
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            database_url = f"sqlite:///{os.path.join(project_root, 'properties.db')}"
        else:
            # Railway/Heroku provide postgres:// but SQLAlchemy needs postgresql://
            if database_url.startswith("postgres://"):
                database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        # Initialize database (creates tables if they don't exist)
        init_database(database_url)
        print("✓ Database tables initialized successfully")
    except Exception as e:
        # Log error but don't crash the app - tables might already exist
        print(f"⚠️  Database initialization warning: {e}")
        print("   (This is normal if tables already exist)")


# Database dependency
def get_db():
    """Get database session"""
    # Get database URL from environment variable, fallback to SQLite for local development
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        # Fallback to SQLite for local development
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        database_url = f"sqlite:///{os.path.join(project_root, 'properties.db')}"
    else:
        # Railway/Heroku provide postgres:// but SQLAlchemy needs postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    engine = get_engine(database_url)
    session = get_session(engine)
    try:
        yield session
    finally:
        session.close()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Allode Property API",
        "version": "1.0.0",
        "endpoints": {
            "properties": "/api/properties",
            "property_by_id": "/api/properties/{property_id}",
            "autocomplete": "/api/autocomplete",
            "search": "/api/properties/search"
        }
    }


@app.post("/api/admin/populate")
async def populate_database_endpoint(
    limit: Optional[int] = Query(None, ge=1, description="Number of properties to populate (omit for no limit)"),
    clear: bool = Query(False, description="Clear existing data before populating")
):
    """
    Admin endpoint to populate the database with properties from NWMLS API.
    This endpoint runs inside Railway's environment and can access the internal database.
    
    Parameters:
    - limit: Optional cap on number of properties (omit to transform and insert all)
    - clear: If True, deletes all existing properties and media before populating
    
    Note: This is an admin endpoint. Consider adding authentication in production.
    """
    try:
        # Get database URL from environment (same logic as get_db)
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            database_url = f"sqlite:///{os.path.join(project_root, 'properties.db')}"
        else:
            # Railway/Heroku provide postgres:// but SQLAlchemy needs postgresql://
            if database_url.startswith("postgres://"):
                database_url = database_url.replace("postgres://", "postgresql://", 1)
        
        # Clear existing data if requested
        if clear:
            engine = get_engine(database_url)
            session = get_session(engine)
            try:
                # Get counts before deletion
                old_property_count = session.query(Property).count()
                old_media_count = session.query(PropertyMedia).count()
                
                # Delete media first (due to foreign key constraints)
                deleted_media = session.query(PropertyMedia).delete()
                # Delete properties
                deleted_properties = session.query(Property).delete()
                session.commit()
                
                print(f"✓ Cleared {old_property_count} properties and {old_media_count} media items")
            except Exception as clear_error:
                session.rollback()
                raise HTTPException(
                    status_code=500,
                    detail=f"Error clearing database: {str(clear_error)}"
                )
            finally:
                session.close()
        
        # Call populate function (runs synchronously)
        # Output will be logged to Railway logs
        populate_database(database_url=database_url, limit=limit)
        
        # Get final counts to return
        engine = get_engine(database_url)
        session = get_session(engine)
        try:
            property_count = session.query(Property).count()
            media_count = session.query(PropertyMedia).count()
        finally:
            session.close()
        
        message = f"Database populated successfully with {property_count} properties" if limit is None else f"Database populated successfully with up to {limit} properties"
        if clear:
            message = f"Database cleared and repopulated with {property_count} properties" if limit is None else f"Database cleared and repopulated with up to {limit} properties"
        
        return {
            "success": True,
            "message": message,
            "properties_inserted": property_count,
            "media_items": media_count,
            "limit_requested": limit,
            "cleared": clear
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error populating database: {str(e)}"
        )


@app.get("/api/properties")
async def get_properties(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("price_desc", description="Sort by: price_asc, price_desc, sqft_desc, lot_size_desc, beds_desc, baths_desc"),
    address: Optional[str] = Query(None, description="Filter by address"),
    listing_id: Optional[str] = Query(None, description="Filter by listing ID"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    zipcode: Optional[str] = Query(None, description="Filter by zip code"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price"),
    bedrooms: Optional[int] = Query(None, ge=0, description="Number of bedrooms"),
    bathrooms: Optional[int] = Query(None, ge=0, description="Number of bathrooms"),
    home_type: Optional[str] = Query(None, description="Home type: Single Family, Multi Family, Condo, Land, Manufactured, Other"),
    status: Optional[str] = Query(None, description="Listing status"),
    internet_address_display: Optional[bool] = Query(None, description="Filter by internet address display (true/false)"),
    db: Session = Depends(get_db)
):
    """
    Get properties with pagination and filters
    
    Supports filtering by:
    - address
    - listing_id
    - city
    - state
    - zipcode
    - min_price, max_price
    - bedrooms, bathrooms
    - home_type
    - status
    - internet_address_display
    """
    try:
        # Build query
        query = db.query(Property)
        
        # Apply filters
        if address:
            query = query.filter(Property.unparsed_address.ilike(f"%{address}%"))
        if listing_id:
            query = query.filter(Property.listing_id.ilike(f"%{listing_id}%"))
        if city:
            query = query.filter(Property.city.ilike(f"%{city}%"))
        if state:
            query = query.filter(Property.state_or_province.ilike(f"%{state}%"))
        if zipcode:
            query = query.filter(Property.postal_code.ilike(f"%{zipcode}%"))
        if min_price:
            query = query.filter(Property.list_price >= min_price)
        if max_price:
            query = query.filter(Property.list_price <= max_price)
        if bedrooms:
            query = query.filter(Property.bedrooms_total >= bedrooms)
        if bathrooms:
            query = query.filter(Property.bathrooms_total_integer >= bathrooms)
        if home_type:
            home_type_list = [ht.strip() for ht in home_type.split(',') if ht.strip()]
            if home_type_list:
                home_type_conditions = [
                    func.lower(Property.home_type) == func.lower(ht) for ht in home_type_list
                ]
                query = query.filter(or_(*home_type_conditions))
        if status:
            # Filter by derived status column (For Sale, Pending, Sold); case-insensitive
            status_list = [s.strip() for s in status.split(',') if s.strip()]
            if status_list:
                status_conditions = [
                    func.lower(Property.status) == func.lower(s) for s in status_list
                ]
                query = query.filter(or_(*status_conditions))
        if internet_address_display is not None:
            query = query.filter(Property.internet_address_display_yn == internet_address_display)

        
        # Get total count (before applying sorting)
        total = query.count()
        
        # Apply sorting - normalize the sort_by parameter
        sort_by_normalized = sort_by.lower().strip() if sort_by else "price_desc"
        
        if sort_by_normalized == "price_asc":
            query = query.order_by(nullslast(Property.list_price.asc()))
        elif sort_by_normalized == "price_desc":
            query = query.order_by(nullslast(Property.list_price.desc()))
        elif sort_by_normalized == "sqft_desc":
            query = query.order_by(nullslast(Property.living_area.desc()))
        elif sort_by_normalized == "lot_size_desc":
            query = query.order_by(nullslast(Property.lot_size_square_feet.desc()))
        elif sort_by_normalized == "beds_desc":
            query = query.order_by(nullslast(Property.bedrooms_total.desc()))
        elif sort_by_normalized == "baths_desc":
            query = query.order_by(nullslast(Property.bathrooms_total_integer.desc()))
        else:
            # Default to price_desc if invalid sort_by
            query = query.order_by(nullslast(Property.list_price.desc()))
        
        # Apply pagination
        offset = (page - 1) * page_size
        properties = query.offset(offset).limit(page_size).all()
        
        # Transform for frontend
        transformed_properties = [transform_for_frontend(prop) for prop in properties]
        
        return {
            "properties": transformed_properties,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "hasMore": offset + page_size < total,
            "totalPages": (total + page_size - 1) // page_size
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching properties: {str(e)}")


@app.get("/api/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=20, description="Max results"),
    db: Session = Depends(get_db)
):
    """
    Smart autocomplete that prioritizes:
    - Cities if query starts with letters (e.g., "Sea" → "Seattle", "Seatac")
    - Addresses and zip codes if query starts with numbers (e.g., "9810" → "98101" zip code and "9810 Spring St" address)
    
    Uses prefix matching for better relevance (starts with query, not contains)
    """
    try:
        q_trimmed = q.strip()
        if not q_trimmed:
            return {"suggestions": []}
        
        # Detect query type: starts with number = address/zip, starts with letter = city
        query_starts_with_number = q_trimmed[0].isdigit()
        
        suggestions = []
        
        # Use prefix matching for better relevance (starts with, not contains)
        prefix_term = f"{q_trimmed}%"
        contains_term = f"%{q_trimmed}%"
        
        if query_starts_with_number:
            # Check if it looks like a zip code (all digits, 5 or fewer chars)
            is_potential_zip = q_trimmed.isdigit() and len(q_trimmed) <= 5
            
            if is_potential_zip:
                # Prioritize zip codes first
                zip_limit = max(3, limit // 2)
                zip_query = db.query(
                    Property.postal_code,
                    Property.city,
                    Property.state_or_province,
                    func.count(Property.id).label('count')
                ).filter(
                    and_(
                        Property.postal_code.isnot(None),
                        Property.postal_code.ilike(prefix_term)
                    )
                ).group_by(Property.postal_code, Property.city, Property.state_or_province).limit(zip_limit).all()
                
                for postal_code, city, state, count in zip_query:
                    if postal_code:
                        suggestions.append({
                            "type": "zipcode",
                            "value": postal_code,
                            "zipCode": postal_code,
                            "city": city or "",
                            "state": state or "",
                            "count": count,
                            "display": f"{postal_code} - {city}, {state} ({count} properties)" if city else f"{postal_code} ({count} properties)",
                            "relevance": "prefix"
                        })
            
            # Then addresses - get prefix matches
            address_limit = limit - len(suggestions) if is_potential_zip else limit
            address_prefix_query = db.query(
                Property.unparsed_address,
                Property.city,
                Property.state_or_province,
                Property.id
            ).filter(
                and_(
                    Property.unparsed_address.ilike(prefix_term),
                    Property.street_number.isnot(None),
                    Property.city.isnot(None)
                )
            ).group_by(
                Property.unparsed_address,
                Property.city,
                Property.state_or_province,
                Property.id
            ).limit(address_limit).all()
            
            for unparsed_address, city, state, prop_id in address_prefix_query:
                if unparsed_address:
                    addr = _normalize_address(unparsed_address)
                    suggestions.append({
                        "type": "address",
                        "value": addr,
                        "city": city or "",
                        "state": state or "",
                        "propertyId": prop_id,
                        "display": addr,
                        "relevance": "prefix"
                    })
            
            # Contains matches (lower relevance) if we need more results
            if len(suggestions) < limit:
                prefix_addresses = {addr[0] for addr in address_prefix_query if addr[0]}
                
                address_contains_query = db.query(
                    Property.unparsed_address,
                    Property.city,
                    Property.state_or_province,
                    Property.id
                ).filter(
                    and_(
                        Property.unparsed_address.ilike(contains_term),
                        Property.street_number.isnot(None),
                        Property.city.isnot(None)
                    )
                ).group_by(
                    Property.unparsed_address,
                    Property.city,
                    Property.state_or_province,
                    Property.id
                ).limit((limit - len(suggestions)) * 2).all()
                
                address_contains_query = [
                    addr for addr in address_contains_query 
                    if addr[0] and addr[0] not in prefix_addresses
                ][:limit - len(suggestions)]
                
                for unparsed_address, city, state, prop_id in address_contains_query:
                    if unparsed_address:
                        addr = _normalize_address(unparsed_address)
                        suggestions.append({
                            "type": "address",
                            "value": addr,
                            "city": city or "",
                            "state": state or "",
                            "propertyId": prop_id,
                            "display": addr,
                            "relevance": "contains"
                        })
        
        else:
            # Prioritize states - get prefix/contains matches (e.g. "Wa" or "WA" → Washington)
            state_prefix_query = db.query(
                Property.state_or_province,
                func.count(Property.id).label('count')
            ).filter(
                Property.state_or_province.isnot(None),
                Property.state_or_province.ilike(prefix_term)
            ).group_by(Property.state_or_province).limit(max(3, limit // 2)).all()

            for state_val, count in state_prefix_query:
                if state_val:
                    suggestions.append({
                        "type": "state",
                        "value": state_val,
                        "city": "",
                        "state": state_val,
                        "count": count,
                        "display": f"{state_val} ({count} properties)",
                        "relevance": "prefix"
                    })

            if len(suggestions) < limit:
                state_prefix_set = {s[0] for s in state_prefix_query if s[0]}
                state_contains_query = db.query(
                    Property.state_or_province,
                    func.count(Property.id).label('count')
                ).filter(
                    Property.state_or_province.isnot(None),
                    Property.state_or_province.ilike(contains_term)
                ).group_by(Property.state_or_province).limit((limit - len(suggestions)) * 2).all()
                state_contains_query = [
                    (s, c) for s, c in state_contains_query
                    if s and s not in state_prefix_set
                ][:limit - len(suggestions)]
                for state_val, count in state_contains_query:
                    if state_val:
                        suggestions.append({
                            "type": "state",
                            "value": state_val,
                            "city": "",
                            "state": state_val,
                            "count": count,
                            "display": f"{state_val} ({count} properties)",
                            "relevance": "contains"
                        })

            # Then cities - get prefix matches first
            city_prefix_query = db.query(
                Property.city,
                Property.state_or_province,
                func.count(Property.id).label('count')
            ).filter(
                and_(
                    Property.city.isnot(None),
                    Property.city.ilike(prefix_term)
                )
            ).group_by(Property.city, Property.state_or_province).limit(limit).all()
            
            for city, state, count in city_prefix_query:
                if city:
                    suggestions.append({
                        "type": "city",
                        "value": f"{city}, {state}" if state else city,
                        "city": city,
                        "state": state or "",
                        "count": count,
                        "display": f"{city}, {state} ({count} properties)" if state else f"{city} ({count} properties)",
                        "relevance": "prefix"
                    })
            
            # Contains matches for cities if we need more
            if len(suggestions) < limit:
                prefix_cities = {(city[0], city[1]) for city in city_prefix_query if city[0]}
                
                city_contains_query = db.query(
                    Property.city,
                    Property.state_or_province,
                    func.count(Property.id).label('count')
                ).filter(
                    and_(
                        Property.city.isnot(None),
                        Property.city.ilike(contains_term)
                    )
                ).group_by(Property.city, Property.state_or_province).limit((limit - len(suggestions)) * 2).all()
                
                city_contains_query = [
                    city for city in city_contains_query 
                    if city[0] and (city[0], city[1]) not in prefix_cities
                ][:limit - len(suggestions)]
                
                for city, state, count in city_contains_query:
                    if city:
                        suggestions.append({
                            "type": "city",
                            "value": f"{city}, {state}" if state else city,
                            "city": city,
                            "state": state or "",
                            "count": count,
                            "display": f"{city}, {state} ({count} properties)" if state else f"{city} ({count} properties)",
                            "relevance": "contains"
                        })
            
            # Add addresses as secondary (fewer results)
            address_limit = max(1, limit // 3)
            address_query = db.query(
                Property.unparsed_address,
                Property.city,
                Property.state_or_province,
                Property.id
            ).filter(
                and_(
                    Property.unparsed_address.ilike(prefix_term),
                    Property.street_number.isnot(None),
                    Property.city.isnot(None)
                )
            ).group_by(
                Property.unparsed_address,
                Property.city,
                Property.state_or_province,
                Property.id
            ).limit(address_limit).all()
            
            for unparsed_address, city, state, prop_id in address_query:
                if unparsed_address:
                    addr = _normalize_address(unparsed_address)
                    suggestions.append({
                        "type": "address",
                        "value": addr,
                        "city": city or "",
                        "state": state or "",
                        "propertyId": prop_id,
                        "display": addr,
                        "relevance": "prefix"
                    })
        
        # Sort by relevance (prefix first), then by type priority, then by count descending (most results first), then alphabetically
        type_priority = {"zipcode": 0, "address": 1, "city": 2, "state": 3} if query_starts_with_number else {"state": 0, "city": 1, "address": 2, "zipcode": 3}
        suggestions = sorted(
            suggestions,
            key=lambda x: (
                x.get("relevance") != "prefix",  # Prefix matches first
                type_priority.get(x["type"], 3),  # Primary type first based on query
                -x.get("count", 1),  # Most results first (address has 1 per row)
                x["display"].lower()
            )
        )[:limit]
        
        return {"suggestions": suggestions}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching autocomplete: {str(e)}")


@app.get("/api/properties/{property_id}")
async def get_property_by_id(
    property_id: str,
    db: Session = Depends(get_db)
):
    """Get a single property by ID with all media images"""
    try:
        property_obj = db.query(Property).filter_by(id=property_id).first()
        
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Query all media items for this property
        media_items = db.query(PropertyMedia).filter_by(
            property_id=property_id
        ).order_by(PropertyMedia.order).all()
        
        result = transform_for_frontend(property_obj, media_items)
        result["lastPopulateRun"] = _read_last_populate_run(db)
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching property: {str(e)}")


@app.post("/api/properties/{property_id}/process-images")
async def process_property_images(
    property_id: str,
    force: bool = Query(False, description="Force reprocess even if already stored"),
    db: Session = Depends(get_db)
):
    """
    Trigger background processing of property images.
    Downloads from NWMLS and uploads to R2.
    """
    if not R2_ENABLED or not image_processor:
        raise HTTPException(
            status_code=503,
            detail="R2 storage not configured. Please configure Cloudflare R2 credentials."
        )
    
    try:
        results = image_processor.process_property_images(
            property_id=property_id,
            db=db,
            force_reprocess=force
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing images: {str(e)}"
        )


@app.get("/api/images/{property_id}/{image_index}")
async def get_property_image(
    property_id: str,
    image_index: int,
    db: Session = Depends(get_db)
):
    """
    Get property image URL (R2 CDN or fallback to original).
    Returns JSON with image URL instead of redirecting.
    Falls back to proxying from NWMLS if not yet stored in R2.
    """
    try:
        property_obj = db.query(Property).filter_by(id=property_id).first()
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        r2_key = None
        r2_url = None
        fallback_url = None
        
        # Get R2 key based on image index
        if image_index == 0:
            # Primary image
            r2_key = property_obj.primary_image_r2_key
            r2_url = property_obj.primary_image_r2_url
            fallback_url = property_obj.primary_image_url
        else:
            # Media images
            media_items = db.query(PropertyMedia).filter_by(
                property_id=property_id
            ).order_by(PropertyMedia.order).all()
            
            # Filter out primary image duplicates
            primary_url = property_obj.primary_image_url
            filtered_media = [
                m for m in media_items 
                if m.media_url and m.media_url != primary_url
            ]
            
            media_index = image_index - 1
            if media_index < len(filtered_media):
                media_item = filtered_media[media_index]
                r2_key = media_item.r2_key
                r2_url = media_item.r2_url
                fallback_url = media_item.media_url
        
        # If stored in R2, return R2 URL in JSON response
        if r2_key and r2_url and R2_ENABLED:
            return {
                "url": r2_url,
                "source": "r2",
                "property_id": property_id,
                "image_index": image_index
            }
        
        # If R2 URL not available, return fallback URL
        if fallback_url:
            # Return fallback URL (frontend can use this directly)
            return {
                "url": fallback_url,
                "source": "original",
                "property_id": property_id,
                "image_index": image_index
            }
        
        # No image found
        raise HTTPException(status_code=404, detail="Image not found")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching image: {str(e)}")


# @app.get("/api/properties/search")
# async def search_properties(
#     q: str = Query(..., min_length=1, description="Search query"),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(20, ge=1, le=100),
#     db: Session = Depends(get_db)
# ):
#     """
#     Full-text search across properties
    
#     Searches in:
#     - Address (street, city, state, zip)
#     - Property description
#     - Listing ID
#     """
#     try:
#         query = db.query(Property)
        
#         # Build search conditions
#         search_term = f"%{q}%"
#         conditions = or_(
#             Property.unparsed_address.ilike(search_term),
#             Property.city.ilike(search_term),
#             Property.state_or_province.ilike(search_term),
#             Property.postal_code.ilike(search_term),
#             Property.public_remarks.ilike(search_term),
#             Property.listing_id.ilike(search_term),
#             Property.street_name.ilike(search_term)
#         )
        
#         query = query.filter(conditions)
        
#         # Get total
#         total = query.count()
        
#         # Apply pagination - handle None prices in ordering (put them last)
#         offset = (page - 1) * page_size
#         properties = query.order_by(
#             nullslast(Property.list_price.desc())
#         ).offset(offset).limit(page_size).all()
        
#         # Transform
#         transformed_properties = [transform_for_frontend(prop) for prop in properties]
        
#         return {
#             "properties": transformed_properties,
#             "total": total,
#             "page": page,
#             "pageSize": page_size,
#             "hasMore": offset + page_size < total,
#             "query": q
#         }
    
#     except Exception as e:
#         import traceback
#         error_details = traceback.format_exc()
#         print(f"Full error traceback:\n{error_details}")  # Print to console for debugging
#         raise HTTPException(status_code=500, detail=f"Error searching properties: {str(e)}")


# @app.get("/api/stats")
# async def get_stats(db: Session = Depends(get_db)):
#     """Get database statistics"""
#     try:
#         total_properties = db.query(Property).count()
#         total_by_city = db.query(Property.city, db.func.count(Property.id)).group_by(Property.city).all()
#         avg_price = db.query(db.func.avg(Property.list_price)).scalar()
#         min_price = db.query(db.func.min(Property.list_price)).scalar()
#         max_price = db.query(db.func.max(Property.list_price)).scalar()
        
#         return {
#             "totalProperties": total_properties,
#             "averagePrice": round(avg_price, 2) if avg_price else None,
#             "minPrice": min_price,
#             "maxPrice": max_price,
#             "propertiesByCity": {city: count for city, count in total_by_city[:10]}  # Top 10 cities
#         }
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

