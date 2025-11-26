import { useState } from 'react';
import { Search, Bell, User, LogOut, Activity, UserCircle, Key } from 'lucide-react';
import { Modal, ModalButton } from './ui/modal';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface AppHeaderProps {
  currentUser?: any;
  onLogout?: () => void;
}

// Mock notifications data
const mockNotifications = [
  { id: 1, message: "Got a minute? Share your thoughts in the new Pulse Survey.", time: "4d", unread: true },
  { id: 2, message: "Got a minute? Share your thoughts in the new Pulse Survey.", time: "1w", unread: true },
  { id: 3, message: "Got a minute? Share your thoughts in the new Pulse Survey.", time: "2w", unread: true },
  { id: 4, message: "Got a minute? Share your thoughts in the new Pulse Survey.", time: "3w", unread: false },
  { id: 5, message: "Got a minute? Share your thoughts in the new Pulse Survey.", time: "4w", unread: false },
];

export function AppHeader({ currentUser, onLogout }: AppHeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <>
    <div className="bg-[#000000] border-b border-[#1f1f1f]" style={{padding:"10px"}}>
      {/* Top Bar with Search and Icons */}
      <div className="h-14 flex items-center px-8">
        {/* Search Bar - 25% width */}
        <div style={{ width: '25%', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 10 }}>
            <Search className="w-4 h-4 text-[#9ca3af]" />
          </div>
          <input
            type="text"
            placeholder="Search requests, agents, blueprints..."
            className="w-full h-9 pr-4 text-white text-sm rounded-md outline-none transition-colors"
            style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #1a1a1a',
              paddingLeft: '36px'
            }}
          />
          <style>{`
            input::placeholder {
              color: #6b7280;
            }
            input:focus {
              borderColor: #FF9900;
              outline: none;
            }
          `}</style>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="text-[#9ca3af] hover:text-white hover:bg-[#1a1a1a] h-9 w-9"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
          >
            <Bell className="w-4 h-4" />
            {/* Notification badge */}
            <span style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%'
            }} />
          </Button>

          {/* User Profile */}
          <Button
            variant="ghost"
            size="icon"
            className="text-[#9ca3af] hover:text-white hover:bg-[#1a1a1a] h-9 w-9"
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
          >
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    {/* User Dropdown - rendered outside header */}
      {showUserDropdown && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
              background: 'transparent'
            }}
            onClick={() => setShowUserDropdown(false)}
          />
          <div
            style={{
              position: 'fixed',
              width: '200px',
              backgroundColor: '#0f1419',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 9999,
              top: '60px',
              right: '15px'
            }}
          >
            <div style={{ padding: '8px 0' }}>
              {/* <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: '#cbd5e1',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a2e'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => {
                  setShowUserDropdown(false);
                  setShowProfileModal(true);
                }}
              >
                <UserCircle style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                View Profile
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: '#cbd5e1',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a2e'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => {
                  setShowUserDropdown(false);
                  setShowPasswordModal(true);
                }}
              >
                <Key style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                Change Password
              </button> */}
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: '#cbd5e1',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a2e'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => {
                  setShowUserDropdown(false);
                  onLogout?.();
                }}
              >
                <LogOut style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
              background: 'transparent'
            }}
            onClick={() => setShowNotifications(false)}
          />
          <div
            style={{
              position: 'fixed',
              width: '380px',
              maxHeight: '450px',
              backgroundColor: '#0f1419',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 9999,
              top: '60px',
              right: '50px',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #2a2a3e'
            }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>Notifications</span>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FF9900',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
                onClick={() => {}}
              >
                Mark all as read
              </button>
            </div>

            {/* Notifications List */}
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {mockNotifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 20px',
                    borderBottom: '1px solid #1a1a2e',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a2e'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Unread dot */}
                  <div style={{ paddingTop: '6px' }}>
                    {notification.unread && (
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#FF9900',
                        borderRadius: '50%'
                      }} />
                    )}
                    {!notification.unread && <span style={{ width: '8px', display: 'inline-block' }} />}
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 153, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Activity style={{ width: '18px', height: '18px', color: '#FF9900' }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '14px',
                      color: '#cbd5e1',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      {notification.message}
                    </p>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '4px',
                      display: 'block'
                    }}>
                      {notification.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="User Profile"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowProfileModal(false)}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" onClick={() => setShowProfileModal(false)}>
              Save Changes
            </ModalButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              defaultValue="John Doe"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #2a2a3e',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: '#1a1a2e',
                color: '#ffffff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              defaultValue="john.doe@example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #2a2a3e',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: '#1a1a2e',
                color: '#ffffff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Role
            </label>
            <input
              type="text"
              defaultValue="Administrator"
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #2a2a3e',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: '#0a0a0f',
                color: '#6b7280'
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" onClick={() => setShowPasswordModal(false)}>
              Update Password
            </ModalButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter current password"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #2a2a3e',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: '#1a1a2e',
                color: '#ffffff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #2a2a3e',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: '#1a1a2e',
                color: '#ffffff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #2a2a3e',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: '#1a1a2e',
                color: '#ffffff'
              }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}