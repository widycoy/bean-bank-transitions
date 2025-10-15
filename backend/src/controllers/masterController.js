// src/controllers/masterController.js
import { getMasterDataByType } from '../models/masterModel.js';

export const getMasterDataController = async (req, res) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({ message: 'Entity type is required.' });
    }

    const data = await getMasterDataByType(type);

    if (!data.length) {
      return res.status(404).json({ message: `No data found for type: ${type}` });
    }

    res.status(200).json({
      message: `Master data for ${type}`,
      data,
    });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
