import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import { SaleInvoiceDetail } from '../models/saleInvoice/SaleInvoiceDetail.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Product } from '../models/product/Product.js';
import { User } from '../models/auth/User.js';
import { OrderStatus } from '../models/saleInvoice/OrderStatus.js';
import { Role } from '../models/auth/Role.js'; // Import Role
import mongoose from 'mongoose';

// Create Invoice (Checkout)
export const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerInfo, cartItems, totalAmount, warehouseId, staffId, isInStoreSale } = req.body;
        // customerInfo: { name, phone, email, address, paymentMethod, ... }
        // cartItems: [{ id, quantity, cost, unit, ... }]
        // warehouseId: string (for in-store sales by staff)
        // staffId: string (staff who processed the sale)
        // isInStoreSale: boolean (flag for in-store vs online)

        // 1. Find or Create User (Guest Handling)
        let user = await User.findOne({ phoneNum: customerInfo.phone }).session(session);
        if (!user) {
            // Find Default Role for Customer
            const customerRole = await Role.findOne({ roleName: 'Customer' }).session(session);
            const roleId = customerRole ? customerRole._id : null;

            user = await User.create([{
                fullName: customerInfo.name,
                userName: customerInfo.phone,
                passWord: "guestpassword123",
                email: customerInfo.email || "",
                phoneNum: customerInfo.phone,
                address: customerInfo.address,
                roleId: roleId,
            }], { session });
            user = user[0];
        }

        // 2. Find Order Status (Pending for online, Confirmed for in-store)
        const statusName = isInStoreSale ? 'Confirmed' : 'Pending';
        let status = await OrderStatus.findOne({ statusName: statusName }).session(session);
        if (!status) {
            // Create if not exists (seed fallback)
            status = await OrderStatus.create([{ statusName: statusName }], { session });
            status = status[0];
        }

        // 3. Create SaleInvoice
        const newInvoice = await SaleInvoice.create([{
            userId: user._id,
            warehouseId: warehouseId || null, // Use provided warehouseId for in-store sales
            staffId: staffId || null, // Staff who processed the sale
            isInStoreSale: isInStoreSale || false, // Flag for in-store sale
            saleDate: new Date(),
            statusId: status._id,
            shippingAddress: customerInfo.address,
            paymentMethod: isInStoreSale ? 'Tiền mặt' : (customerInfo.paymentMethod || 'COD'),
            totalAmount: totalAmount || 0, // Frontend sends total or we calc
            note: customerInfo.note
        }], { session });

        const invoiceId = newInvoice[0]._id;
        let calculatedTotal = 0;

        // 4. Process Cart Items & Inventory
        for (const item of cartItems) {
            const productId = item.id || item._id;
            const reqQty = item.quantity;
            let remainingReq = reqQty;

            // Verify Stock
            const batches = await ProductBatch.find({
                productId: productId,
                remainingQuantity: { $gt: 0 },
                expiryDate: { $gt: new Date() }
            }).sort({ expiryDate: 1 }).session(session);

            let totalAvailable = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
            if (totalAvailable < reqQty) {
                // throw new Error(`Sản phẩm ${item.productName} không đủ tồn kho`);
                // For demo/soft requirements, we might allow oversell or just ignore batch. 
                // Strict mode: throw error
                throw new Error(`Sản phẩm ${item.productName || productId} không đủ tồn kho (Còn: ${totalAvailable})`);
            }

            // Deduct Inventory
            for (const batch of batches) {
                if (remainingReq <= 0) break;
                const deduct = Math.min(batch.remainingQuantity, remainingReq);
                batch.remainingQuantity -= deduct;
                await batch.save({ session });

                await SaleInvoiceDetail.create([{
                    saleInvoiceId: invoiceId,
                    batchId: batch._id,
                    productId: productId,
                    quantity: deduct,
                    unitPrice: item.cost,
                    totalPrice: deduct * item.cost
                }], { session });

                remainingReq -= deduct;
            }
            calculatedTotal += reqQty * item.cost;
        }

        // Update Total if needed (if frontend calc was wrong)
        if (!totalAmount || totalAmount !== calculatedTotal) {
            newInvoice[0].totalAmount = calculatedTotal;
            await newInvoice[0].save({ session });
        }

        await session.commitTransaction();
        res.status(201).json({
            message: "Đặt hàng thành công",
            invoiceId,
            totalBill: calculatedTotal
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Order Error:", error);
        res.status(500).json({ message: error.message || "Lỗi tạo đơn hàng" });
    } finally {
        session.endSession();
    }
};

