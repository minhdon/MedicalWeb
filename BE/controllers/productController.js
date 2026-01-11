import { Product } from '../models/product/Product.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import mongoose from 'mongoose';
import { Manufacturer } from '../models/manufacturer/Manufacturer.js';
import { Category } from '../models/product/Category.js';

export const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Mặc định 12 sản phẩm/trang
        const skip = (page - 1) * limit;

        const { search, filter, minPrice, maxPrice, brand, origin } = req.query;
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

        const products = await Product.find(query)
            .skip(skip)
            .limit(limit)
            .populate('manufacturerId', 'manufacturerName')
            .populate('categoryId', 'categoryName')
            .populate('img') // Nếu img là reference
            .sort({ createdAt: -1 });

        const totalProducts = await Product.countDocuments(query);

        // Calculate real stock and nearest expiry from batches
        const productsWithStock = await Promise.all(products.map(async (p) => {
            const batches = await ProductBatch.find({ productId: p._id });
            const totalStock = batches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);

            const sortedBatches = batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            const nearestExpiryDate = sortedBatches.length > 0 ? sortedBatches[0].expiryDate : null;

            return {
                ...p.toObject(),
                cost: p.price, // Frontend expects 'cost' field
                category: p.categoryId?.categoryName || '', // Frontend uses this for prescription logic
                quantity: totalStock, // Override with real stock
                expiryDate: nearestExpiryDate
            };
        }));

        res.status(200).json({
            data: productsWithStock,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                totalDocs: totalProducts,
                limit: limit
            },
            // Keep old format for backward compatibility
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

        const batches = await ProductBatch.find()
            .populate('productId', 'productName unit packagingType')
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
        const { batches } = req.body; // Array of { productId, quantity, manufactureDate, expiryDate }

        if (!batches || !Array.isArray(batches) || batches.length === 0) {
            return res.status(400).json({ message: "Danh sách lô hàng trống" });
        }

        const createdBatches = [];
        const purchaseInvoiceId = new mongoose.Types.ObjectId(); // Shared ID for this import session

        for (const batch of batches) {
            const { productId, quantity, manufactureDate, expiryDate } = batch;

            const product = await Product.findById(productId);
            if (!product) continue; // Skip invalid products

            const newBatch = new ProductBatch({
                productId,
                purchaseInvoiceId,
                manufactureDate,
                expiryDate,
                quantity,
                remainingQuantity: quantity,
                dosage: product.unit || 'Viên',
                administration: 'Uống'
            });
            await newBatch.save();
            createdBatches.push(newBatch);
        }

        res.status(201).json(createdBatches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBatch = async (req, res) => {
    try {
        const { productId, quantity, manufactureDate, expiryDate } = req.body;

        // Validation
        if (!productId || !quantity || !manufactureDate || !expiryDate) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

        // Create Batch
        const newBatch = new ProductBatch({
            productId,
            purchaseInvoiceId: new mongoose.Types.ObjectId(), // Mock ID
            manufactureDate,
            expiryDate,
            quantity,
            remainingQuantity: quantity,
            dosage: product.unit || 'Viên',
            administration: 'Uống'
        });

        await newBatch.save();
        res.status(201).json(newBatch);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        res.status(200).json(updatedBatch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;
        await ProductBatch.findByIdAndDelete(id);
        res.status(200).json({ message: "Xóa lô hàng thành công" });
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
