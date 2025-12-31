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
    primary_image_url = Column(Text)  # Original NWMLS URL (keep for reference)
    
    # R2 storage fields for primary image
    primary_image_r2_key = Column(String, index=True)  # e.g., "properties/NWM123/0.jpg"
    primary_image_r2_url = Column(Text)  # Full CDN URL
    primary_image_stored_at = Column(DateTime)  # When uploaded to R2
    
    # Additional fields - Property Features
    appliances = Column(Text)
    architectural_style = Column(String)
    attached_garage_yn = Column(Boolean)
    building_name = Column(String)
    buyer_agent_full_name = Column(String)
    buyer_office_name = Column(String)
    carport_yn = Column(Boolean)
    close_date = Column(DateTime)
    close_price = Column(Integer)
    covered_spaces = Column(Integer)
    cumulate_days_on_market = Column(Integer)
    elementary_school = Column(String)
    exterior_features = Column(Text)
    fireplace_features = Column(Text)
    fireplace_yn = Column(Boolean)
    fireplaces_total = Column(Integer)
    flooring = Column(Text)
    foundation_details = Column(Text)
    furnished = Column(String)
    garage_spaces = Column(Integer)
    garage_yn = Column(Boolean)
    high_school = Column(String)
    high_school_district = Column(String)
    inclusions = Column(Text)
    interior_features = Column(Text)
    levels = Column(String)
    listing_agent_full_name = Column(String)
    list_office_name = Column(String)
    list_office_phone = Column(String)
    list_contract_date = Column(DateTime)
    listing_terms = Column(Text)
    lot_features = Column(Text)
    lot_size_acres = Column(Float)
    lost_size_square_feet = Column(Float)
    mls_status = Column(String)
    new_construction_yn = Column(Boolean)
    off_market_date = Column(DateTime)
    on_market_date = Column(DateTime)
    original_list_price = Column(Integer)
    parcel_number = Column(String)
    parking_features = Column(Text)
    parking_total = Column(Integer)
    possession = Column(String)
    power_production_type = Column(String)
    property_condition = Column(String)
    purchase_contract_date = Column(DateTime)
    roof = Column(Text)
    security_features = Column(Text)
    sewer = Column(String)
    source_system_name = Column(String)
    special_listing_conditions = Column(Text)
    subdivision_name = Column(String)
    tax_annual_amount = Column(Float)
    tax_year = Column(Integer)
    topography = Column(Text)
    utilities = Column(Text)
    vegetation = Column(Text)
    view = Column(Text)
    water_source = Column(String)
    waterfront_yn = Column(Boolean)
    zoning_description = Column(Text)
    
    # NWM specific fields
    nwm_offers = Column(String)
    nwm_offers_review_date = Column(DateTime)
    nwm_power_company = Column(String)
    nwm_preliminary_title_ordered = Column(String)
    nwm_seller_disclosure = Column(String)
    nwm_senior_exemption = Column(String)
    nwm_sewer_company = Column(String)
    nwm_style_code = Column(String)
    nwm_water_company = Column(String)
    nwm_water_heater_location = Column(String)
    nwm_water_heater_type = Column(String)
    nwm_appliances_included = Column(Text)
    nwm_building_information = Column(Text)
    nwm_site_features = Column(Text)
    nwm_zoning_jurisdiction = Column(String)
    nwm_energy_source = Column(String)
    
    # Additional system fields
    concessions_comments = Column(Text)
    concessions = Column(Text)
    originating_system_name = Column(String)
    mlg_can_view = Column(Boolean)
    mlg_can_use = Column(Boolean)
    
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
    media_url = Column(Text)  # Original NWMLS URL (keep for reference)
    
    # R2 storage fields
    r2_key = Column(String, index=True)  # e.g., "properties/NWM123/1.jpg"
    r2_url = Column(Text)  # Full CDN URL
    stored_at = Column(DateTime)  # When uploaded to R2
    file_size = Column(Integer)  # Size in bytes
    content_type = Column(String)  # e.g., "image/jpeg" or "image/webp"
    
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

