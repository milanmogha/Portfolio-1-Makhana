import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope, faBoxOpen } from '@fortawesome/free-solid-svg-icons';

/**
 * Layer A — utility bar. Contact details mirror the footer (real business
 * contacts, not placeholders). Hidden when the header compacts on scroll.
 */
export default function UtilityBar() {
  return (
    <div className="utility-bar">
      <div className="utility-bar-inner">
        <div className="utility-contacts">
          <a href="tel:+917310851792" className="utility-link">
            <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
            <span>+91 73108 51792</span>
          </a>
          <a href="mailto:hello@duforge.tech" className="utility-link utility-email">
            <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
            <span>hello@duforge.tech</span>
          </a>
        </div>

        <p className="utility-message">Premium Indian Makhana — carefully roasted, freshly packed</p>

        <div className="utility-actions">
          <Link to="/account" state={{ defaultTab: 'orders' }} className="utility-link">
            <FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" />
            <span>Track Order</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
