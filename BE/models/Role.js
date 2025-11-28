import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    roleName: { type: String, required: true, unique: true},
    description: { type: String }
});

export const Role = mongoose.model('Role', roleSchema);