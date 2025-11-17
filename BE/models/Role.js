import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    roleId: { type: String, unique: true, require: true, index: true},
    roleName: { type: String, require: true},
    description: { type: String, }
});

export const Role = mongoose.Model('Role', roleSchema);