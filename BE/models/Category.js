import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
    typeId: {type: String, require: true, index: true, unique: true},
    typeName: {type: String, require: true}
}, {timestamps: true});

export const Category = mongoose.Model('Category', categorySchema)