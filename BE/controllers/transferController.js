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
            .populate('products.productId', 'productName unit')
            .sort({ createdAt: -1 });

        res.status(200).json({ data: transfers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tải danh sách chuyển kho' });
    }
};

// Create transfer request (Multi-Product)
export const createTransfer = async (req, res) => {
    try {
        const { fromWarehouseId, toWarehouseId, products, note } = req.body;

        // Validation
        if (!fromWarehouseId || !toWarehouseId || !products || products.length === 0) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        if (fromWarehouseId === toWarehouseId) {
            return res.status(400).json({ message: 'Kho nguồn và kho đích không được trùng nhau' });
        }

        // Validate stock for each product
        for (const p of products) {
            if (p.quantity <= 0) {
                return res.status(400).json({ message: 'Số lượng phải lớn hơn 0' });
            }

            // Convert to base unit for accurate stock checking
            const { convertToBaseUnit } = await import('../utils/unitConverter.js');
            const { baseQuantity, baseUnit } = await convertToBaseUnit(
                p.productId,
                p.quantity,
                p.unit || 'Đơn vị'
            );

            // Calculate total available stock for this product at source warehouse
            const totalStock = await ProductBatch.aggregate([
                {
                    $match: {
                        productId: new mongoose.Types.ObjectId(p.productId),
                        warehouseId: new mongoose.Types.ObjectId(fromWarehouseId),
                        baseUnit: baseUnit,
                        remainingQuantity: { $gt: 0 }
                    }
                },
                { $group: { _id: null, total: { $sum: '$remainingQuantity' } } }
            ]);

            const available = totalStock[0]?.total || 0;
            if (available < baseQuantity) {
                return res.status(400).json({
                    message: `Không đủ tồn kho. Sản phẩm cần ${baseQuantity} ${baseUnit}, chỉ có ${available} ${baseUnit}`
                });
            }
        }

        // Create transfer
        const transfer = await InventoryTransfer.create({
            fromWarehouseId,
            toWarehouseId,
            products,
            status: 'Pending',
            note: note || ''
        });

        const populated = await InventoryTransfer.findById(transfer._id)
            .populate('fromWarehouseId', 'warehouseName')
            .populate('toWarehouseId', 'warehouseName')
            .populate('products.productId', 'productName');

        res.status(201).json({
            message: 'Tạo phiếu chuyển kho thành công',
            data: populated
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Lỗi khi tạo phiếu chuyển kho' });
    }
};

// Complete transfer - FEFO Logic
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

        // Process each product with FEFO
        for (const productItem of transfer.products) {
            const { productId, quantity } = productItem;

            // Step 1: FEFO - Find batches sorted by expiry date (earliest first)
            const batches = await ProductBatch.find({
                productId,
                warehouseId: transfer.fromWarehouseId,
                remainingQuantity: { $gt: 0 }
            }).sort({ expiryDate: 1 }).session(session);

            let remaining = quantity;
            const destinationBatches = [];

            // Step 2: Deduct from source batches (FEFO)
            for (const batch of batches) {
                if (remaining <= 0) break;

                const takeQty = Math.min(batch.remainingQuantity, remaining);

                // Reduce source batch stock
                await ProductBatch.updateOne(
                    { _id: batch._id },
                    { $inc: { remainingQuantity: -takeQty } },
                    { session }
                );

                // Record for destination batch creation
                destinationBatches.push({
                    productId,
                    quantity: takeQty,
                    baseUnit: batch.baseUnit,  // Preserve baseUnit
                    manufactureDate: batch.manufactureDate,
                    expiryDate: batch.expiryDate,
                    dosage: batch.dosage,
                    administration: batch.administration
                });

                remaining -= takeQty;
            }

            // Verify all quantity was fulfilled
            if (remaining > 0) {
                await session.abortTransaction();
                return res.status(400).json({
                    message: `Không đủ tồn kho để hoàn thành chuyển. Thiếu ${remaining}`
                });
            }

            // Step 3: Create batches at destination with transferId
            for (const destBatch of destinationBatches) {
                await ProductBatch.create([{
                    ...destBatch,
                    warehouseId: transfer.toWarehouseId,
                    remainingQuantity: destBatch.quantity,
                    transferId: transfer._id  // Link to the transfer
                }], { session });
            }
        }

        // Update transfer status
        transfer.status = 'Completed';
        transfer.transferDate = new Date();
        await transfer.save({ session });

        await session.commitTransaction();

        res.status(200).json({
            message: 'Chuyển kho thành công',
            data: transfer
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
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$products.quantity' }
                }
            }
        ]);

        res.status(200).json({ data: stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy thống kê' });
    }
};

// Delete transfer and restore stock to source warehouse
export const deleteTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const transfer = await InventoryTransfer.findById(id).session(session);
        if (!transfer) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Phiếu chuyển kho không tồn tại' });
        }

        let restoredCount = 0;

        // If transfer was completed, restore stock
        if (transfer.status === 'Completed') {
            // Find all destination batches created by this transfer
            const destinationBatches = await ProductBatch.find({
                transferId: transfer._id
            }).session(session);

            // For each destination batch, restore to source warehouse
            for (const destBatch of destinationBatches) {
                const quantityToRestore = destBatch.remainingQuantity;

                if (quantityToRestore > 0) {
                    // Find source batches to restore to (FIFO)
                    const sourceBatches = await ProductBatch.find({
                        productId: destBatch.productId,
                        warehouseId: transfer.fromWarehouseId
                    }).sort({ expiryDate: 1 }).session(session);

                    let remaining = quantityToRestore;

                    // Restore stock to source batches
                    for (const sourceBatch of sourceBatches) {
                        if (remaining <= 0) break;

                        const maxRestore = sourceBatch.quantity - sourceBatch.remainingQuantity;
                        const restoreQty = Math.min(remaining, maxRestore);

                        if (restoreQty > 0) {
                            await ProductBatch.updateOne(
                                { _id: sourceBatch._id },
                                { $inc: { remainingQuantity: restoreQty } },
                                { session }
                            );
                            remaining -= restoreQty;
                            restoredCount += restoreQty;
                        }
                    }

                    // If couldn't restore to existing batches, create new batch at source
                    if (remaining > 0) {
                        await ProductBatch.create([{
                            productId: destBatch.productId,
                            warehouseId: transfer.fromWarehouseId,
                            quantity: remaining,
                            remainingQuantity: remaining,
                            baseUnit: destBatch.baseUnit,
                            manufactureDate: destBatch.manufactureDate,
                            expiryDate: destBatch.expiryDate,
                            dosage: destBatch.dosage,
                            administration: destBatch.administration
                        }], { session });
                        restoredCount += remaining;
                    }
                }

                // Delete destination batch
                await ProductBatch.deleteOne({ _id: destBatch._id }, { session });
            }
        }

        // Delete the transfer
        await InventoryTransfer.deleteOne({ _id: id }, { session });

        await session.commitTransaction();

        res.status(200).json({
            message: restoredCount > 0
                ? `Đã xóa phiếu chuyển và hoàn trả ${restoredCount} đơn vị về kho nguồn`
                : 'Đã xóa phiếu chuyển kho',
            restoredQuantity: restoredCount
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error deleting transfer:', error);
        res.status(500).json({ message: 'Lỗi khi xóa phiếu chuyển kho' });
    } finally {
        session.endSession();
    }
};