// Get All Orders (for Admin)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await SaleInvoice.find()
            .populate('userId', 'fullName phoneNum address')
            .populate('statusId', 'statusName')
            .populate('warehouseId', 'warehouseName') // Fixed: use warehouseName
            .populate('staffId', 'fullName') // staff who processed in-store sale
            .sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            id: order._id,
            customerName: order.userId?.fullName || 'Guest',
            customerPhone: order.userId?.phoneNum || '',
            customerAddress: order.shippingAddress || order.userId?.address || '',
            total: order.totalAmount,
            status: order.statusId?.statusName || 'Unknown',
            deliveryBranch: order.warehouseId?.warehouseName || null,
            warehouseId: order.warehouseId?._id || null,
            isInStoreSale: order.isInStoreSale || false,
            staffName: order.staffId?.fullName || null,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt
        }));

        res.status(200).json(formattedOrders);
    } catch (error) {
        console.error("Get All Orders Error:", error);
        res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng" });
    }
};

// Update Order (for Admin - assign branch, change status)
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { warehouseId, statusName, note } = req.body;

        const updateData = {};

        // Update warehouse (branch assignment)
        if (warehouseId) {
            updateData.warehouseId = warehouseId;
        }

        // Update status
        if (statusName) {
            const status = await OrderStatus.findOne({ statusName });
            if (!status) {
                // Create status if not exists
                const newStatus = await OrderStatus.create({ statusName });
                updateData.statusId = newStatus._id;
            } else {
                updateData.statusId = status._id;
            }
        }

        // Update note
        if (note !== undefined) {
            updateData.note = note;
        }

        const updatedOrder = await SaleInvoice.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate('warehouseId', 'warehouseName')
            .populate('statusId', 'statusName');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        res.status(200).json({
            message: 'Cập nhật đơn hàng thành công',
            data: {
                id: updatedOrder._id,
                deliveryBranch: updatedOrder.warehouseId?.warehouseName || null,
                status: updatedOrder.statusId?.statusName || 'Unknown'
            }
        });
    } catch (error) {
        console.error("Update Order Error:", error);
        res.status(500).json({ message: 'Lỗi khi cập nhật đơn hàng' });
    }
};

// Delete Order (for Admin)
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete order details first
        await SaleInvoiceDetail.deleteMany({ saleInvoiceId: id });

        // Delete the order
        await SaleInvoice.findByIdAndDelete(id);

        res.status(200).json({ message: 'Đã xóa đơn hàng' });
    } catch (error) {
        console.error("Delete Order Error:", error);
        res.status(500).json({ message: 'Lỗi khi xóa đơn hàng' });
    }
};

// ==================== ORDER ITEM EDITING APIs ====================

