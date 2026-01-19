import { Product } from '../models/product/Product.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import mongoose from 'mongoose';
import { Manufacturer } from '../models/manufacturer/Manufacturer.js';
import { Category } from '../models/product/Category.js';
import { InventoryTransfer } from '../models/warehouse/InventoryTransfer.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';

/**
 * Helper: Update stockQuantity for a product based on batches
 * Call this after any batch create/update/delete
 */
export async function updateProductStock(productId) {
    try {
        // Find central warehouse
        const centralWarehouse = await Warehouse.findOne({ warehouseType: 'central' });

        // Build batch query
        const batchQuery = { productId };
        if (centralWarehouse) {
            batchQuery.warehouseId = centralWarehouse._id;
        }

        // Calculate total stock
        const batches = await ProductBatch.find(batchQuery);
        const stockQuantity = batches.reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);

        // Find nearest expiry date
        const validBatches = batches.filter(b => b.expiryDate && b.remainingQuantity > 0);
        const sortedByExpiry = validBatches.sort((a, b) =>
            new Date(a.expiryDate) - new Date(b.expiryDate)
        );
        const nearestExpiryDate = sortedByExpiry.length > 0 ? sortedByExpiry[0].expiryDate : null;

        // Update product
        await Product.updateOne(
            { _id: productId },
            { $set: { stockQuantity, nearestExpiryDate } }
        );

        return stockQuantity;
    } catch (error) {
        console.error(`Error updating stock for product ${productId}:`, error.message);
        return null;
    }
}

