const { query, getClient } = require('../config/database');
const logger = require('../utils/logger');

exports.getAllJournals = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let queryStr = 'SELECT * FROM journals';
    const params = [];

    if (status) {
      queryStr += ' WHERE status = $1';
      params.push(status);
    }

    queryStr += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(queryStr, params);

    res.json({
      success: true,
      count: result.rows.length,
      journals: result.rows
    });
  } catch (error) {
    logger.error('Get all journals error:', error);
    next(error);
  }
};

exports.getJournalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM journals WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      journal: result.rows[0]
    });
  } catch (error) {
    logger.error('Get journal error:', error);
    next(error);
  }
};

exports.createJournal = async (req, res, next) => {
  const client = await getClient();

  try {
    const { description, debit_account_id, credit_account_id, amount, reference } = req.body;

    // Validate accounts
    const debitAccount = await client.query('SELECT * FROM accounts WHERE id = $1', [debit_account_id]);
    const creditAccount = await client.query('SELECT * FROM accounts WHERE id = $1', [credit_account_id]);

    if (debitAccount.rows.length === 0 || creditAccount.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account selected'
      });
    }

    if (debit_account_id === credit_account_id) {
      return res.status(400).json({
        success: false,
        message: 'Debit and credit accounts cannot be the same'
      });
    }

    const result = await client.query(
      'INSERT INTO journals (description, debit_account_id, credit_account_id, amount, reference, status, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
      [description, debit_account_id, credit_account_id, amount, reference || null, 'pending', req.user.id]
    );

    logger.info(`Journal entry created: ${result.rows[0].id}`);

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      journal: result.rows[0]
    });
  } catch (error) {
    logger.error('Create journal error:', error);
    next(error);
  } finally {
    client.release();
  }
};

exports.updateJournal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, debit_account_id, credit_account_id, amount, reference } = req.body;

    // Check if journal is pending
    const journalCheck = await query('SELECT * FROM journals WHERE id = $1', [id]);
    if (journalCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    if (journalCheck.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only update pending journal entries'
      });
    }

    const result = await query(
      'UPDATE journals SET description = $1, debit_account_id = $2, credit_account_id = $3, amount = $4, reference = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [description, debit_account_id, credit_account_id, amount, reference || null, id]
    );

    logger.info(`Journal entry updated: ${id}`);

    res.json({
      success: true,
      message: 'Journal entry updated successfully',
      journal: result.rows[0]
    });
  } catch (error) {
    logger.error('Update journal error:', error);
    next(error);
  }
};

exports.deleteJournal = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if journal is pending
    const journalCheck = await query('SELECT * FROM journals WHERE id = $1', [id]);
    if (journalCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    if (journalCheck.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending journal entries'
      });
    }

    await query('DELETE FROM journals WHERE id = $1', [id]);

    logger.info(`Journal entry deleted: ${id}`);

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    logger.error('Delete journal error:', error);
    next(error);
  }
};

exports.approveJournal = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE journals SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3 AND status = $4 RETURNING *',
      ['approved', req.user.id, id, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Journal entry not found or already processed'
      });
    }

    logger.info(`Journal entry approved: ${id}`);

    res.json({
      success: true,
      message: 'Journal entry approved successfully',
      journal: result.rows[0]
    });
  } catch (error) {
    logger.error('Approve journal error:', error);
    next(error);
  }
};

exports.rejectJournal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await query(
      'UPDATE journals SET status = $1, rejection_reason = $2, rejected_by = $3, rejected_at = NOW(), updated_at = NOW() WHERE id = $4 AND status = $5 RETURNING *',
      ['rejected', reason || null, req.user.id, id, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Journal entry not found or already processed'
      });
    }

    logger.info(`Journal entry rejected: ${id}`);

    res.json({
      success: true,
      message: 'Journal entry rejected successfully',
      journal: result.rows[0]
    });
  } catch (error) {
    logger.error('Reject journal error:', error);
    next(error);
  }
};
