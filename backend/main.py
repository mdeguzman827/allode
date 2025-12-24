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
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import get_engine, get_session, Property, PropertyMedia
from services.property_transformer import transform_for_frontend

# In-memory image cache: {cache_key: (image_data, content_type, expires_at)}
image_cache = {}
CACHE_DURATION_HOURS = 24  # Cache images for 24 hours

app = FastAPI(title="Allode Property API", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    """Get database session"""
    # Use absolute path relative to project root
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    database_url = f"sqlite:///{os.path.join(project_root, 'properties.db')}"
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


@app.get("/api/properties")
async def get_properties(
    # page: int = Query(1, ge=1, description="Page number"),
    # page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    address: Optional[str] = Query(None, description="Filter by address"),
    listing_id: Optional[str] = Query(None, description="Filter by listing ID"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    zipcode: Optional[str] = Query(None, description="Filter by zip code"),
    # min_price: Optional[int] = Query(None, ge=0, description="Minimum price"),
    # max_price: Optional[int] = Query(None, ge=0, description="Maximum price"),
    # bedrooms: Optional[int] = Query(None, ge=0, description="Number of bedrooms"),
    # property_type: Optional[str] = Query(None, description="Property type"),
    # status: Optional[str] = Query(None, description="Listing status"),
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
        # if min_price:
        #     query = query.filter(Property.list_price >= min_price)
        # if max_price:
        #     query = query.filter(Property.list_price <= max_price)
        # if bedrooms:
        #     query = query.filter(Property.bedrooms_total == bedrooms)
        # if property_type:
        #     query = query.filter(Property.property_type.ilike(f"%{property_type}%"))
        # if status:
        #     query = query.filter(Property.standard_status.ilike(f"%{status}%"))

        
        # Get total count
        total = query.count()
        
        # Apply pagination
        page = 1 # default page
        page_size = 20 # default page size
        offset = (page - 1) * page_size
        # Handle None prices in ordering (put them last)
        properties = query.order_by(
            nullslast(Property.list_price.desc())
        ).offset(offset).limit(page_size).all()
        
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
            ).group_by(Property.unparsed_address).limit(address_limit).all()
            
            for unparsed_address, city, state, prop_id in address_prefix_query:
                if unparsed_address:
                    suggestions.append({
                        "type": "address",
                        "value": unparsed_address,
                        "city": city or "",
                        "state": state or "",
                        "propertyId": prop_id,
                        "display": unparsed_address,
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
                ).group_by(Property.unparsed_address).limit((limit - len(suggestions)) * 2).all()
                
                address_contains_query = [
                    addr for addr in address_contains_query 
                    if addr[0] and addr[0] not in prefix_addresses
                ][:limit - len(suggestions)]
                
                for unparsed_address, city, state, prop_id in address_contains_query:
                    if unparsed_address:
                        suggestions.append({
                            "type": "address",
                            "value": unparsed_address,
                            "city": city or "",
                            "state": state or "",
                            "propertyId": prop_id,
                            "display": unparsed_address,
                            "relevance": "contains"
                        })
        
        else:
            # Prioritize cities - get prefix matches first
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
            ).group_by(Property.unparsed_address).limit(address_limit).all()
            
            for unparsed_address, city, state, prop_id in address_query:
                if unparsed_address:
                    suggestions.append({
                        "type": "address",
                        "value": unparsed_address,
                        "city": city or "",
                        "state": state or "",
                        "propertyId": prop_id,
                        "display": unparsed_address,
                        "relevance": "prefix"
                    })
        
        # Sort by relevance (prefix first, then contains), then by type priority, then alphabetically
        type_priority = {"zipcode": 0, "address": 1, "city": 2} if query_starts_with_number else {"city": 0, "address": 1, "zipcode": 2}
        suggestions = sorted(
            suggestions,
            key=lambda x: (
                x.get("relevance") != "prefix",  # Prefix matches first
                type_priority.get(x["type"], 3),  # Primary type first based on query
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
        
        return transform_for_frontend(property_obj, media_items)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching property: {str(e)}")


@app.get("/api/images/{property_id}/{image_index}")
async def get_property_image(
    property_id: str,
    image_index: int,
    db: Session = Depends(get_db)
):
    """
    Proxy endpoint for property images with caching.
    Fetches images from NWMLS API and caches them to avoid 429 errors on refresh.
    """
    try:
        # Check cache first
        cache_key = f"{property_id}_{image_index}"
        if cache_key in image_cache:
            cached_data, content_type, expires_at = image_cache[cache_key]
            if datetime.now() < expires_at:
                return Response(content=cached_data, media_type=content_type)
            else:
                # Cache expired, remove it
                del image_cache[cache_key]

        # Query PropertyMedia table and Property table
        media_items = db.query(PropertyMedia).filter_by(
            property_id=property_id
        ).order_by(PropertyMedia.order).all()
        
        property_obj = db.query(Property).filter_by(id=property_id).first()
        
        image_url = None
        
        # Image index mapping matches transform_for_frontend:
        # Index 0 = primary_image_url (always first)
        # Index 1+ = PropertyMedia entries (excluding any that match primary_image_url)
        if image_index == 0:
            # Index 0 is always the primary image
            if property_obj and property_obj.primary_image_url:
                image_url = property_obj.primary_image_url
        elif image_index > 0 and media_items:
            # Filter out PropertyMedia entries that match primary_image_url (to avoid duplicates)
            primary_url = property_obj.primary_image_url if property_obj else None
            filtered_media = [m for m in media_items if m.media_url and m.media_url != primary_url]
            
            # Index 1+ maps to filtered PropertyMedia entries
            media_index = image_index - 1
            if media_index < len(filtered_media):
                media_item = filtered_media[media_index]
                if media_item.media_url:
                    image_url = media_item.media_url
        
        if not image_url:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Fetch image from original URL
        try:
            response = requests.get(image_url, timeout=10, stream=True)
            response.raise_for_status()
            
            image_data = response.content
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            
            # Cache the image
            expires_at = datetime.now() + timedelta(hours=CACHE_DURATION_HOURS)
            image_cache[cache_key] = (image_data, content_type, expires_at)
            
            return Response(content=image_data, media_type=content_type)
            
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch image: {str(e)}")
    
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

