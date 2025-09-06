import { useState, useRef } from 'react';
import { TemplateComponent } from '@/types/template';

interface ImageComponentProps {
    component: TemplateComponent;
    templateData?: Record<string, any>;
    isSelected?: boolean;
    style?: React.CSSProperties;
    onUpdate?: (updates: Partial<TemplateComponent>) => void;
}

export function ImageComponent({
    component,
    templateData = {},
    isSelected = false,
    style,
    onUpdate
}: ImageComponentProps) {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isHover, setIsHover] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { src, alt, caption } = component.content || {};
    const componentStyle = component.style || {};

    const replaceVariables = (text: string) => {
        if (!text) return text;
        return text.replace(/\{\{(\w+)\}\}/g, (_, key) => templateData[key] || _);
    };

    const imageSrc = replaceVariables(src || '');
    const imageCaption = replaceVariables(caption || '');

    const handleImageLoad = () => {
        setIsLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const localUrl = URL.createObjectURL(file);

            onUpdate?.({
                content: {
                    ...component.content,
                    src: localUrl
                }
            });

            setIsLoading(false);
            setImageError(false);
        }
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                textAlign: 'center',
                border: isSelected ? '2px solid #3B82F6' : '2px solid transparent',
                borderRadius: componentStyle.borderRadius || '8px',
                padding: '8px',
                backgroundColor: componentStyle.backgroundColor || 'transparent',
                ...style
            }}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
        >
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {!imageSrc || imageError ? (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: imageError ? '#FEF2F2' : '#F3F4F6',
                        border: '2px dashed #D1D5DB',
                        borderRadius: componentStyle.borderRadius || '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: imageError ? '#DC2626' : '#6B7280'
                    }}
                >
                    <i className="fas fa-image text-4xl mb-2"></i>
                    <p className="text-sm font-medium">
                        {imageError ? 'Failed to load image' : 'Click the icon to upload'}
                    </p>
                </div>
            ) : (
                <>
                    {isLoading && (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
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
                            width: '100%',
                            height: '100%',
                            borderRadius: componentStyle.borderRadius || '8px',
                            objectFit: 'cover',
                            display: isLoading ? 'none' : 'block'
                        }}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        onClick={(e) => e.stopPropagation()}
                    />
                </>
            )}

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                }}
                style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    display: isHover ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '12px'
                }}
                title={imageSrc ? 'Change image' : 'Upload image'}
            >
                <i className="fas fa-upload"></i>
            </button>

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