import { TemplateComponent } from '@/types/template';

interface QRCodeComponentProps {
  component: TemplateComponent;
  templateData?: Record<string, any>;
  isSelected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function QRCodeComponent({ 
  component, 
  templateData = {}, 
  isSelected = false, 
  onClick,
  style 
}: QRCodeComponentProps) {
  const { data, label, size } = component.content || {};
  const componentStyle = component.style || {};

  // Replace template variables in QR code data and label
  const replaceVariables = (text: string) => {
    if (!text) return text;
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return templateData[key] || match;
    });
  };

  const qrData = replaceVariables(data || 'https://example.com');
  const qrLabel = replaceVariables(label || '');
  const qrSize = size || 150;

  // Generate QR Code URL using qr-server.com API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}&format=png&margin=10`;

  const containerStyle: React.CSSProperties = {
    textAlign: componentStyle.textAlign || 'center',
    backgroundColor: componentStyle.backgroundColor || '#FFFFFF',
    padding: componentStyle.padding || '16px',
    borderRadius: '8px',
    cursor: onClick ? 'pointer' : 'default',
    border: isSelected ? '2px solid #3B82F6' : '2px solid transparent',
    ...style
  };

  const qrImageStyle: React.CSSProperties = {
    width: `${qrSize}px`,
    height: `${qrSize}px`,
    display: 'block',
    margin: '0 auto',
    backgroundColor: '#FFFFFF',
    padding: '4px',
    borderRadius: '4px'
  };

  return (
    <div style={containerStyle} onClick={onClick}>
      {qrLabel && (
        <h4 
          style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: componentStyle.textColor || '#1F2937'
          }}
        >
          {qrLabel}
        </h4>
      )}
      
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <img
          src={qrCodeUrl}
          alt={`QR Code for ${qrData}`}
          style={qrImageStyle}
          onError={(e) => {
            // Fallback to a simple placeholder if QR service fails
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.setAttribute('style', 'display: flex');
          }}
        />
        
        {/* Fallback placeholder */}
        <div
          style={{
            display: 'none',
            width: `${qrSize}px`,
            height: `${qrSize}px`,
            backgroundColor: '#F3F4F6',
            border: '2px dashed #D1D5DB',
            borderRadius: '4px',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            fontSize: '12px',
            textAlign: 'center'
          }}
        >
          QR Code<br/>
          {qrData.length > 20 ? qrData.substring(0, 20) + '...' : qrData}
        </div>
      </div>
      
      {qrData && qrData !== 'https://example.com' && (
        <p 
          style={{ 
            margin: '8px 0 0 0', 
            fontSize: '12px', 
            color: componentStyle.textColor || '#6B7280',
            wordBreak: 'break-all',
            maxWidth: `${qrSize + 20}px`,
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          {qrData}
        </p>
      )}
    </div>
  );
}