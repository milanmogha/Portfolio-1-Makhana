// src/components/Footer.tsx

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faInstagram, faFacebookF, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';

const SHOP_MAKHANA = [
  { label: 'Flavored Makhana', to: `/products?category=${encodeURIComponent('Flavored Makhana')}` },
  { label: 'Plain Makhana', to: `/products?category=${encodeURIComponent('Plain Makhana')}` },
  { label: 'Makhana Mixes', to: `/products?category=${encodeURIComponent('Makhana Mixes')}` },
  { label: 'Trial Packs', to: `/products?category=${encodeURIComponent('Trial Packs')}` },
];

const SHOP_DRY_FRUITS = [
  { label: 'Almonds', to: `/products?subCategory=${encodeURIComponent('Almonds')}` },
  { label: 'Cashews', to: `/products?subCategory=${encodeURIComponent('Cashews')}` },
  { label: 'Walnuts', to: `/products?subCategory=${encodeURIComponent('Walnuts')}` },
  { label: 'Mixed Nuts', to: `/products?subCategory=${encodeURIComponent('Mixed Nuts')}` },
];

const COLLECTIONS = [
  { label: 'Gift Boxes', to: '/products?category=Gift Boxes' },
  { label: 'Best Sellers', to: '/products?category=Best Sellers' },
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'On Sale', to: '/products?category=Sale' },
];

const COMPANY = [
  { label: 'Our Story', to: '/about' },
  { label: 'Feedback', to: '/feedback' },
  { label: 'Careers', to: '/careers' },
  { label: 'Contact Us', to: '/contact' },
];

const HELP = [
  { label: 'Shipping', to: '/shipping' },
  { label: 'Return Policy', to: '/returns' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
];

type FooterLink = { label: string; to: string };

const FooterColumn = ({ title, links }: { title: string; links: FooterLink[] }) => (
  <details className="footer-col" open>
    <summary>{title}</summary>
    <ul>
      {links.map((l) => (
        <li key={l.to + l.label}>
          <Link to={l.to}>{l.label}</Link>
        </li>
      ))}
    </ul>
  </details>
);

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Top — brand block + link columns */}
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo-link" aria-label="Makhana E-Store home">
              <img src="/images/makhana-logo.png" alt="Makhana E-Store" className="footer-logo" />
            </Link>
            <p className="footer-tagline">
              Premium roasted makhana &amp; handpicked dry fruits — light, crunchy
              and wholesome snacking, delivered fresh to your door.
            </p>
            <div className="footer-social" aria-label="Follow us">
              <a href="https://www.instagram.com/makhanahealthking" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="https://www.facebook.com/makhanahealthking" className="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="https://twitter.com/makhanahealthkg" className="social-link" aria-label="X / Twitter" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faXTwitter} />
              </a>
            </div>
          </div>

          <nav className="footer-nav" aria-label="Footer">
            <FooterColumn title="Shop Makhana" links={SHOP_MAKHANA} />
            <FooterColumn title="Shop Dry Fruits" links={SHOP_DRY_FRUITS} />
            <FooterColumn title="Collections" links={COLLECTIONS} />
            <FooterColumn title="Company" links={COMPANY} />
            <FooterColumn title="Help" links={HELP} />
          </nav>
        </div>

        {/* Contact strip */}
        <div className="footer-contact-row">
          <a className="footer-contact-box" href="tel:+917310851792">
            <FontAwesomeIcon icon={faPhone} />
            <span>
              <span className="footer-contact-label">Talk to us</span>
              <span className="footer-contact-value">+91 73108 51792</span>
            </span>
          </a>
          <a className="footer-contact-box" href="mailto:hello@duforge.tech">
            <FontAwesomeIcon icon={faEnvelope} />
            <span>
              <span className="footer-contact-label">Write to us</span>
              <span className="footer-contact-value">hello@duforge.tech</span>
            </span>
          </a>
        </div>

        <hr className="footer-divider" />

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-copy">© {year} Makhana E-Store. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/shipping">Shipping</Link>
          </div>
          <p className="footer-made">Crafted with <span aria-hidden="true">♥</span> in India</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
