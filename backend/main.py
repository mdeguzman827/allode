"""
FastAPI backend for property search API
"""
from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, nullslast

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import get_engine, get_session, Property
from services.property_transformer import transform_for_frontend

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
            "search": "/api/properties/search"
        }
    }


@app.get("/api/properties")
async def get_properties(
    # page: int = Query(1, ge=1, description="Page number"),
    # page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    address: Optional[str] = Query(None, description="Filter by address"),
    listing_id: Optional[str] = Query(None, description="Filter by listing ID"),
    # city: Optional[str] = Query(None, description="Filter by city"),
    # state: Optional[str] = Query(None, description="Filter by state"),
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
    """
    try:
        # Build query
        query = db.query(Property)
        
        # Apply filters
        if address:
            query = query.filter(Property.unparsed_address.ilike(f"%{address}%"))
        if listing_id:
            query = query.filter(Property.listing_id.ilike(f"%{listing_id}%"))
        # if city:
        #     query = query.filter(Property.city.ilike(f"%{city}%"))
        # if state:
        #     query = query.filter(Property.state_or_province.ilike(f"%{state}%"))
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


# @app.get("/api/properties/{property_id}")
# async def get_property_by_id(
#     property_id: str,
#     db: Session = Depends(get_db)
# ):
#     """Get a single property by ID"""
#     try:
#         property_obj = db.query(Property).filter_by(id=property_id).first()
        
#         if not property_obj:
#             raise HTTPException(status_code=404, detail="Property not found")
        
#         return transform_for_frontend(property_obj)
    
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching property: {str(e)}")


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

