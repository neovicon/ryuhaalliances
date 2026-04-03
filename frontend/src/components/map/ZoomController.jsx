import { ZoomOut, Info } from 'lucide-react';

export default function ZoomController({ zoomLevel, onZoomOut }) {
  return (
    <div className="zoom-controller" style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 10
    }}>
      <button 
        className="btn" 
        onClick={onZoomOut} 
        disabled={zoomLevel <= 0.5}
        title="Zoom Out"
        style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          opacity: zoomLevel <= 0.5 ? 0.5 : 1,
          background: 'rgba(177, 15, 46, 0.8)',
          backdropFilter: 'blur(4px)'
        }}
      >
        <ZoomOut size={20} />
      </button>
    </div>
  );
}