export const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Mặc định 12 sản phẩm/trang

        const { search, filter, minPrice, maxPrice, brand, origin, inStockOnly } = req.query;
        let query = {};

        // Search by product name
        if (search) {
            query.productName = { $regex: search, $options: 'i' };
        }

        // Filter by prescription/OTC (based on Category name)
        if (filter === 'prescription') {
            // Find Category with EXACT name "Thuốc theo đơn" (NOT containing "không")
            const prescriptionCategory = await Category.findOne({
                categoryName: 'Thuốc theo đơn'
            });
            if (prescriptionCategory) {
                query.categoryId = prescriptionCategory._id;
            }
        } else if (filter === 'otc') {
            // Find Category with name "Thuốc không theo đơn"
            const otcCategory = await Category.findOne({
                categoryName: 'Thuốc không theo đơn'
            });
            if (otcCategory) {
                query.categoryId = otcCategory._id;
            }
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseInt(minPrice);
            if (maxPrice) query.price.$lte = parseInt(maxPrice);
        }

        // Filter by brand
        if (brand) {
            query.brand = { $regex: brand, $options: 'i' };
        }

        // Filter by origin
        if (origin) {
            query.origin = { $regex: origin, $options: 'i' };
        }

        // Find central warehouse
        const centralWarehouse = await Warehouse.findOne({ warehouseType: 'central' });
        const centralWarehouseId = centralWarehouse?._id;

        console.log('Central warehouse:', centralWarehouse ? centralWarehouse.warehouseName : 'NOT FOUND');
        // If no central warehouse, don't filter by warehouse (show all stock)

        // If inStockOnly is enabled, we need to get ALL products first, calculate stock, filter, then paginate
        if (inStockOnly === 'true') {
            // Get ALL products matching query (no pagination yet)
            const allProducts = await Product.find(query)
                .populate('manufacturerId', 'manufacturerName')
                .populate('categoryId', 'categoryName')
                .populate('img')
                .sort({ createdAt: -1 });

            // Calculate stock for each product
            const productsWithStock = await Promise.all(allProducts.map(async (p) => {
                const batchQuery = { productId: p._id };
                if (centralWarehouseId) {
                    batchQuery.warehouseId = centralWarehouseId;
                }

                const batches = await ProductBatch.find(batchQuery);
                const totalStock = batches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);

                const sortedBatches = batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
                const nearestExpiryDate = sortedBatches.length > 0 ? sortedBatches[0].expiryDate : null;

                return {
                    ...p.toObject(),
                    id: p._id,
                    cost: p.price,
                    category: p.categoryId?.categoryName || '',
                    quantity: totalStock,
                    expiryDate: nearestExpiryDate
                };
            }));

            // Filter products with stock > 0
            const inStockProducts = productsWithStock.filter(p => p.quantity > 0);

            // Apply pagination AFTER filtering
            const totalProducts = inStockProducts.length;
            const skip = (page - 1) * limit;
            const paginatedProducts = inStockProducts.slice(skip, skip + limit);

            return res.status(200).json({
                data: paginatedProducts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalDocs: totalProducts,
                    limit: limit
                },
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                totalProducts
            });
        }

        // Normal flow - sort by pre-calculated stockQuantity (in-stock first)
        const skip = (page - 1) * limit;
        const products = await Product.find(query)
            .skip(skip)
            .limit(limit)
            .populate('manufacturerId', 'manufacturerName')
            .populate('categoryId', 'categoryName')
            .populate('img')
            .sort({ stockQuantity: -1, createdAt: -1 }); // Sort by stock DESC, then by date

        const totalProducts = await Product.countDocuments(query);

        // Map products to response format using pre-calculated fields
        const productsWithStock = products.map((p) => {
            const pObj = p.toObject();
            return {
                ...pObj,
                id: p._id,
                cost: p.price,
                category: p.categoryId?.categoryName || '',
                quantity: p.stockQuantity || 0, // Use pre-calculated field
                expiryDate: p.nearestExpiryDate || null
            };
        });

        res.status(200).json({
            data: productsWithStock,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                totalDocs: totalProducts,
                limit: limit
            },
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id)
            .populate('manufacturerId', 'manufacturerName')
            .populate('categoryId', 'categoryName');

        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getProductBatches = async (req, res) => {
    try {
        const { id } = req.params;
        const batches = await ProductBatch.find({ productId: id }).sort({ expiryDate: 1 });

        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllBatches = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Supports filtering by warehouseId
        const { warehouseId } = req.query;
        const query = {};

        if (warehouseId && warehouseId !== 'all') {
            query.warehouseId = warehouseId;
        }

        const batches = await ProductBatch.find(query)
            .populate('productId', 'productName unit packagingType')
            .populate('warehouseId', 'warehouseName') // Populate warehouse name
            .sort({ expiryDate: 1 })
            .skip(skip)
            .limit(limit);

        const total = await ProductBatch.countDocuments();

        res.status(200).json({
            data: batches,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Bulk create batches (Import goods)
export const createBulkBatches = async (req, res) => {
    try {
        const { batches, warehouseId } = req.body; // Array of { productId, quantity, manufactureDate, expiryDate }

        if (!batches || !Array.isArray(batches) || batches.length === 0) {
            return res.status(400).json({ message: "Danh sách lô hàng trống" });
        }
        if (!warehouseId) {
            return res.status(400).json({ message: "Kho nhập hàng là bắt buộc" });
        }

        const createdBatches = [];
        const purchaseInvoiceId = new mongoose.Types.ObjectId(); // Shared ID for this import session

        for (const batch of batches) {
            const { productId, quantity, unit, manufactureDate, expiryDate } = batch;

            if (!productId || !quantity || quantity <= 0) continue;

            const product = await Product.findById(productId);
            if (!product) continue;

            // Convert to base unit
            const { convertToBaseUnit } = await import('../utils/unitConverter.js');
            const { baseQuantity, baseUnit } = await convertToBaseUnit(
                productId,
                quantity,
                unit || product.unit || 'Đơn vị'
            );

            const newBatch = new ProductBatch({
                productId,
                purchaseInvoiceId,
                warehouseId,
                quantity: baseQuantity,
                remainingQuantity: baseQuantity,
                baseUnit: baseUnit,
                manufactureDate,
                expiryDate,
                dosage: product.unit || 'Viên',
                administration: 'Uống'
            });
            await newBatch.save();
            createdBatches.push(newBatch);
        }

        // Update stockQuantity for all affected products
        const uniqueProductIds = [...new Set(createdBatches.map(b => b.productId.toString()))];
        for (const pid of uniqueProductIds) {
            await updateProductStock(pid);
        }

        res.status(201).json(createdBatches);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const createBatch = async (req, res) => {
    try {
        const { productId, quantity, manufactureDate, expiryDate, warehouseId } = req.body;

        // Validation
        if (!productId || !quantity || !manufactureDate || !expiryDate) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }
        if (!warehouseId) {
            return res.status(400).json({ message: "Kho nhập hàng là bắt buộc" });
        }
        if (quantity <= 0) {
            return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

        // Convert to base unit
        const { convertToBaseUnit } = await import('../utils/unitConverter.js');
        const { baseQuantity, baseUnit } = await convertToBaseUnit(
            productId,
            quantity,
            product.unit || 'Đơn vị'
        );

        // Create Batch
        const newBatch = new ProductBatch({
            productId,
            purchaseInvoiceId: new mongoose.Types.ObjectId(),
            warehouseId,
            quantity: baseQuantity,
            remainingQuantity: baseQuantity,
            baseUnit: baseUnit,
            manufactureDate,
            expiryDate,
            dosage: product.unit || 'Viên',
            administration: 'Uống'
        });
        await newBatch.save();

        // Update stockQuantity
        await updateProductStock(productId);

        res.status(201).json(newBatch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, remainingQuantity, manufactureDate, expiryDate } = req.body;

        const updatedBatch = await ProductBatch.findByIdAndUpdate(
            id,
            { quantity, remainingQuantity, manufactureDate, expiryDate },
            { new: true }
        );

        if (!updatedBatch) return res.status(404).json({ message: "Lô hàng không tồn tại" });

        // Update stockQuantity
        await updateProductStock(updatedBatch.productId);

        res.status(200).json(updatedBatch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// Get all batches belonging to a specific invoice (Lô hàng gộp)
export const getBatchesByInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const batches = await ProductBatch.find({ purchaseInvoiceId: invoiceId })
            .populate('productId', 'productName')
            .sort({ createdAt: 1 });
        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update/Sync an entire batch group (invoice)
export const updateBatchGroup = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { batches } = req.body; // List of items { _id (optional), productId, quantity, ... }

        if (!batches || !Array.isArray(batches)) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }

        // 1. Identify items to update vs create
        const updates = [];
        const creates = [];
        const keptIds = [];

        for (const item of batches) {
            if (item._id) {
                updates.push(item);
                keptIds.push(item._id);
            } else {
                creates.push(item);
            }
        }

        // 2. Perform Updates
        for (const item of updates) {
            await ProductBatch.findByIdAndUpdate(item._id, {
                quantity: item.quantity,
                remainingQuantity: item.remainingQuantity,
                manufactureDate: item.manufactureDate,
                expiryDate: item.expiryDate
            });
        }

        // 3. Perform Creates (Add new products to existing invoice)
        for (const item of creates) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            const newBatch = new ProductBatch({
                productId: item.productId,
                purchaseInvoiceId: invoiceId, // Link to SAME invoice
                manufactureDate: item.manufactureDate,
                expiryDate: item.expiryDate,
                quantity: item.quantity,
                remainingQuantity: item.quantity,
                dosage: product.unit || 'Viên',
                administration: 'Uống'
            });
            await newBatch.save();
        }

        // 4. Delete removed items
        // DISABLED: Since frontend limits display to 20 items, we CANNOT auto-delete missing items.
        // await ProductBatch.deleteMany({ 
        //     purchaseInvoiceId: invoiceId, 
        //     _id: { $nin: keptIds } 
        // });

        res.status(200).json({ message: "Cập nhật lô hàng thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const deleteBatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const batch = await ProductBatch.findById(id).session(session);
        if (!batch) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Lô hàng không tồn tại' });
        }

        const quantityToRestore = batch.remainingQuantity;
        const transferId = batch.transferId;

        // If batch came from a transfer, restore stock to source warehouse
        if (transferId) {
            const transfer = await InventoryTransfer.findById(transferId).session(session);

            if (transfer) {
                // Find source batches for this product at source warehouse (FIFO order)
                const sourceBatches = await ProductBatch.find({
                    productId: batch.productId,
                    warehouseId: transfer.fromWarehouseId
                }).sort({ expiryDate: 1 }).session(session);

                let remaining = quantityToRestore;

                // Restore stock to source batches
                for (const sourceBatch of sourceBatches) {
                    if (remaining <= 0) break;

                    // Calculate how much we can restore to this batch
                    const maxRestore = sourceBatch.quantity - sourceBatch.remainingQuantity;
                    const restoreQty = Math.min(remaining, maxRestore);

                    if (restoreQty > 0) {
                        await ProductBatch.updateOne(
                            { _id: sourceBatch._id },
                            { $inc: { remainingQuantity: restoreQty } },
                            { session }
                        );
                        remaining -= restoreQty;
                    }
                }

                // If we couldn't restore to existing batches, create a new one
                if (remaining > 0) {
                    await ProductBatch.create([{
                        productId: batch.productId,
                        warehouseId: transfer.fromWarehouseId,
                        quantity: remaining,
                        remainingQuantity: remaining,
                        baseUnit: batch.baseUnit,
                        manufactureDate: batch.manufactureDate,
                        expiryDate: batch.expiryDate,
                        dosage: batch.dosage,
                        administration: batch.administration,
                        purchaseInvoiceId: batch.purchaseInvoiceId
                    }], { session });
                }
            }
        }

        // Delete the batch
        await ProductBatch.deleteOne({ _id: id }, { session });

        // Check if transfer has any remaining batches - if not, delete the transfer
        let transferDeleted = false;
        if (transferId) {
            const remainingBatches = await ProductBatch.countDocuments({
                transferId: transferId,
                _id: { $ne: id }  // Exclude the just-deleted batch
            }).session(session);

            if (remainingBatches === 0) {
                // No more batches from this transfer - delete the transfer
                await InventoryTransfer.deleteOne({ _id: transferId }, { session });
                transferDeleted = true;
            }
        }

        await session.commitTransaction();

        // Update stockQuantity for the affected product
        await updateProductStock(batch.productId);

        let message = 'Đã xóa lô hàng';
        if (transferId && quantityToRestore > 0) {
            message = `Đã xóa lô hàng và hoàn trả ${quantityToRestore} về kho nguồn`;
        }
        if (transferDeleted) {
            message += '. Phiếu chuyển đã được xóa (hết sản phẩm).';
        }

        res.status(200).json({
            message,
            restoredQuantity: transferId ? quantityToRestore : 0,
            transferDeleted
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error deleting batch:', error);
        res.status(500).json({ message: 'Lỗi khi xóa lô hàng' });
    } finally {
        session.endSession();
    }
};
