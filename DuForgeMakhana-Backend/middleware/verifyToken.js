// src/middleware/verifyToken.js
import jwt from "jsonwebtoken";

/**
 * Generic JWT verification (customer / user routes).
 * Expects token payload: { userId, phone, role }
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided (auth)" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Keep same shape everywhere
    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      role: decoded.role || "customer",
    };

    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * JWT-based (for admin routes). Uses same payload.
 */
export const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided (admin auth)" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      role: decoded.role,
    };

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin only" });
    }

    next();
  } catch (err) {
    console.error("Admin JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
};

/**
 * Simple "admin only" check (if verifyToken used before).
 */
export const verifyAdminRole = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin only" });
  }
  next();
};

/**
 * Owner-only check (if you use an "owner" role).
 */
export const verifyOwnerRole = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({ error: "Forbidden: owner only" });
  }
  next();
};
