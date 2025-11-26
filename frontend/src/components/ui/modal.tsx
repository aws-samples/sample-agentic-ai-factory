import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, width = '500px' }: ModalProps) {
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        {/* Modal Container */}
        <div
          style={{
            width: width,
            maxWidth: '90vw',
            maxHeight: '90vh',
            backgroundColor: '#0f1419',
            borderRadius: '12px',
            border: '1px solid #2a2a3e',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid #2a2a3e'
            }}
          >
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a2e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
            </button>
          </div>

          {/* Body Content */}
          <div
            style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              color: '#cbd5e1'
            }}
          >
            {children}
          </div>

          {/* Actions Bar (Footer) */}
          {footer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '16px 24px',
                borderTop: '1px solid #2a2a3e',
                backgroundColor: '#0a0a0f'
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Button components for modal actions
interface ModalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function ModalButton({ children, onClick, variant = 'secondary', disabled = false }: ModalButtonProps) {
  const baseStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      ...baseStyle,
      backgroundColor: '#FF9900',
      color: '#000000'
    },
    secondary: {
      ...baseStyle,
      backgroundColor: 'transparent',
      color: '#cbd5e1',
      border: '1px solid #475569'
    },
    danger: {
      ...baseStyle,
      backgroundColor: '#ef4444',
      color: '#ffffff'
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={variants[variant]}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'primary') e.currentTarget.style.backgroundColor = '#e68a00';
          else if (variant === 'secondary') e.currentTarget.style.backgroundColor = '#1a1a2e';
          else if (variant === 'danger') e.currentTarget.style.backgroundColor = '#dc2626';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') e.currentTarget.style.backgroundColor = '#FF9900';
        else if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'transparent';
        else if (variant === 'danger') e.currentTarget.style.backgroundColor = '#ef4444';
      }}
    >
      {children}
    </button>
  );
}
