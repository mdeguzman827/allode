"""
Database models for property storage
"""
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, Boolean, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()


class Property(Base):
    """Property model for storing real estate listings"""
    __tablename__ = 'properties'

    # Primary key
    id = Column(String, primary_key=True)  # Using ListingId as primary key
    
    # Basic identifiers
    listing_id = Column(String, unique=True, nullable=False, index=True)
    listing_key = Column(String, index=True)
    
    # Pricing
    list_price = Column(Integer, index=True)
    
    # Address components
    street_number = Column(String)
    street_name = Column(String)
    city = Column(String, index=True)
    state_or_province = Column(String, index=True)
    postal_code = Column(String, index=True)
    unparsed_address = Column(Text)
    
    # Property details
    property_type = Column(String, index=True)
    property_sub_type = Column(String)
    bedrooms_total = Column(Integer, index=True)
    bathrooms_total_integer = Column(Integer, index=True)
    bathrooms_full = Column(Integer)
    bathrooms_half = Column(Integer)
    living_area = Column(Integer, index=True)
    lot_size_square_feet = Column(Float)
    year_built = Column(Integer)
    standard_status = Column(String, index=True)
    
    # Location (for geospatial search)
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Description
    public_remarks = Column(Text)
    private_remarks = Column(Text)
    
    # Agent information
    list_agent_full_name = Column(String)
    list_agent_email = Column(String)
    list_agent_phone = Column(String)
    
    # Dates
    list_date = Column(DateTime)
    modification_timestamp = Column(DateTime)
    originating_system_modification_timestamp = Column(DateTime)
    
    # Media count (stored separately, full media in separate table)
    media_count = Column(Integer, default=0)
    primary_image_url = Column(Text)
    
    # Additional fields
    appliances = Column(Text)
    architectural_style = Column(String)
    attached_garage_yn = Column(Boolean)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Composite indexes for common search patterns
    __table_args__ = (
        Index('idx_city_state', 'city', 'state_or_province'),
        Index('idx_price_bedrooms', 'list_price', 'bedrooms_total'),
        Index('idx_status_city', 'standard_status', 'city'),
        Index('idx_location', 'latitude', 'longitude'),
    )


class PropertyMedia(Base):
    """Property media/images model"""
    __tablename__ = 'property_media'

    id = Column(String, primary_key=True)
    property_id = Column(String, nullable=False, index=True)  # Foreign key to properties.id
    media_key = Column(String)
    media_url = Column(Text)
    order = Column(Integer, default=0)
    preferred_photo_yn = Column(Boolean, default=False)
    image_width = Column(Integer)
    image_height = Column(Integer)
    media_category = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_engine(database_url: str = "sqlite:///properties.db"):
    """Create database engine"""
    return create_engine(database_url, echo=False)


def get_session(engine):
    """Create database session"""
    Session = sessionmaker(bind=engine)
    return Session()


def init_database(database_url: str = "sqlite:///properties.db"):
    """Initialize database and create tables"""
    engine = get_engine(database_url)
    Base.metadata.create_all(engine)
    return engine

