// src/components/AdminNavbar.jsx

import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import "../css/AdminNavbar.css";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/login", { replace: true });
  }, [navigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      localStorage.removeItem("adminToken");
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="navbar">
      <nav className="navbar__nav">
        <div className="navbar__brand">
          <h1 className="logo">MHK</h1>
        </div>

        {/* MOBILE-ONLY MENU BUTTON (⋮) */}
        <button
          ref={buttonRef}
          className="menu-button mobile-only"
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          ⋮
        </button>

        {/* DESKTOP NAV LINKS */}
        <div className="navbar__links desktop-only">
          <NavLink to="/admin/banners" className="navbar__link">Banner</NavLink>
          <NavLink to="/admin/dashboard" className="navbar__link">Dashboard</NavLink>
          <NavLink 
            to="/admin/coupon"
            state={{ view: "new" }}
            className="navbar__link"
          >
            New Coupon
          </NavLink>
          <NavLink 
            to="/admin/coupon"
            state={{ view: "viewAll" }}
            className="navbar__link"
          >
            View Coupons
          </NavLink>
          <NavLink to="/admin/products" className="navbar__link">Products</NavLink>
          <NavLink to="/admin/orders" className="navbar__link">Orders</NavLink>
                      <NavLink to="/admin/blogs" className="f-item">📝 Blog</NavLink>
          <NavLink to="/admin/users" className="navbar__link">Users</NavLink>
          
          <NotificationBell />
          
          <button onClick={handleLogout} className="navbar__logout">
            Logout
          </button>
        </div>

        {/* FLOATING MENU — MOBILE ONLY */}
        {dropdownOpen && (
          <div ref={dropdownRef} className="floating-menu mobile-only">
            <NavLink to="/admin/banners" className="f-item">🏷️ Banner</NavLink>
            <NavLink to="/admin/dashboard" className="f-item">📊 Dashboard</NavLink>

            <NavLink
              to="/admin/coupon"
              state={{ view: "new" }}
              className="f-item"
            >
              🆕 New Coupon
            </NavLink>

            <NavLink
              to="/admin/coupon"
              state={{ view: "viewAll" }}
              className="f-item"
            >
              🎟️ View Coupons
            </NavLink>

            <NavLink to="/admin/products" className="f-item">📦 Products</NavLink>
            <NavLink to="/admin/orders" className="f-item">🧾 Orders</NavLink>
            <NavLink to="/admin/users" className="f-item">👥 Users</NavLink>

            <NavLink to="/admin/blogs" className="f-item">📝 Blog</NavLink>

            <button onClick={handleLogout} className="f-item danger">
              ❌ Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
