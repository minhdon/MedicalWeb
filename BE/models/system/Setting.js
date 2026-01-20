import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
    storeName: { type: String, default: 'PharmaCare' },
    phone: { type: String, default: '1900 1234' },
    email: { type: String, default: 'contact@pharmacare.vn' },
    website: { type: String, default: 'www.pharmacare.vn' },
    address: { type: String, default: 'Tp. Hồ Chí Minh' },

    // Notification Settings
    notifyNewOrder: { type: Boolean, default: true },
    notifyLowStock: { type: Boolean, default: true },
    notifyExpiry: { type: Boolean, default: true },
    notifyEmail: { type: Boolean, default: false },

    // Security Settings
    enable2FA: { type: Boolean, default: false },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Setting = mongoose.model('Setting', settingSchema);
