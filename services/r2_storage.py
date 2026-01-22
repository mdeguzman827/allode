"""
Cloudflare R2 storage service for property images
"""
import boto3
from botocore.exceptions import ClientError
from typing import Optional
import os
from io import BytesIO

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class R2Storage:
    """Service for uploading and managing images in Cloudflare R2"""
    
    def __init__(self):
        # Get credentials from environment variables
        self.account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        self.access_key_id = os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
        self.secret_access_key = os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("CLOUDFLARE_R2_BUCKET_NAME", "property-images")
        self.cdn_domain = os.getenv("CLOUDFLARE_R2_CDN_DOMAIN")  # Optional custom domain
        
        if not all([self.account_id, self.access_key_id, self.secret_access_key]):
            raise ValueError("Missing Cloudflare R2 credentials in environment variables")
        
        # Create S3-compatible client for R2
        self.s3_client = boto3.client(
            's3',
            endpoint_url=f'https://{self.account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            region_name='auto'  # R2 doesn't use regions
        )
    
    def upload_image(
        self,
        image_data: bytes,
        property_id: str,
        image_index: int,
        content_type: str = "image/jpeg",
        optimize: bool = True
    ) -> dict:
        """
        Upload image to R2 and return storage info
        
        Args:
            image_data: Raw image bytes
            property_id: Property ID (e.g., "NWM123")
            image_index: Image index (0, 1, 2, ...)
            content_type: MIME type (e.g., "image/jpeg")
            optimize: Whether to optimize image (optional)
            
        Returns:
            dict with r2_key, r2_url, file_size, content_type
        """
        try:
            # Optimize image if requested and PIL is available
            if optimize and PIL_AVAILABLE and content_type.startswith("image/"):
                try:
                    image_data = self._optimize_image(image_data, content_type)
                    content_type = "image/webp"  # Convert to WebP if possible
                    file_ext = "webp"
                except Exception as e:
                    print(f"Image optimization failed, using original: {str(e)}")
                    file_ext = content_type.split("/")[1] if "/" in content_type else "jpg"
            else:
                file_ext = content_type.split("/")[1] if "/" in content_type else "jpg"
            
            # Generate R2 key (path in bucket)
            r2_key = f"properties/{property_id}/{image_index}.{file_ext}"
            
            # Upload to R2
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=r2_key,
                Body=image_data,
                ContentType=content_type,
                CacheControl="public, max-age=31536000",  # Cache for 1 year
                Metadata={
                    "property-id": property_id,
                    "image-index": str(image_index)
                }
            )
            
            # Generate CDN URL
            if self.cdn_domain:
                r2_url = f"https://{self.cdn_domain}/{r2_key}"
            else:
                # Use R2 public URL (requires public access to be enabled)
                r2_url = f"https://{self.account_id}.r2.cloudflarestorage.com/{self.bucket_name}/{r2_key}"
            
            return {
                "r2_key": r2_key,
                "r2_url": r2_url,
                "file_size": len(image_data),
                "content_type": content_type
            }
            
        except ClientError as e:
            raise Exception(f"Failed to upload image to R2: {str(e)}")
    
    def download_image(self, r2_key: str) -> Optional[bytes]:
        """
        Download image from R2
        
        Args:
            r2_key: R2 object key (e.g., "properties/NWM123/0.jpg")
            
        Returns:
            Image bytes or None if not found
        """
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=r2_key
            )
            return response['Body'].read()
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return None
            raise Exception(f"Failed to download image from R2: {str(e)}")
    
    def delete_image(self, r2_key: str) -> bool:
        """Delete image from R2"""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=r2_key
            )
            return True
        except ClientError as e:
            print(f"Failed to delete image from R2: {str(e)}")
            return False
    
    def image_exists(self, r2_key: str) -> bool:
        """
        Check if an image exists in R2 storage
        
        Args:
            r2_key: R2 object key (e.g., "properties/NWM123/0.webp")
            
        Returns:
            True if image exists, False otherwise
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=r2_key
            )
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404' or e.response['Error']['Code'] == 'NoSuchKey':
                return False
            # For other errors, assume it doesn't exist to be safe
            return False
    
    def _optimize_image(self, image_data: bytes, content_type: str) -> bytes:
        """
        Optimize image (resize, compress, convert to WebP)
        Optional: Only if you want automatic optimization
        """
        if not PIL_AVAILABLE:
            return image_data
            
        try:
            img = Image.open(BytesIO(image_data))
            
            # Convert RGBA to RGB for JPEG compatibility
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Resize if too large (max 2000px on longest side)
            max_size = 2000
            if max(img.size) > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Convert to WebP for better compression
            output = BytesIO()
            img.save(output, format='WEBP', quality=85, optimize=True)
            return output.getvalue()
            
        except Exception as e:
            print(f"Image optimization failed, using original: {str(e)}")
            return image_data  # Return original if optimization fails
    
    def get_public_url(self, r2_key: str) -> str:
        """Get public CDN URL for an R2 key"""
        if self.cdn_domain:
            return f"https://{self.cdn_domain}/{r2_key}"
        else:
            return f"https://{self.account_id}.r2.cloudflarestorage.com/{self.bucket_name}/{r2_key}"

