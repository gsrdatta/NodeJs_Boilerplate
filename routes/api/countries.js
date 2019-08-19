const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Countries = mongoose.model('Countries');

router.get('/', auth.required, (req, res, next) => {
    try {
        Countries.find({ expiryDate: null }, (err, country) => {
            if (err) {
                return res.status(400).json({
                    errors: {
                        message: res.__('Some Error Occured'),
                        err: err
                    },
                });
            }
            res.json(country);
        })
    } catch (err) {
        logger.error("error in Feature" + err);
        return res.status(400).json({
            errors: {
                message: res.__('Some Error Occured'),
            },
        });
    }
});


module.exports = router;