// Add item to existing order
export const addItemToOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId } = req.params;
        const { productId, quantity, unitPrice } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Thông tin sản phẩm không hợp lệ' });
        }

        // Get order to find warehouse
        const order = await SaleInvoice.findById(orderId).session(session);
        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        // Find available batch in the same warehouse
        const batch = await ProductBatch.findOne({
            productId,
            warehouseId: order.warehouseId,
            remainingQuantity: { $gte: quantity },
            expiryDate: { $gt: new Date() }
        }).sort({ expiryDate: 1 }).session(session);

        if (!batch) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Không đủ tồn kho hoặc sản phẩm đã hết hạn' });
        }

        // Deduct stock
        batch.remainingQuantity -= quantity;
        await batch.save({ session });

        // Create detail
        const detail = await SaleInvoiceDetail.create([{
            saleInvoiceId: orderId,
            batchId: batch._id,
            productId,
            quantity,
            unitPrice: unitPrice || batch.dosage,
            totalPrice: quantity * (unitPrice || 0)
        }], { session });

        // Update order total
        order.totalAmount = (order.totalAmount || 0) + detail[0].totalPrice;
        await order.save({ session });

        await session.commitTransaction();

        res.status(201).json({
            message: 'Đã thêm sản phẩm vào đơn hàng',
            data: detail[0]
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Add Item Error:", error);
        res.status(500).json({ message: error.message || 'Lỗi khi thêm sản phẩm' });
    } finally {
        session.endSession();
    }
};

// Remove item from order (and refund stock)
export const removeItemFromOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId, detailId } = req.params;

        // Get detail
        const detail = await SaleInvoiceDetail.findById(detailId).session(session);
        if (!detail || detail.saleInvoiceId.toString() !== orderId) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Chi tiết đơn hàng không tồn tại' });
        }

        // Refund stock to batch
        const batch = await ProductBatch.findById(detail.batchId).session(session);
        if (batch) {
            batch.remainingQuantity += detail.quantity;
            await batch.save({ session });
        }

        // Update order total
        const order = await SaleInvoice.findById(orderId).session(session);
        if (order) {
            order.totalAmount = Math.max(0, (order.totalAmount || 0) - detail.totalPrice);
            await order.save({ session });
        }

        // Delete detail
        await SaleInvoiceDetail.findByIdAndDelete(detailId).session(session);

        await session.commitTransaction();

        res.status(200).json({
            message: 'Đã xóa sản phẩm khỏi đơn hàng',
            refundedQuantity: detail.quantity
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Remove Item Error:", error);
        res.status(500).json({ message: error.message || 'Lỗi khi xóa sản phẩm' });
    } finally {
        session.endSession();
    }
};

// Update item quantity in order
export const updateOrderItem = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { detailId } = req.params;
        const { newQuantity } = req.body;

        if (!newQuantity || newQuantity <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Số lượng phải lớn hơn 0' });
        }

        // Get detail
        const detail = await SaleInvoiceDetail.findById(detailId).session(session);
        if (!detail) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Chi tiết đơn hàng không tồn tại' });
        }

        const oldQuantity = detail.quantity;
        const diff = newQuantity - oldQuantity;

        // Get batch
        const batch = await ProductBatch.findById(detail.batchId).session(session);
        if (!batch) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Lô hàng không tồn tại' });
        }

        // If increasing quantity, check stock
        if (diff > 0 && batch.remainingQuantity < diff) {
            await session.abortTransaction();
            return res.status(400).json({
                message: `Không đủ tồn kho. Có thể thêm tối đa: ${batch.remainingQuantity}`
            });
        }

        // Update batch stock
        batch.remainingQuantity -= diff;
        await batch.save({ session });

        // Update detail
        const priceDiff = diff * detail.unitPrice;
        detail.quantity = newQuantity;
        detail.totalPrice = newQuantity * detail.unitPrice;
        await detail.save({ session });

        // Update order total
        const order = await SaleInvoice.findById(detail.saleInvoiceId).session(session);
        if (order) {
            order.totalAmount = (order.totalAmount || 0) + priceDiff;
            await order.save({ session });
        }

        await session.commitTransaction();

        res.status(200).json({
            message: 'Đã cập nhật số lượng',
            data: {
                oldQuantity,
                newQuantity,
                stockChange: -diff
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Update Item Error:", error);
        res.status(500).json({ message: error.message || 'Lỗi khi cập nhật số lượng' });
    } finally {
        session.endSession();
    }
};
