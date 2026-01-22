"""
Background job to download images from NWMLS and upload to R2
"""
import time
import requests
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from services.r2_storage import R2Storage
from database.models import Property, PropertyMedia


class ImageProcessor:
    """Process and store property images"""
    
    def __init__(self, rate_limiter=None):
        self.rate_limiter = rate_limiter
        try:
            self.r2_storage = R2Storage()
        except ValueError as e:
            # R2 not configured, will fail gracefully
            self.r2_storage = None
            print(f"Warning: R2 storage not configured: {str(e)}")
    
    def process_property_images(
        self,
        property_id: str,
        db: Session,
        force_reprocess: bool = False
    ) -> dict:
        """
        Download images from NWMLS and upload to R2
        
        Args:
            property_id: Property ID
            db: Database session
            force_reprocess: Re-download even if already stored
            
        Returns:
            dict with processing results
        """
        if not self.r2_storage:
            return {"error": "R2 storage not configured"}
        
        property_obj = db.query(Property).filter_by(id=property_id).first()
        if not property_obj:
            return {"error": "Property not found"}
        
        results = {
            "property_id": property_id,
            "primary_image": None,
            "media_images": [],
            "errors": []
        }
        
        # Process primary image
        if property_obj.primary_image_url:
            # Check if already stored
            if not force_reprocess and property_obj.primary_image_r2_key:
                results["primary_image"] = {
                    "status": "already_stored",
                    "r2_key": property_obj.primary_image_r2_key
                }
            else:
                try:
                    result = self._download_and_store(
                        property_obj.primary_image_url,
                        property_id,
                        0
                    )
                    if result:
                        # Update property record
                        property_obj.primary_image_r2_key = result["r2_key"]
                        property_obj.primary_image_r2_url = result["r2_url"]
                        property_obj.primary_image_stored_at = datetime.utcnow()
                        db.commit()
                        
                        results["primary_image"] = result
                except Exception as e:
                    error_msg = f"Failed to process primary image: {str(e)}"
                    results["errors"].append(error_msg)
                    print(error_msg)
        
        # Process media images
        media_items = db.query(PropertyMedia).filter_by(
            property_id=property_id
        ).order_by(PropertyMedia.order).all()
        
        # Use a separate counter that only increments when images are actually processed
        media_image_index = 1  # Start from 1 (0 is primary)
        
        for idx, media_item in enumerate(media_items):
            if not media_item.media_url:
                continue
            
            # Check if already stored
            if not force_reprocess and media_item.r2_key:
                results["media_images"].append({
                    "status": "already_stored",
                    "r2_key": media_item.r2_key,
                    "order": media_item.order
                })
                continue
            
            try:
                # Skip if this is the same as primary image
                if media_item.media_url == property_obj.primary_image_url:
                    continue
                
                result = self._download_and_store(
                    media_item.media_url,
                    property_id,
                    media_image_index  # Use counter that only increments when processed
                )
                
                if result:
                    # Update media record
                    media_item.r2_key = result["r2_key"]
                    media_item.r2_url = result["r2_url"]
                    media_item.stored_at = datetime.utcnow()
                    media_item.file_size = result["file_size"]
                    media_item.content_type = result["content_type"]
                    db.commit()
                    
                    results["media_images"].append({
                        **result,
                        "order": media_item.order
                    })
                    
                    # Increment counter only after successfully processing an image
                    media_image_index += 1
                    
            except Exception as e:
                error_msg = f"Failed to process media image {idx}: {str(e)}"
                results["errors"].append(error_msg)
                print(error_msg)
        
        return results
    
    def _download_and_store(
        self,
        source_url: str,
        property_id: str,
        image_index: int
    ) -> Optional[dict]:
        """
        Download image from source URL and upload to R2
        
        Args:
            source_url: Original image URL (from NWMLS)
            property_id: Property ID
            image_index: Image index
            
        Returns:
            dict with r2_key, r2_url, file_size, content_type
        """
        try:
            if self.rate_limiter:
                self.rate_limiter.wait()
            
            # Download from NWMLS
            response = requests.get(
                source_url,
                timeout=(10, 30),  # 10s connect, 30s read
                headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; Allode/1.0)'
                },
                stream=True
            )
            response.raise_for_status()
            
            # Get content type
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            
            # Read image data
            image_data = response.content
            
            # Upload to R2
            result = self.r2_storage.upload_image(
                image_data=image_data,
                property_id=property_id,
                image_index=image_index,
                content_type=content_type,
                optimize=True  # Enable optimization
            )
            
            return result
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to download image: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to store image: {str(e)}")

