import { useState } from 'react';
import { TemplateComponent } from '@/types/template';

interface ImageComponentProps {
  component: TemplateComponent;
  templateData?: Record<string, any>;
  isSelected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function ImageComponent({ 
  component, 
  templateData = {}, 
  isSelected = false, 
  onClick,
  style 
}: ImageComponentProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { src, alt, caption } = component.content || {};
  const componentStyle = component.style || {};

  // Replace template variables in image src and caption
  const replaceVariables = (text: string) => {
    if (!text) return text;
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return templateData[key] || match;
    });
  };

  // Get default example image if no src is provided
  const getDefaultImageUrl = () => {
    // Try to get imageUrl from template data first
    if (templateData.imageUrl) return templateData.imageUrl;
    if (templateData.profileImageUrl) return templateData.profileImageUrl;
    if (templateData.schoolLogoUrl) return templateData.schoolLogoUrl;
    
    // Fallback to example images from different categories
    const defaultImages = [
      "https://images.unsplash.com/photo-1494790108755-2616b612b602?w=400&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop"
    ];
    
    // Use component id to get consistent image per component
    const imageIndex = component.id ? Math.abs(component.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % defaultImages.length : 0;
    return defaultImages[imageIndex];
  };

  const imageSrc = replaceVariables(src || '') || getDefaultImageUrl();
  const imageCaption = replaceVariables(caption || '');

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const containerStyle: React.CSSProperties = {
    width: componentStyle.width || '300px',
    textAlign: 'center',
    cursor: onClick ? 'pointer' : 'default',
    border: isSelected ? '2px solid #3B82F6' : '2px solid transparent',
    borderRadius: componentStyle.borderRadius || '8px',
    padding: '8px',
    backgroundColor: componentStyle.backgroundColor || 'transparent',
    ...style
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: componentStyle.height || 'auto',
    borderRadius: componentStyle.borderRadius || '8px',
    objectFit: 'cover' as const,
    display: 'block'
  };

  return (
    <div style={containerStyle} onClick={onClick}>
      {imageError ? (
        // Error state when image fails to load
        <div
          style={{
            width: '100%',
            height: componentStyle.height || '200px',
            backgroundColor: '#FEF2F2',
            border: '2px dashed #FCA5A5',
            borderRadius: componentStyle.borderRadius || '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626'
          }}
        >
          <i className="fas fa-exclamation-triangle text-4xl mb-2"></i>
          <p className="text-sm font-medium">Failed to Load Image</p>
          <p className="text-xs">Check the image URL</p>
        </div>
      ) : (
        // Successfully loaded image
        <>
          {isLoading && (
            <div
              style={{
                width: '100%',
                height: componentStyle.height || '200px',
                backgroundColor: '#F3F4F6',
                borderRadius: componentStyle.borderRadius || '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280'
              }}
            >
              <i className="fas fa-spinner fa-spin text-2xl"></i>
            </div>
          )}
          <img
            src={imageSrc}
            alt={alt || 'Report image'}
            style={{
              ...imageStyle,
              display: isLoading ? 'none' : 'block'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      )}
      
      {imageCaption && (
        <p
          style={{
            marginTop: '8px',
            fontSize: '14px',
            color: componentStyle.textColor || '#6B7280',
            fontStyle: 'italic',
            textAlign: 'center'
          }}
        >
          {imageCaption}
        </p>
      )}
    </div>
  );
}