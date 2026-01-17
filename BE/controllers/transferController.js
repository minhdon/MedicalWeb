import mongoose from 'mongoose';
import { InventoryTransfer } from '../models/warehouse/InventoryTransfer.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';

// Get all transfers
export const getAllTransfers = async (req, res) => {
    try {
        const transfers = await InventoryTransfer.find()
            .populate('fromWarehouseId', 'warehouseName')
            .populate('toWarehouseId', 'warehouseName')
            .populate({
                path: 'productBatchId',
                populate: { path: 'productId', select: 'productName' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ data: transfers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tải danh sách chuyển kho' });
    }
};

// Create transfer request
export const createTransfer = async (req, res) => {
    try {
        const { fromWarehouseId, toWarehouseId, productBatchId, quantity, note } = req.body;

        // Validation
        if (!fromWarehouseId || !toWarehouseId || !productBatchId || !quantity) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        if (fromWarehouseId === toWarehouseId) {
            return res.status(400).json({ message: 'Kho nguồn và kho đích không được trùng nhau' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: 'Số lượng phải lớn hơn 0' });
        }

        // Check batch exists and has enough stock
        const batch = await ProductBatch.findById(productBatchId);
        if (!batch) {
            return res.status(404).json({ message: 'Lô hàng không tồn tại' });
        }

        if (batch.warehouseId.toString() !== fromWarehouseId) {
            return res.status(400).json({ message: 'Lô hàng không thuộc kho nguồn' });
        }

        if (batch.remainingQuantity < quantity) {
            return res.status(400).json({
                message: `Không đủ tồn kho. Hiện có: ${batch.remainingQuantity}, yêu cầu: ${quantity}`
            });
        }

        // Create transfer
        const transfer = await InventoryTransfer.create({
            fromWarehouseId,
            toWarehouseId,
            productBatchId,
            quantity,
            status: 'Pending',
            note: note || ''
        });

        res.status(201).json({
            message: 'Tạo phiếu chuyển kho thành công',
            data: transfer
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Lỗi khi tạo phiếu chuyển kho' });
    }
};

// Complete transfer - moves stock from source to destination
export const completeTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const transfer = await InventoryTransfer.findById(id).session(session);
        if (!transfer) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Phiếu chuyển kho không tồn tại' });
        }

        if (transfer.status !== 'Pending') {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Phiếu này đã được xử lý' });
        }

        // Get source batch
        const sourceBatch = await ProductBatch.findById(transfer.productBatchId).session(session);
        if (!sourceBatch) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Lô hàng nguồn không tồn tại' });
        }

        // Verify stock still available
        if (sourceBatch.remainingQuantity < transfer.quantity) {
            await session.abortTransaction();
            return res.status(400).json({
                message: `Không đủ tồn kho. Hiện có: ${sourceBatch.remainingQuantity}`
            });
        }

        // 1. Reduce source batch stock
        sourceBatch.remainingQuantity -= transfer.quantity;
        await sourceBatch.save({ session });

        // 2. Create new batch at destination warehouse
        const destBatch = await ProductBatch.create([{
            productId: sourceBatch.productId,
            purchaseInvoiceId: sourceBatch.purchaseInvoiceId,
            warehouseId: transfer.toWarehouseId,
            quantity: transfer.quantity,
            remainingQuantity: transfer.quantity,
            manufactureDate: sourceBatch.manufactureDate,
            expiryDate: sourceBatch.expiryDate,
            dosage: sourceBatch.dosage,
            administration: sourceBatch.administration
        }], { session });

        // 3. Update transfer status
        transfer.status = 'Completed';
        transfer.transferDate = new Date();
        await transfer.save({ session });

        await session.commitTransaction();

        res.status(200).json({
            message: 'Chuyển kho thành công',
            data: {
                transfer,
                newBatchId: destBatch[0]._id
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ message: error.message || 'Lỗi khi hoàn thành chuyển kho' });
    } finally {
        session.endSession();
    }
};

// Cancel transfer
export const cancelTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        const transfer = await InventoryTransfer.findById(id);
        if (!transfer) {
            return res.status(404).json({ message: 'Phiếu chuyển kho không tồn tại' });
        }

        if (transfer.status !== 'Pending') {
            return res.status(400).json({ message: 'Chỉ có thể hủy phiếu đang chờ xử lý' });
        }

        transfer.status = 'Cancelled';
        await transfer.save();

        res.status(200).json({
            message: 'Đã hủy phiếu chuyển kho',
            data: transfer
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi hủy phiếu chuyển kho' });
    }
};

// Get transfer stats
export const getTransferStats = async (req, res) => {
    try {
        const stats = await InventoryTransfer.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' }
                }
            }
        ]);

        res.status(200).json({ data: stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy thống kê' });
    }
};
