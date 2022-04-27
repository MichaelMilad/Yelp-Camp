const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync');
const Campground = require('../models/campground');
const Review = require('../models/reviews');
const {
   validateReview,
   isLoggedIn,
   isReviewAuthor
} = require('../middlewares');
const reviews = require('../controllers/reviews');

router.post('/', isLoggedIn, validateReview, wrapAsync(reviews.createReview));

router.delete(
   '/:reviewId',
   isLoggedIn,
   isReviewAuthor,
   wrapAsync(reviews.deleteReview)
);

module.exports = router;
