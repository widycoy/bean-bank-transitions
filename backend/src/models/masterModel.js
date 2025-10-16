import db from '../config/db.js';

/**
 * Get master data by entity_type_name
 */
export const getByType = async (entity_type_name) => {
  const [rows] = await db.query(
    `SELECT id, entity_type_id, entity_type_name, label, description, status
     FROM master_data
     WHERE entity_type_name = ? AND status = 1
     ORDER BY id ASC`,
    [entity_type_name]
  );
  return rows;
};

/**
 * Create new master data record
 */
export const create = async ({ entity_type_id, entity_type_name, label, description, status }) => {
  const [result] = await db.query(
    `INSERT INTO master_data (entity_type_id, entity_type_name, label, description, status)
     VALUES (?, ?, ?, ?, ?)`,
    [entity_type_id, entity_type_name, label, description || '', status ?? 1]
  );
  return result.insertId;
};

/**
 * Update existing master data record
 */
export const update = async (id, { label, description, status }) => {
  const [result] = await db.query(
    `UPDATE master_data 
     SET 
       label = COALESCE(?, label),
       description = COALESCE(?, description),
       status = COALESCE(?, status)
     WHERE id = ?`,
    [label, description, status, id]
  );
  return result.affectedRows;
};

/**
 * Soft delete master data (set status = 0)
 */
export const softDelete = async (id) => {
  const [result] = await db.query(
    `UPDATE master_data 
     SET status = 0
     WHERE id = ? AND status = 1`,
    [id]
  );
  return result.affectedRows;
};



