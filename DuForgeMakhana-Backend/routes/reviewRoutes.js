// routes/reviewRoutes.js

import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  canUserReviewProduct,
  createReview,
  getReviewsByProduct,
} from "../controllers/reviewController.js";


const router = express.Router();

// 0) Check if a Firebase user is eligible to review this product
//    (Must come *before* the generic `/:productId` route.)
router.get("/eligible/:productId/:userId", canUserReviewProduct);

router.post("/:productId", verifyToken, createReview);

// 1) POST a new review for a given product
router.post("/:productId", createReview);

// 2) GET all reviews for a given product
router.get("/:productId", getReviewsByProduct);

export default router;
