"""
Transform NWMLS API data to normalized format
"""
from typing import Dict, Any, Optional, List
from datetime import datetime


def parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """Parse date string to datetime object"""
    if not date_str:
        return None
    try:
        # Handle ISO format with timezone
        if 'T' in date_str:
            date_str = date_str.split('.')[0]  # Remove microseconds
            if '+' in date_str or date_str.endswith('Z'):
                date_str = date_str.replace('Z', '').split('+')[0]
        return datetime.fromisoformat(date_str)
    except:
        return None


def convert_to_string(value):
    """
    Convert list values to comma-separated strings for database storage
    
    Args:
        value: Can be a list, string, or other type
        
    Returns:
        String representation of the value, or None if value is None/empty
    """
    if value is None:
        return None
    if isinstance(value, list):
        # Convert list to comma-separated string, filtering out empty values
        items = [str(item) for item in value if item]
        return ', '.join(items) if items else None
    return str(value) if value else None


def transform_property(raw_property: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform NWMLS API property data to normalized database format
    
    Args:
        raw_property: Raw property data from NWMLS API
        
    Returns:
        Transformed property dictionary ready for database insertion
    """
    listing_id = raw_property.get("ListingId") or raw_property.get("ListingKey", "")
    
    # Extract media information
    media_list = raw_property.get("Media") or []
    primary_image = None
    if media_list:
        # Find preferred photo or first image
        preferred = next((m for m in media_list if m.get("PreferredPhotoYN")), None)
        primary_image = (preferred or media_list[0]).get("MediaURL")
    
    # Build transformed property
    transformed = {
        "id": listing_id,
        "listing_id": listing_id,
        "listing_key": raw_property.get("ListingKey"),
        "list_price": raw_property.get("ListPrice"),
        "street_number": raw_property.get("StreetNumber"),
        "street_name": raw_property.get("StreetName"),
        "city": raw_property.get("City"),
        "state_or_province": raw_property.get("StateOrProvince"),
        "postal_code": raw_property.get("PostalCode"),
        "unparsed_address": raw_property.get("UnparsedAddress"),
        "property_type": raw_property.get("PropertyType"),
        "property_sub_type": raw_property.get("PropertySubType"),
        "bedrooms_total": raw_property.get("BedroomsTotal"),
        "bathrooms_total_integer": raw_property.get("BathroomsTotalInteger"),
        "bathrooms_full": raw_property.get("BathroomsFull"),
        "bathrooms_half": raw_property.get("BathroomsHalf"),
        "living_area": raw_property.get("LivingArea"),
        "lot_size_square_feet": raw_property.get("LotSizeSquareFeet"),
        "year_built": raw_property.get("YearBuilt"),
        "standard_status": raw_property.get("StandardStatus"),
        "latitude": raw_property.get("Latitude"),
        "longitude": raw_property.get("Longitude"),
        "public_remarks": raw_property.get("PublicRemarks"),
        "private_remarks": raw_property.get("PrivateRemarks"),
        "list_agent_full_name": raw_property.get("ListAgentFullName"),
        "list_agent_email": raw_property.get("ListAgentEmail"),
        "list_agent_phone": raw_property.get("ListAgentPhone"),
        "list_date": parse_date(raw_property.get("ListDate")),
        "modification_timestamp": parse_date(raw_property.get("ModificationTimestamp")),
        "originating_system_modification_timestamp": parse_date(
            raw_property.get("OriginatingSystemModificationTimestamp")
        ),
        "media_count": len(media_list),
        "primary_image_url": primary_image,
        "appliances": convert_to_string(raw_property.get("Appliances")),  # Convert list to string
        "architectural_style": convert_to_string(raw_property.get("ArchitecturalStyle")),  # Convert list to string
        "attached_garage_yn": raw_property.get("AttachedGarageYN"),
    }
    
    # Remove None values to avoid database issues
    return {k: v for k, v in transformed.items() if v is not None}


def transform_media(raw_property: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Transform media data for separate table
    
    Args:
        raw_property: Raw property data from NWMLS API
        
    Returns:
        List of transformed media dictionaries
    """
    media_list = raw_property.get("Media") or []
    listing_id = raw_property.get("ListingId") or raw_property.get("ListingKey", "")
    
    transformed_media = []
    for idx, media in enumerate(media_list):
        media_data = {
            "id": f"{listing_id}_{idx}",
            "property_id": listing_id,
            "media_key": media.get("MediaKey"),
            "media_url": media.get("MediaURL"),
            "order": media.get("Order", idx),
            "preferred_photo_yn": media.get("PreferredPhotoYN", False),
            "image_width": media.get("ImageWidth"),
            "image_height": media.get("ImageHeight"),
            "media_category": media.get("MediaCategory"),
        }
        # Remove None values
        transformed_media.append({k: v for k, v in media_data.items() if v is not None})
    
    return transformed_media


def transform_for_frontend(property_obj) -> Dict[str, Any]:
    """
    Transform database property object to frontend-friendly format
    
    Args:
        property_obj: SQLAlchemy Property object
        
    Returns:
        Dictionary formatted for frontend consumption
    """
    return {
        "id": property_obj.id,
        "mlsNumber": property_obj.listing_id,
        "price": property_obj.list_price,
        "address": {
            "street": f"{property_obj.street_number or ''} {property_obj.street_name or ''}".strip(),
            "city": property_obj.city,
            "state": property_obj.state_or_province,
            "zipCode": property_obj.postal_code,
            "full": property_obj.unparsed_address or f"{property_obj.street_number} {property_obj.street_name}, {property_obj.city}, {property_obj.state_or_province} {property_obj.postal_code}".strip()
        },
        "propertyDetails": {
            "type": property_obj.property_type,
            "subType": property_obj.property_sub_type,
            "bedrooms": property_obj.bedrooms_total,
            "bathrooms": property_obj.bathrooms_total_integer,
            "squareFeet": property_obj.living_area,
            "lotSize": property_obj.lot_size_square_feet,
            "yearBuilt": property_obj.year_built,
            "status": property_obj.standard_status
        },
        "images": [{
            "url": property_obj.primary_image_url,
            "order": 0,
            "type": "photo"
        }] if property_obj.primary_image_url else [],
        "description": property_obj.public_remarks,
        "coordinates": {
            "lat": property_obj.latitude,
            "lng": property_obj.longitude
        } if property_obj.latitude and property_obj.longitude else None,
        "agent": {
            "name": property_obj.list_agent_full_name,
            "email": property_obj.list_agent_email,
            "phone": property_obj.list_agent_phone
        } if property_obj.list_agent_full_name else None,
        "listingDate": property_obj.list_date.isoformat() if property_obj.list_date else None,
        "lastUpdated": property_obj.modification_timestamp.isoformat() if property_obj.modification_timestamp else None
    }

