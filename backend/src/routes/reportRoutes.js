const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Balance Sheet
router.get('/balance-sheet', reportController.getBalanceSheet);

// Income Statement
router.get('/income-statement', reportController.getIncomeStatement);

// General Ledger
router.get('/ledger', reportController.getLedger);

// Trial Balance
router.get('/trial-balance', reportController.getTrialBalance);

// Cash Flow
router.get('/cash-flow', reportController.getCashFlow);

// Account Statement
router.get('/account/:accountId', reportController.getAccountStatement);

module.exports = router;
