// src/pages/ProfilePanel.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faBoxOpen,
  faLocationDot,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';

import AddressBook from './AddressBook';
import OrdersPage from './OrdersPage';
import MyAccount from './MyAccount';

type ActiveComponent = 'account' | 'orders' | 'address';

const ProfilePanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth() as { user: any; logout: () => void };

  const [activeComponent, setActiveComponent] = useState<ActiveComponent>('account');
  const [addressView, setAddressView] = useState<'form' | 'list'>('list');

  // Sync the active section when navigating in from the Navbar
  useEffect(() => {
    const initialTab = location.state?.defaultTab;
    if (initialTab === 'account') {
      setActiveComponent('account');
    } else if (initialTab === 'orders') {
      setActiveComponent('orders');
    } else if (initialTab === 'address') {
      setActiveComponent('address');
      setAddressView('list');
    }
  }, [location.state]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeComponent) {
      case 'orders':
        return <OrdersPage />;
      case 'address':
        return (
          <AddressBook
            initialView={addressView}
            onSwitchView={(view: 'form' | 'list') => setAddressView(view)}
          />
        );
      case 'account':
      default:
        return <MyAccount />;
    }
  };

  const displayName = user?.name || user?.displayName || 'User';
  const firstName = displayName.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase() || 'U';

  const navItems: { key: ActiveComponent; label: string; icon: typeof faUser }[] = [
    { key: 'account', label: 'Profile', icon: faUser },
    { key: 'orders', label: 'My Orders', icon: faBoxOpen },
    { key: 'address', label: 'Addresses', icon: faLocationDot },
  ];

  return (
    <div className="acct-shell">
      <aside className="acct-nav">
        <div className="acct-user">
          <div className="acct-avatar" aria-hidden="true">{initial}</div>
          <div className="acct-user-meta">
            <p className="acct-user-name">Hello, {firstName}</p>
            {user?.email && <p className="acct-user-email">{user.email}</p>}
          </div>
        </div>

        <nav className="acct-menu" aria-label="Account sections">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`acct-menu-item ${activeComponent === item.key ? 'active' : ''}`}
              aria-current={activeComponent === item.key ? 'page' : undefined}
              onClick={() => {
                setActiveComponent(item.key);
                if (item.key === 'address') setAddressView('list');
              }}
            >
              <FontAwesomeIcon icon={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
          <button className="acct-menu-item acct-logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>Log Out</span>
          </button>
        </nav>
      </aside>

      <div className="acct-panel">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProfilePanel;
