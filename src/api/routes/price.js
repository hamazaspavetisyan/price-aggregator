const express = require('express');
const router = express.Router();
const { addHandler } = require('../common');
const {
    getLatestPrices,
    triggerManualSync
} = require('../../modules/price/price.controller');
const Params = require('../../shared/params');

router.post(
    '/sync',
    addHandler(triggerManualSync, /*['user'] no auth in this project*/ null, {})
);

router.get(
    '/latest',
    addHandler(
        getLatestPrices,
        /*['user', 'admin'] no auth in this project*/ null,
        {
            query: Params().required('symbol', 'str')
            //body: Params().required('symbol', 'str')
        }
    )
);

module.exports = router;
