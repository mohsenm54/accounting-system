const { query } = require('../config/database');
const logger = require('../utils/logger');

exports.getAllAccounts = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM accounts ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      count: result.rows.length,
      accounts: result.rows
    });
  } catch (error) {
    logger.error('Get all accounts error:', error);
    next(error);
  }
};

exports.getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.json({
      success: true,
      account: result.rows[0]
    });
  } catch (error) {
    logger.error('Get account error:', error);
    next(error);
  }
};

exports.createAccount = async (req, res, next) => {
  try {
    const { name, code, type, description, parent_id } = req.body;

    // Validate account code uniqueness
    const existingAccount = await query(
      'SELECT * FROM accounts WHERE code = $1',
      [code]
    );

    if (existingAccount.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Account code already exists'
      });
    }

    const result = await query(
      'INSERT INTO accounts (name, code, type, description, parent_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [name, code, type, description, parent_id || null]
    );

    logger.info(`Account created: ${code}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      account: result.rows[0]
    });
  } catch (error) {
    logger.error('Create account error:', error);
    next(error);
  }
};

exports.updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const result = await query(
      'UPDATE accounts SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    logger.info(`Account updated: ${id}`);

    res.json({
      success: true,
      message: 'Account updated successfully',
      account: result.rows[0]
    });
  } catch (error) {
    logger.error('Update account error:', error);
    next(error);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if account has journals
    const journals = await query(
      'SELECT * FROM journals WHERE debit_account_id = $1 OR credit_account_id = $1',
      [id]
    );

    if (journals.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with existing transactions'
      });
    }

    const result = await query(
      'DELETE FROM accounts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    logger.info(`Account deleted: ${id}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    next(error);
  }
};

exports.getAccountBalance = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Calculate balance from journals
    const result = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN debit_account_id = $1 THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN credit_account_id = $1 THEN amount ELSE 0 END), 0) as balance
      FROM journals
      WHERE status = 'approved'
    `, [id]);

    const balance = result.rows[0]?.balance || 0;

    res.json({
      success: true,
      accountId: id,
      balance: parseFloat(balance)
    });
  } catch (error) {
    logger.error('Get account balance error:', error);
    next(error);
  }
};
