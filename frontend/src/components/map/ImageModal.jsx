import { X } from 'lucide-react';

export default function ImageModal({ imageUrl, altText, onClose }) {
  if (!imageUrl) return null;

  return (
    <div className="image-modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '2rem',
      backdropFilter: 'blur(10px)'
    }} onClick={onClose}>
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: 'white',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={24} />
      </button>

      <img 
        src={imageUrl} 
        alt={altText} 
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: '12px',
          boxShadow: '0 0 100px rgba(0,0,0,1)',
          animation: 'zoomIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      />
      
      {altText && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          color: 'white',
          fontSize: '1.1rem',
          background: 'rgba(0,0,0,0.6)',
          padding: '0.5rem 1.5rem',
          borderRadius: '20px'
        }}>
          {altText}
        </div>
      )}
    </div>
  );
}
