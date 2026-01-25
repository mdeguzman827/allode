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


def convert_boolean(value):
    """
    Convert various boolean representations to Python boolean
    
    Args:
        value: Can be boolean, string, int, or None
        
    Returns:
        Python boolean or None
    """
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', 'yes', '1', 'y')
    if isinstance(value, (int, float)):
        return bool(value)
    return None


def safe_convert(value):
    """
    Safely convert any value to a database-compatible type.
    Converts lists to strings, handles None, and preserves other types.
    
    Args:
        value: Can be any type (list, dict, string, number, etc.)
        
    Returns:
        Database-compatible value (string, number, boolean, None)
    """
    if value is None:
        return None
    if isinstance(value, list):
        # Convert list to comma-separated string
        items = [str(item) for item in value if item is not None]
        return ', '.join(items) if items else None
    if isinstance(value, dict):
        # Convert dict to JSON string
        import json
        return json.dumps(value)
    # For other types (string, number, boolean), return as-is
    return value


def transform_property(raw_property: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform NWMLS API property data to normalized database format
    
    Args:
        raw_property: Raw property data from NWMLS API
        
    Returns:
        Transformed property dictionary ready for database insertion
    """
    listing_id = raw_property.get("ListingId") or raw_property.get("ListingKey") or ""
    
    # Validate that we have a listing_id (required field)
    if not listing_id:
        raise ValueError(f"Missing ListingId and ListingKey in property data: {raw_property.get('ListingId')}, {raw_property.get('ListingKey')}")
    
    # Extract media information
    media_list = raw_property.get("Media") or []
    primary_image = None
    if media_list:
        # Find preferred photo or first image
        preferred = next((m for m in media_list if m.get("PreferredPhotoYN")), None)
        primary_image = (preferred or media_list[0]).get("MediaURL")
    
    # Build transformed property
    # Always include required fields even if they might be filtered later
    transformed = {
        "id": listing_id,
        "listing_id": listing_id,  # Required field - must always be present
        "listing_key": safe_convert(raw_property.get("ListingKey")),
        "list_price": raw_property.get("ListPrice"),
        "street_number": safe_convert(raw_property.get("StreetNumber")),
        "street_name": safe_convert(raw_property.get("StreetName")),
        "city": safe_convert(raw_property.get("City")),
        "state_or_province": safe_convert(raw_property.get("StateOrProvince")),
        "postal_code": safe_convert(raw_property.get("PostalCode")),
        "unparsed_address": safe_convert(raw_property.get("UnparsedAddress")),
        "property_type": safe_convert(raw_property.get("PropertyType")),
        "property_sub_type": safe_convert(raw_property.get("PropertySubType")),
        "bedrooms_total": raw_property.get("BedroomsTotal"),
        "bathrooms_total_integer": raw_property.get("BathroomsTotalInteger"),
        "bathrooms_full": raw_property.get("BathroomsFull"),
        "bathrooms_half": raw_property.get("BathroomsHalf"),
        "living_area": raw_property.get("LivingArea"),
        "lot_size_square_feet": raw_property.get("LotSizeSquareFeet"),
        "year_built": raw_property.get("YearBuilt"),
        "standard_status": safe_convert(raw_property.get("StandardStatus")),
        "latitude": raw_property.get("Latitude"),
        "longitude": raw_property.get("Longitude"),
        "public_remarks": safe_convert(raw_property.get("PublicRemarks")),
        "private_remarks": safe_convert(raw_property.get("PrivateRemarks")),
        "list_agent_full_name": safe_convert(raw_property.get("ListAgentFullName")),
        "list_agent_email": safe_convert(raw_property.get("ListAgentEmail")),
        "list_agent_phone": safe_convert(raw_property.get("ListAgentPhone")),
        "list_date": parse_date(raw_property.get("ListDate")),
        "modification_timestamp": parse_date(raw_property.get("ModificationTimestamp")),
        "originating_system_modification_timestamp": parse_date(
            raw_property.get("OriginatingSystemModificationTimestamp")
        ),
        "media_count": len(media_list),
        "primary_image_url": primary_image,
        # Property Features
        "appliances": convert_to_string(raw_property.get("Appliances")),
        "architectural_style": convert_to_string(raw_property.get("ArchitecturalStyle")),
        "attached_garage_yn": convert_boolean(raw_property.get("AttachedGarageYN")),
        "building_name": safe_convert(raw_property.get("BuildingName")),
        "buyer_agent_full_name": safe_convert(raw_property.get("BuyerAgentFullName")),
        "buyer_office_name": safe_convert(raw_property.get("BuyerOfficeName")),
        "carport_yn": convert_boolean(raw_property.get("CarportYN")),
        "close_date": parse_date(raw_property.get("CloseDate")),
        "close_price": raw_property.get("ClosePrice"),
        "covered_spaces": raw_property.get("CoveredSpaces"),
        "cumulate_days_on_market": raw_property.get("CumulateDaysOnMarket"),
        "elementary_school": safe_convert(raw_property.get("ElementarySchool")),
        "exterior_features": convert_to_string(raw_property.get("ExteriorFeatures")),
        "fireplace_features": convert_to_string(raw_property.get("FireplaceFeatures")),
        "fireplace_yn": convert_boolean(raw_property.get("FireplaceYN")),
        "fireplaces_total": raw_property.get("FireplacesTotal"),
        "flooring": convert_to_string(raw_property.get("Flooring")),
        "foundation_details": convert_to_string(raw_property.get("FoundationDetails")),
        "furnished": safe_convert(raw_property.get("Furnished")),
        "garage_spaces": raw_property.get("GarageSpaces"),
        "garage_yn": convert_boolean(raw_property.get("GarageYN")),
        "high_school": safe_convert(raw_property.get("HighSchool")),
        "high_school_district": safe_convert(raw_property.get("HighSchoolDistrict")),
        "inclusions": convert_to_string(raw_property.get("Inclusions")),
        "interior_features": convert_to_string(raw_property.get("InteriorFeatures")),
        "levels": safe_convert(raw_property.get("Levels")),
        "listing_agent_full_name": safe_convert(raw_property.get("ListingAgentFullName")),
        "list_office_name": safe_convert(raw_property.get("ListOfficeName")),
        "list_office_phone": safe_convert(raw_property.get("ListOfficePhone")),
        "list_contract_date": parse_date(raw_property.get("ListContractDate")),
        "listing_terms": convert_to_string(raw_property.get("ListingTerms")),
        "lot_features": convert_to_string(raw_property.get("LotFeatures")),
        "lot_size_acres": raw_property.get("LotSizeAcres"),
        "lost_size_square_feet": raw_property.get("LostSizeSquareFeet"),
        "mls_status": safe_convert(raw_property.get("MlsStatus")),
        "new_construction_yn": convert_boolean(raw_property.get("NewConstructionYN")),
        "off_market_date": parse_date(raw_property.get("OffMarketDate")),
        "on_market_date": parse_date(raw_property.get("OnMarketDate")),
        "original_list_price": raw_property.get("OriginalListPrice"),
        "parcel_number": safe_convert(raw_property.get("ParcelNumber")),
        "parking_features": convert_to_string(raw_property.get("ParkingFeatures")),
        "parking_total": raw_property.get("ParkingTotal"),
        "possession": safe_convert(raw_property.get("Possession")),
        "power_production_type": safe_convert(raw_property.get("PowerProductionType")),
        "property_condition": safe_convert(raw_property.get("PropertyCondition")),
        "purchase_contract_date": parse_date(raw_property.get("PurchaseContractDate")),
        "roof": convert_to_string(raw_property.get("Roof")),
        "security_features": convert_to_string(raw_property.get("SecurityFeatures")),
        "sewer": safe_convert(raw_property.get("Sewer")),
        "source_system_name": safe_convert(raw_property.get("SourceSystemName")),
        "special_listing_conditions": convert_to_string(raw_property.get("SpecialListingConditions")),
        "subdivision_name": safe_convert(raw_property.get("SubdivisionName")),
        "tax_annual_amount": raw_property.get("TaxAnnualAmount"),
        "tax_year": raw_property.get("TaxYear"),
        "topography": convert_to_string(raw_property.get("Topography")),
        "utilities": convert_to_string(raw_property.get("Utilities")),
        "vegetation": convert_to_string(raw_property.get("Vegetation")),
        "view": convert_to_string(raw_property.get("View")),
        "water_source": safe_convert(raw_property.get("WaterSource")),
        "waterfront_yn": convert_boolean(raw_property.get("WaterfrontYN")),
        "zoning_description": safe_convert(raw_property.get("ZoningDescription")),
        # NWM specific fields
        "nwm_offers": safe_convert(raw_property.get("NWM_Offers")),
        "nwm_offers_review_date": parse_date(raw_property.get("NWM_OffersReviewDate")),
        "nwm_power_company": safe_convert(raw_property.get("NWM_PowerCompany")),
        "nwm_preliminary_title_ordered": safe_convert(raw_property.get("NWM_PreliminaryTitleOrdered")),
        "nwm_seller_disclosure": safe_convert(raw_property.get("NWM_SellerDisclosure")),
        "nwm_senior_exemption": safe_convert(raw_property.get("NWM_SeniorExemption")),
        "nwm_sewer_company": safe_convert(raw_property.get("NWM_SewerCompany")),
        "nwm_style_code": safe_convert(raw_property.get("NWM_StyleCode")),
        "nwm_water_company": safe_convert(raw_property.get("NWM_WaterCompany")),
        "nwm_water_heater_location": safe_convert(raw_property.get("NWM_WaterHeaterLocation")),
        "nwm_water_heater_type": safe_convert(raw_property.get("NWM_WaterHeaterType")),
        "nwm_appliances_included": convert_to_string(raw_property.get("NWM_AppliancesIncluded")),
        "nwm_building_information": convert_to_string(raw_property.get("NWM_BuildingInformation")),
        "nwm_site_features": convert_to_string(raw_property.get("NWM_SiteFeatures")),
        "nwm_zoning_jurisdiction": safe_convert(raw_property.get("NWM_ZoningJurisdiction")),
        "nwm_energy_source": safe_convert(raw_property.get("NWM_EnergySource")),
        # Additional system fields
        "concessions_comments": safe_convert(raw_property.get("ConcessionsComments")),
        "concessions": convert_to_string(raw_property.get("Concessions")),
        "originating_system_name": safe_convert(raw_property.get("OriginatingSystemName")),
        "mlg_can_view": convert_boolean(raw_property.get("MlgCanVeiw") or raw_property.get("MlgCanView")),
        "mlg_can_use": convert_boolean(raw_property.get("MlgCanUse")),
    }
    
    # Remove None values to avoid database issues, but always keep required fields
    required_fields = {"id", "listing_id"}  # These must always be present
    filtered = {}
    
    for k, v in transformed.items():
        # Always include required fields, even if None
        if k in required_fields:
            filtered[k] = v if v is not None else listing_id  # Fallback to listing_id for required fields
        # For other fields, only include if not None
        elif v is not None:
            filtered[k] = v
    
    # Final validation: ensure required fields are present and not empty
    if "listing_id" not in filtered or not filtered["listing_id"]:
        raise ValueError(f"listing_id is required but missing or empty. Got: {filtered.get('listing_id')}")
    if "id" not in filtered or not filtered["id"]:
        raise ValueError(f"id is required but missing or empty. Got: {filtered.get('id')}")
    
    return filtered


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


def transform_for_frontend(property_obj, media_items: Optional[List] = None) -> Dict[str, Any]:
    """
    Transform database property object to frontend-friendly format
    
    Args:
        property_obj: SQLAlchemy Property object
        media_items: Optional list of PropertyMedia objects (if None, will need to be queried separately)
        
    Returns:
        Dictionary formatted for frontend consumption
    """
    # Build images array from PropertyMedia if available, otherwise use primary_image_url
    images = []
    if media_items:
        # Sort by order to ensure correct sequence
        sorted_media = sorted(media_items, key=lambda m: m.order if m.order is not None else 999)
        for idx, media in enumerate(sorted_media):
            if media.media_url:
                # Prioritize R2 URL, fallback to backend image endpoint (Railway)
                image_url = media.r2_url if media.r2_url else f"/api/images/{property_obj.id}/{idx + 1}"
                images.append({
                    "url": image_url,
                    "order": media.order if media.order is not None else len(images),
                    "type": media.media_category or "photo",
                    "width": media.image_width,
                    "height": media.image_height,
                    "isPreferred": media.preferred_photo_yn or False
                })
    
    # Always include primary_image_url if available (either as fallback or as first image)
    # Check if primary_image_url is already in the images array
    primary_url_in_images = any(
        img.get("url") == property_obj.primary_image_url or 
        img.get("url") == property_obj.primary_image_r2_url 
        for img in images
    )
    
    if property_obj.primary_image_url and not primary_url_in_images:
        # Prioritize R2 URL, fallback to backend image endpoint (Railway)
        primary_url = property_obj.primary_image_r2_url if property_obj.primary_image_r2_url else f"/api/images/{property_obj.id}/0"
        # Insert primary image at the beginning if not already present
        images.insert(0, {
            "url": primary_url,
            "order": 0,
            "type": "photo",
            "isPreferred": True
        })
    
    # Final fallback: if still no images, use primary_image_url
    if not images and property_obj.primary_image_url:
        primary_url = property_obj.primary_image_r2_url if property_obj.primary_image_r2_url else f"/api/images/{property_obj.id}/0"
        images.append({
            "url": primary_url,
            "order": 0,
            "type": "photo",
            "isPreferred": True
        })
    
    # Helper function to format dates
    def format_date(dt):
        return dt.isoformat() if dt else None
    
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
            "status": property_obj.standard_status,
            # All additional property details
            "appliances": getattr(property_obj, 'appliances', None),
            "architecturalStyle": getattr(property_obj, 'architectural_style', None),
            "attachedGarageYN": getattr(property_obj, 'attached_garage_yn', None),
            "buildingName": getattr(property_obj, 'building_name', None),
            "buyerAgentFullName": getattr(property_obj, 'buyer_agent_full_name', None),
            "buyerOfficeName": getattr(property_obj, 'buyer_office_name', None),
            "carportYN": getattr(property_obj, 'carport_yn', None),
            "closeDate": format_date(getattr(property_obj, 'close_date', None)),
            "closePrice": getattr(property_obj, 'close_price', None),
            "coveredSpaces": getattr(property_obj, 'covered_spaces', None),
            "cumulateDaysOnMarket": getattr(property_obj, 'cumulate_days_on_market', None),
            "elementarySchool": getattr(property_obj, 'elementary_school', None),
            "exteriorFeatures": getattr(property_obj, 'exterior_features', None),
            "fireplaceFeatures": getattr(property_obj, 'fireplace_features', None),
            "fireplaceYN": getattr(property_obj, 'fireplace_yn', None),
            "fireplacesTotal": getattr(property_obj, 'fireplaces_total', None),
            "flooring": getattr(property_obj, 'flooring', None),
            "foundationDetails": getattr(property_obj, 'foundation_details', None),
            "furnished": getattr(property_obj, 'furnished', None),
            "garageSpaces": getattr(property_obj, 'garage_spaces', None),
            "garageYN": getattr(property_obj, 'garage_yn', None),
            "highSchool": getattr(property_obj, 'high_school', None),
            "highSchoolDistrict": getattr(property_obj, 'high_school_district', None),
            "inclusions": getattr(property_obj, 'inclusions', None),
            "interiorFeatures": getattr(property_obj, 'interior_features', None),
            "levels": getattr(property_obj, 'levels', None),
            "listingAgentFullName": getattr(property_obj, 'list_agent_full_name', None) or getattr(property_obj, 'listing_agent_full_name', None),
            "listOfficeName": getattr(property_obj, 'list_office_name', None),
            "listOfficePhone": getattr(property_obj, 'list_office_phone', None),
            "listContractDate": format_date(getattr(property_obj, 'list_contract_date', None)),
            "listingTerms": getattr(property_obj, 'listing_terms', None),
            "lotFeatures": getattr(property_obj, 'lot_features', None),
            "lotSizeAcres": getattr(property_obj, 'lot_size_acres', None),
            "lostSizeSquareFeet": getattr(property_obj, 'lost_size_square_feet', None),
            "mlsStatus": getattr(property_obj, 'mls_status', None),
            "newConstructionYN": getattr(property_obj, 'new_construction_yn', None),
            "offMarketDate": format_date(getattr(property_obj, 'off_market_date', None)),
            "onMarketDate": format_date(getattr(property_obj, 'on_market_date', None)),
            "originalListPrice": getattr(property_obj, 'original_list_price', None),
            "parcelNumber": getattr(property_obj, 'parcel_number', None),
            "parkingFeatures": getattr(property_obj, 'parking_features', None),
            "parkingTotal": getattr(property_obj, 'parking_total', None),
            "possession": getattr(property_obj, 'possession', None),
            "powerProductionType": getattr(property_obj, 'power_production_type', None),
            "propertyCondition": getattr(property_obj, 'property_condition', None),
            "purchaseContractDate": format_date(getattr(property_obj, 'purchase_contract_date', None)),
            "roof": getattr(property_obj, 'roof', None),
            "securityFeatures": getattr(property_obj, 'security_features', None),
            "sewer": getattr(property_obj, 'sewer', None),
            "sourceSystemName": getattr(property_obj, 'source_system_name', None),
            "specialListingConditions": getattr(property_obj, 'special_listing_conditions', None),
            "subdivisionName": getattr(property_obj, 'subdivision_name', None),
            "taxAnnualAmount": getattr(property_obj, 'tax_annual_amount', None),
            "taxYear": getattr(property_obj, 'tax_year', None),
            "topography": getattr(property_obj, 'topography', None),
            "utilities": getattr(property_obj, 'utilities', None),
            "vegetation": getattr(property_obj, 'vegetation', None),
            "view": getattr(property_obj, 'view', None),
            "waterSource": getattr(property_obj, 'water_source', None),
            "waterfrontYN": getattr(property_obj, 'waterfront_yn', None),
            "zoningDescription": getattr(property_obj, 'zoning_description', None),
            # NWM specific fields
            "nwmOffers": getattr(property_obj, 'nwm_offers', None),
            "nwmOffersReviewDate": format_date(getattr(property_obj, 'nwm_offers_review_date', None)),
            "nwmPowerCompany": getattr(property_obj, 'nwm_power_company', None),
            "nwmPreliminaryTitleOrdered": getattr(property_obj, 'nwm_preliminary_title_ordered', None),
            "nwmSellerDisclosure": getattr(property_obj, 'nwm_seller_disclosure', None),
            "nwmSeniorExemption": getattr(property_obj, 'nwm_senior_exemption', None),
            "nwmSewerCompany": getattr(property_obj, 'nwm_sewer_company', None),
            "nwmStyleCode": getattr(property_obj, 'nwm_style_code', None),
            "nwmWaterCompany": getattr(property_obj, 'nwm_water_company', None),
            "nwmWaterHeaterLocation": getattr(property_obj, 'nwm_water_heater_location', None),
            "nwmWaterHeaterType": getattr(property_obj, 'nwm_water_heater_type', None),
            "nwmAppliancesIncluded": getattr(property_obj, 'nwm_appliances_included', None),
            "nwmBuildingInformation": getattr(property_obj, 'nwm_building_information', None),
            "nwmSiteFeatures": getattr(property_obj, 'nwm_site_features', None),
            "nwmZoningJurisdiction": getattr(property_obj, 'nwm_zoning_jurisdiction', None),
            "nwmEnergySource": getattr(property_obj, 'nwm_energy_source', None),
            # Additional system fields
            "concessionsComments": getattr(property_obj, 'concessions_comments', None),
            "concessions": getattr(property_obj, 'concessions', None),
            "originatingSystemName": getattr(property_obj, 'originating_system_name', None),
            "mlgCanView": getattr(property_obj, 'mlg_can_view', None),
            "mlgCanUse": getattr(property_obj, 'mlg_can_use', None),
        },
        "images": images,
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
        "listingDate": format_date(property_obj.list_date),
        "lastUpdated": format_date(property_obj.modification_timestamp)
    }

