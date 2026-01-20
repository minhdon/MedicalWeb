import { Setting } from '../models/system/Setting.js';

// Get Settings (Create default if not exists)
export const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Settings
export const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        const settings = await Setting.findOneAndUpdate({}, updates, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        });

        res.status(200).json({
            message: 'Cập nhật cài đặt thành công',
            data: settings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
