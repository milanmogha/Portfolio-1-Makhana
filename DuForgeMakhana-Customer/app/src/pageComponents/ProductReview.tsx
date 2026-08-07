// src/pages/ProductReview.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { canUserReview, addReviewForProduct, getReviewsByProduct } from '../api/reviewApi';
import ReviewForm from './ReviewForm';

type EligibilityState = {
  canReview: boolean;
  alreadyReviewed: boolean;
  isLoading: boolean;
  error: string;
};

type SubmissionState = {
  isLoading: boolean;
  error: string;
  success: string;
};

interface ProductReviewProps {
    productId: string;
}

const ProductReview: React.FC<ProductReviewProps> = ({ productId }) => {
    const { user } = useAuth() as { user: any };
    const [eligibility, setEligibility] = useState<EligibilityState>({
        canReview: false,
        alreadyReviewed: false,
        isLoading: true,
        error: ''
    });
    const [submission, setSubmission] = useState<SubmissionState>({
        isLoading: false,
        error: '',
        success: ''
    });

    useEffect(() => {
        if (!user || !productId) {
            setEligibility(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const checkReviewStatus = async () => {
            try {
                const token = await user.getIdToken();
                
                // 1. Check if user is eligible (has a delivered order)
                const canReviewRes = await canUserReview(productId, user.uid, token);
                
                if (!canReviewRes) {
                    setEligibility({ canReview: false, alreadyReviewed: false, isLoading: false, error: '' });
                    return;
                }

                // 2. Check if user has already reviewed this product
                const existingReviews = await getReviewsByProduct(productId, token);
                const hasReviewed = existingReviews.some((review: { userId: string }) => review.userId === user.uid);

                setEligibility({ canReview: true, alreadyReviewed: hasReviewed, isLoading: false, error: '' });

            } catch (err) {
                console.error("Error checking review eligibility:", err);
                setEligibility({ canReview: false, alreadyReviewed: false, isLoading: false, error: 'Could not check review status.' });
            }
        };

        checkReviewStatus();
    }, [user, productId]);

    const handleReviewSubmit = async ({ rating, comment }: { rating: number; comment: string }) => {
        if (!user) {
            setSubmission({ isLoading: false, error: 'You must be logged in.', success: '' });
            return;
        }

        setSubmission({ isLoading: true, error: '', success: '' });
        try {
            const token = await user.getIdToken();
            const reviewData = {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                rating,
                comment,
            };

            await addReviewForProduct(productId, reviewData, token);
            setSubmission({ isLoading: false, error: '', success: 'Thank you for your review!' });
            // After successful submission, update eligibility to show they've reviewed it
            setEligibility(prev => ({ ...prev, alreadyReviewed: true }));

        } catch (err) {
            console.error("Error submitting review:", err);
            let errorMessage = 'Failed to submit review.';
            if (typeof err === 'object' && err !== null) {
                if ('response' in err && typeof (err as any).response?.data?.message === 'string') {
                    errorMessage = (err as any).response.data.message;
                } else if ('message' in err && typeof (err as any).message === 'string') {
                    errorMessage = (err as any).message;
                }
            }
            setSubmission({ isLoading: false, error: errorMessage, success: '' });
        }
    };

    if (eligibility.isLoading) {
        return <p>Checking review status...</p>;
    }

    if (!eligibility.canReview) {
        // Don't show anything if they can't review
        return null;
    }

    if (eligibility.alreadyReviewed || submission.success) {
        return <p className="review-notice">✅ You have already reviewed this item. Thank you!</p>;
    }

    return (
        <div className="review-section">
            <ReviewForm onSubmit={handleReviewSubmit} loading={submission.isLoading} />
            {submission.error && <p className="error-message">{submission.error}</p>}
        </div>
    );
};

export default ProductReview;