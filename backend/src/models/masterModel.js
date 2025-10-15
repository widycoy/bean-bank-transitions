// src/models/masterModel.js
import db from '../config/db.js';

export const getMasterDataByType = async (entityTypeName) => {
  const [rows] = await db.query(
    `SELECT id, label, description 
     FROM master_data 
     WHERE entity_type_name = ? AND status = 1
     ORDER BY id ASC`,
    [entityTypeName]
  );
  return rows;
};
