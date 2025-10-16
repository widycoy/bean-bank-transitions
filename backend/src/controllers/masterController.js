import * as masterDataModel from '../models/masterModel.js';

/**
 * @desc Get master data by entity_type_name
 * @route GET /api/master/:entity_type_name
 */
export const getMasterDataByType = async (req, res) => {
  const { entity_type_name } = req.params;

  try {
    const data = await masterDataModel.getByType(entity_type_name);

    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: `No master data found for entity type: ${entity_type_name}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Master data retrieved successfully',
      data,
    });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching master data',
    });
  }
};

/**
 * @desc Create new master data record
 * @route POST /api/master
 */
export const createMasterData = async (req, res) => {
  const { entity_type_id, entity_type_name, label, description, status } = req.body;

  try {
    if (!entity_type_id || !entity_type_name || !label) {
      return res.status(400).json({
        success: false,
        message: 'entity_type_id, entity_type_name, and label are required',
      });
    }

    const insertId = await masterDataModel.create({
      entity_type_id,
      entity_type_name,
      label,
      description,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Master data created successfully',
      data: { id: insertId, entity_type_id, entity_type_name, label, description, status },
    });
  } catch (error) {
    console.error('Error creating master data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating master data',
    });
  }
};

/**
 * @desc Update master data record by ID
 * @route PUT /api/master/:id
 */
export const updateMasterData = async (req, res) => {
  const { id } = req.params;
  const { label, description, status } = req.body;

  try {
    const affectedRows = await masterDataModel.update(id, {
      label,
      description,
      status,
    });

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        message: `Master data with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Master data updated successfully',
    });
  } catch (error) {
    console.error('Error updating master data:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating master data',
      error: error.message,
    });
  }
};

/**
 * @desc Soft delete master data record by ID
 * @route DELETE /api/master/:id
 */
export const deleteMasterData = async (req, res) => {
  const { id } = req.params;

  try {
    const affectedRows = await masterDataModel.softDelete(id);

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        message: `Master data with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Master data deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting master data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting master data',
    });
  }
};



