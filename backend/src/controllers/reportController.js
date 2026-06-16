const { query } = require('../config/database');
const logger = require('../utils/logger');

exports.getBalanceSheet = async (req, res, next) => {
  try {
    const { asOf } = req.query;
    const date = asOf || new Date().toISOString().split('T')[0];

    const result = await query(`
      SELECT 
        a.id,
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as balance
      FROM accounts a
      LEFT JOIN journals j ON (j.debit_account_id = a.id OR j.credit_account_id = a.id)
        AND j.status = 'approved'
        AND DATE(j.created_at) <= $1
      WHERE a.type IN ('asset', 'liability', 'equity')
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.type, a.code
    `, [date]);

    const balanceSheet = {
      assets: [],
      liabilities: [],
      equity: []
    };

    result.rows.forEach(row => {
      if (row.type === 'asset') balanceSheet.assets.push(row);
      else if (row.type === 'liability') balanceSheet.liabilities.push(row);
      else if (row.type === 'equity') balanceSheet.equity.push(row);
    });

    res.json({
      success: true,
      asOf: date,
      balanceSheet
    });
  } catch (error) {
    logger.error('Get balance sheet error:', error);
    next(error);
  }
};

exports.getIncomeStatement = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const result = await query(`
      SELECT 
        a.id,
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as amount
      FROM accounts a
      LEFT JOIN journals j ON (j.debit_account_id = a.id OR j.credit_account_id = a.id)
        AND j.status = 'approved'
        AND DATE(j.created_at) BETWEEN $1 AND $2
      WHERE a.type IN ('revenue', 'expense')
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.type, a.code
    `, [start, end]);

    const incomeStatement = {
      revenues: [],
      expenses: []
    };

    let totalRevenue = 0;
    let totalExpense = 0;

    result.rows.forEach(row => {
      if (row.type === 'revenue') {
        incomeStatement.revenues.push(row);
        totalRevenue += parseFloat(row.amount || 0);
      } else if (row.type === 'expense') {
        incomeStatement.expenses.push(row);
        totalExpense += parseFloat(row.amount || 0);
      }
    });

    incomeStatement.netIncome = totalRevenue - totalExpense;

    res.json({
      success: true,
      period: { startDate: start, endDate: end },
      incomeStatement
    });
  } catch (error) {
    logger.error('Get income statement error:', error);
    next(error);
  }
};

exports.getLedger = async (req, res, next) => {
  try {
    const { accountId, startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const account = await query('SELECT * FROM accounts WHERE id = $1', [accountId]);
    if (account.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    const ledger = await query(`
      SELECT 
        j.id,
        j.created_at as date,
        j.description,
        CASE WHEN j.debit_account_id = $1 THEN j.amount ELSE 0 END as debit,
        CASE WHEN j.credit_account_id = $1 THEN j.amount ELSE 0 END as credit,
        j.reference
      FROM journals j
      WHERE (j.debit_account_id = $1 OR j.credit_account_id = $1)
        AND j.status = 'approved'
        AND DATE(j.created_at) BETWEEN $2 AND $3
      ORDER BY j.created_at ASC
    `, [accountId, start, end]);

    res.json({
      success: true,
      account: account.rows[0],
      period: { startDate: start, endDate: end },
      entries: ledger.rows
    });
  } catch (error) {
    logger.error('Get ledger error:', error);
    next(error);
  }
};

exports.getTrialBalance = async (req, res, next) => {
  try {
    const { asOf } = req.query;
    const date = asOf || new Date().toISOString().split('T')[0];

    const result = await query(`
      SELECT 
        a.id,
        a.code,
        a.name,
        COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) as debit,
        COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as credit
      FROM accounts a
      LEFT JOIN journals j ON (j.debit_account_id = a.id OR j.credit_account_id = a.id)
        AND j.status = 'approved'
        AND DATE(j.created_at) <= $1
      GROUP BY a.id, a.code, a.name
      HAVING COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) != 0
        OR COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) != 0
      ORDER BY a.code
    `, [date]);

    let totalDebits = 0;
    let totalCredits = 0;

    result.rows.forEach(row => {
      totalDebits += parseFloat(row.debit || 0);
      totalCredits += parseFloat(row.credit || 0);
    });

    res.json({
      success: true,
      asOf: date,
      trialBalance: result.rows,
      totals: {
        debits: totalDebits,
        credits: totalCredits,
        balanced: Math.abs(totalDebits - totalCredits) < 0.01
      }
    });
  } catch (error) {
    logger.error('Get trial balance error:', error);
    next(error);
  }
};

exports.getCashFlow = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const result = await query(`
      SELECT 
        j.created_at as date,
        j.description,
        CASE WHEN a.type = 'asset' THEN j.amount ELSE -j.amount END as cash_flow,
        a.type as account_type
      FROM journals j
      JOIN accounts a ON (j.debit_account_id = a.id OR j.credit_account_id = a.id)
      WHERE (a.type = 'asset' OR a.type = 'liability')
        AND j.status = 'approved'
        AND DATE(j.created_at) BETWEEN $1 AND $2
      ORDER BY j.created_at ASC
    `, [start, end]);

    res.json({
      success: true,
      period: { startDate: start, endDate: end },
      cashFlow: result.rows
    });
  } catch (error) {
    logger.error('Get cash flow error:', error);
    next(error);
  }
};

exports.getAccountStatement = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const account = await query('SELECT * FROM accounts WHERE id = $1', [accountId]);
    if (account.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    const statement = await query(`
      SELECT 
        j.id,
        j.created_at as date,
        j.description,
        CASE WHEN j.debit_account_id = $1 THEN j.amount ELSE 0 END as debit,
        CASE WHEN j.credit_account_id = $1 THEN j.amount ELSE 0 END as credit,
        j.reference,
        j.status
      FROM journals j
      WHERE (j.debit_account_id = $1 OR j.credit_account_id = $1)
        AND DATE(j.created_at) BETWEEN $2 AND $3
      ORDER BY j.created_at ASC
    `, [accountId, start, end]);

    res.json({
      success: true,
      account: account.rows[0],
      period: { startDate: start, endDate: end },
      statement: statement.rows
    });
  } catch (error) {
    logger.error('Get account statement error:', error);
    next(error);
  }
};
