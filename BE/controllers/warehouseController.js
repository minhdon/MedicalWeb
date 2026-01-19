import { Warehouse } from '../models/warehouse/Warehouse.js';

// Get all warehouses (branches)
export const getAllWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find().sort({ createdAt: -1 });

        const formattedWarehouses = warehouses.map(w => ({
            id: w._id,
            name: w.warehouseName,
            address: w.address || '',
            phone: w.phone || '',
            manager: w.manager || '',
            isActive: w.status !== false
        }));

        res.status(200).json({ data: formattedWarehouses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tải danh sách chi nhánh' });
    }
};

// Create new warehouse
export const createWarehouse = async (req, res) => {
    try {
        const { name, address, phone, manager, isActive } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Tên chi nhánh là bắt buộc' });
        }

        const newWarehouse = new Warehouse({
            warehouseName: name.trim(),
            address: address?.trim() || '',
            phone: phone?.trim() || '',
            manager: manager?.trim() || '',
            status: isActive !== false
        });

        await newWarehouse.save();

        res.status(201).json({
            message: 'Thêm chi nhánh thành công',
            data: {
                id: newWarehouse._id,
                name: newWarehouse.warehouseName,
                address: newWarehouse.address,
                phone: newWarehouse.phone,
                manager: newWarehouse.manager,
                isActive: newWarehouse.status
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi thêm chi nhánh' });
    }
};

// Update warehouse
export const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, manager, isActive } = req.body;

        const updatedWarehouse = await Warehouse.findByIdAndUpdate(
            id,
            {
                warehouseName: name?.trim(),
                address: address?.trim(),
                phone: phone?.trim(),
                manager: manager?.trim(),
                status: isActive
            },
            { new: true }
        );

        if (!updatedWarehouse) {
            return res.status(404).json({ message: 'Chi nhánh không tồn tại' });
        }

        res.status(200).json({
            message: 'Cập nhật thành công',
            data: {
                id: updatedWarehouse._id,
                name: updatedWarehouse.warehouseName,
                address: updatedWarehouse.address,
                phone: updatedWarehouse.phone,
                manager: updatedWarehouse.manager,
                isActive: updatedWarehouse.status
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi cập nhật chi nhánh' });
    }
};

// Delete warehouse
export const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;

        await Warehouse.findByIdAndDelete(id);
        res.status(200).json({ message: 'Đã xóa chi nhánh' });
    } catch (error) {
        console.error(error);
        // Handle middleware error (stock exists, orders exist)
        res.status(400).json({ message: error.message || 'Lỗi khi xóa chi nhánh' });
    }
};

// Toggle warehouse status
export const toggleWarehouseStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const warehouse = await Warehouse.findById(id);
        if (!warehouse) {
            return res.status(404).json({ message: 'Chi nhánh không tồn tại' });
        }

        warehouse.status = !warehouse.status;
        await warehouse.save();

        res.status(200).json({
            message: warehouse.status ? 'Đã kích hoạt chi nhánh' : 'Đã tạm ngưng chi nhánh',
            isActive: warehouse.status
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái' });
    }
};

// Get warehouse stock summary
import { ProductBatch } from '../models/product/ProductBatch.js';
import mongoose from 'mongoose';

export const getWarehouseStock = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate warehouse exists
        const warehouse = await Warehouse.findById(id);
        if (!warehouse) {
            return res.status(404).json({ message: 'Kho không tồn tại' });
        }

        // Aggregate batches by product
        const stockByProduct = await ProductBatch.aggregate([
            {
                $match: {
                    warehouseId: new mongoose.Types.ObjectId(id),
                    remainingQuantity: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: '$productId',
                    totalQuantity: { $sum: '$remainingQuantity' },
                    batches: { $sum: 1 },
                    baseUnit: { $first: '$baseUnit' },
                    earliestExpiry: { $min: '$expiryDate' }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    productId: '$_id',
                    productName: '$product.productName',
                    totalQuantity: 1,
                    batches: 1,
                    baseUnit: { $ifNull: ['$baseUnit', '$product.unit'] },
                    earliestExpiry: 1
                }
            },
            { $sort: { productName: 1 } }
        ]);

        // Calculate summary
        const summary = {
            totalProducts: stockByProduct.length,
            totalQuantity: stockByProduct.reduce((sum, p) => sum + p.totalQuantity, 0),
            totalBatches: stockByProduct.reduce((sum, p) => sum + p.batches, 0)
        };

        res.status(200).json({
            success: true,
            data: stockByProduct,
            summary
        });

    } catch (error) {
        console.error('Error getting warehouse stock:', error);
        res.status(500).json({ message: 'Lỗi khi tải tồn kho' });
    }
};
