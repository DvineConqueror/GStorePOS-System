import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { imageAPI } from '@/lib/api';

interface ImageUploadProps {
  onImageUploaded: (imageId: string, imageUrl: string) => void;
  onImageRemoved?: () => void;
  currentImageId?: string;
  currentImageUrl?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  onImageUploaded,
  onImageRemoved,
  currentImageId,
  currentImageUrl,
  disabled = false,
  className = '',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload image
      const response = await imageAPI.uploadImage(file);
      
      if (response.success) {
        const imageId = response.data.imageId;
        const imageUrl = imageAPI.getImageUrl(imageId);
        onImageUploaded(imageId, imageUrl);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (currentImageId) {
      try {
        await imageAPI.deleteImage(currentImageId);
      } catch (error) {
        console.warn('Failed to delete image from server:', error);
      }
    }
    
    setPreview(null);
    onImageRemoved?.();
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        <Card className="relative group">
          <CardContent className="p-0">
            <div className="relative max-h-40 overflow-auto">
              <img
                src={preview}
                alt="Product preview"
                className="w-full object-contain rounded-lg"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 z-10 bg-red-500/90"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className={`border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleClick}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-2">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-xs text-gray-600">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="mx-auto h-8 w-8 text-gray-400 mb-2">
                    <ImageIcon className="h-full w-full" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      Click to upload product image
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
