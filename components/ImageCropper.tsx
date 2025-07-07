'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crop, Check, X, Upload } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImageUrl: string) => void;
  imageUrl: string;
}

interface CropArea {
  x: number;
  y: number;
  size: number;
}

export default function ImageCropper({ isOpen, onClose, onCrop, imageUrl }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 100, y: 100, size: 200 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setCurrentImageUrl(imageUrl);
      setCropArea({ x: 100, y: 100, size: 200 });
    }
  }, [isOpen, imageUrl]);

  // Update container size and center crop area when image loads
  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const minDimension = Math.min(rect.width, rect.height);
      const initialSize = Math.min(200, minDimension * 0.6);
      
      setCropArea({
        x: (rect.width - initialSize) / 2,
        y: (rect.height - initialSize) / 2,
        size: initialSize
      });
    }
  }, [imageLoaded]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (action === 'drag') {
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
  }, [cropArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current || (!isDragging && !isResizing)) return;

    const rect = imageRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const newX = mouseX - dragStart.x;
      const newY = mouseY - dragStart.y;
      
      const maxX = rect.width - cropArea.size;
      const maxY = rect.height - cropArea.size;

      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY)),
      }));
    } else if (isResizing) {
      const centerX = cropArea.x + cropArea.size / 2;
      const centerY = cropArea.y + cropArea.size / 2;
      
      const distance = Math.sqrt(
        Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
      );
      const newSize = distance * 2;
      
      const maxSize = Math.min(
        rect.width - Math.max(0, centerX - newSize / 2) - Math.max(0, (centerX + newSize / 2) - rect.width),
        rect.height - Math.max(0, centerY - newSize / 2) - Math.max(0, (centerY + newSize / 2) - rect.height)
      );
      
      const constrainedSize = Math.max(50, Math.min(newSize, maxSize));
      
      setCropArea(prev => ({
        x: centerX - constrainedSize / 2,
        y: centerY - constrainedSize / 2,
        size: constrainedSize
      }));
    }
  }, [isDragging, isResizing, dragStart, cropArea]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newUrl = URL.createObjectURL(file);
      setCurrentImageUrl(newUrl);
      setImageLoaded(false);
    }
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleCrop = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    
    // Calculate the scale factor between displayed image and actual image
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    // Set canvas size to square (400x400 for good quality)
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Clear canvas
    ctx.clearRect(0, 0, outputSize, outputSize);

    // Calculate crop coordinates in actual image dimensions
    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceSize = cropArea.size * Math.min(scaleX, scaleY);

    // Draw the cropped image
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize
    );

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onCrop(croppedUrl);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  }, [cropArea, onCrop, onClose]);

  const handleCancel = () => {
    if (currentImageUrl !== imageUrl) {
      URL.revokeObjectURL(currentImageUrl);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-semibold">
            Edit Profile Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image Container */}
          <div className="flex justify-center">
            <div 
              ref={containerRef}
              className="relative inline-block bg-gray-100 rounded-lg overflow-hidden"
              style={{ width: '350px', height: '280px' }}
            >
              {currentImageUrl ? (
                <>
                  <img
                    ref={imageRef}
                    src={currentImageUrl}
                    alt="Crop preview"
                    className="w-full h-full object-cover select-none"
                    onLoad={handleImageLoad}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    draggable={false}
                  />
                  
                  {imageLoaded && (
                    <>
                      {/* Dark Overlay */}
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none"
                        style={{
                          clipPath: `circle(${cropArea.size / 2}px at ${cropArea.x + cropArea.size / 2}px ${cropArea.y + cropArea.size / 2}px)`
                        }}
                      />
                      
                      {/* Crop Circle */}
                      <div
                        className="absolute border-2 border-white border-dashed rounded-full cursor-move select-none"
                        style={{
                          left: cropArea.x,
                          top: cropArea.y,
                          width: cropArea.size,
                          height: cropArea.size,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'drag')}
                      >
                        {/* Corner Resize Handles */}
                        <div
                          className="absolute w-3 h-3 bg-white border border-gray-300 rounded-sm cursor-nw-resize"
                          style={{ top: '-6px', left: '-6px' }}
                          onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        />
                        <div
                          className="absolute w-3 h-3 bg-white border border-gray-300 rounded-sm cursor-ne-resize"
                          style={{ top: '-6px', right: '-6px' }}
                          onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        />
                        <div
                          className="absolute w-3 h-3 bg-white border border-gray-300 rounded-sm cursor-sw-resize"
                          style={{ bottom: '-6px', left: '-6px' }}
                          onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        />
                        <div
                          className="absolute w-3 h-3 bg-white border border-gray-300 rounded-sm cursor-se-resize"
                          style={{ bottom: '-6px', right: '-6px' }}
                          onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <div className="text-center text-gray-500">
                    <Upload className="h-12 w-12 mx-auto mb-2" />
                    <p>No image selected</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleCrop} 
              disabled={!imageLoaded}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Crop className="h-4 w-4 mr-2" />
              Apply Crop
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleChooseImage}
              className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </Button>
          </div>

          {/* Recommendation Text */}
          <p className="text-center text-sm text-gray-500">
            Recommended: Square image
          </p>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Hidden Canvas for Processing */}
          <canvas
            ref={canvasRef}
            className="hidden"
            width={400}
            height={400}
          />

          {/* Bottom Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleCrop} 
              disabled={!imageLoaded}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}