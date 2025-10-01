import React from 'react';
import { ImageIcon } from 'lucide-react';
import { imageAPI } from '@/lib/api';

interface ProductImageProps {
  imageId?: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

export function ProductImage({ 
  imageId, 
  alt = 'Product image', 
  className = 'w-full h-32 object-cover rounded-lg',
  fallbackClassName = 'w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center'
}: ProductImageProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

  // Load image as blob to handle CORS properly
  React.useEffect(() => {
    if (!imageId) {
      setBlobUrl(null);
      return;
    }

    setHasError(false);
    setIsLoading(true);
    setBlobUrl(null);

    const loadImageAsBlob = async () => {
      try {
        const imageUrl = imageAPI.getImageUrl(imageId);
        
        const response = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load image as blob:', { imageId, error });
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadImageAsBlob();

    // Cleanup blob URL when component unmounts or imageId changes
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [imageId]);

  // Cleanup blob URL on unmount
  React.useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (!imageId) {
    return (
      <div className={fallbackClassName}>
        <ImageIcon className="h-8 w-8 text-gray-400" />
        <span className="text-xs text-gray-500 mt-1">No Image</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={fallbackClassName}>
        <ImageIcon className="h-8 w-8 text-gray-400" />
        <span className="text-xs text-gray-500 mt-1">Failed to Load</span>
      </div>
    );
  }


  return (
    <div className="relative">
      {blobUrl && !hasError && (
        <img
          src={blobUrl}
          alt={alt}
          className={className}
          onError={(e) => {
            console.error('Blob image failed to load:', { 
              imageId, 
              blobUrl, 
              error: e,
              naturalWidth: (e.target as HTMLImageElement).naturalWidth,
              naturalHeight: (e.target as HTMLImageElement).naturalHeight
            });
            setHasError(true);
          }}
          onLoad={() => {
            setIsLoading(false);
          }}
        />
      )}
      {isLoading && (
        <div className={`${fallbackClassName} absolute inset-0`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        </div>
      )}
    </div>
  );
}

// Component that shows both image and fallback
export function ProductImageWithFallback({ 
  imageId, 
  alt = 'Product image', 
  className = 'w-full h-32 object-cover rounded-lg',
  fallbackClassName = 'w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center'
}: ProductImageProps) {
  return (
    <div className="relative">
      {imageId ? (
        <>
          <img
            src={imageAPI.getImageUrl(imageId)}
            alt={alt}
            className={className}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className={`${fallbackClassName} absolute inset-0 hidden`}>
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        </>
      ) : (
        <div className={fallbackClassName}>
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
  );
}
