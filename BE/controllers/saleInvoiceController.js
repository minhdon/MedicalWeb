import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import { SaleInvoiceDetail } from '../models/saleInvoice/SaleInvoiceDetail.js';
import { ProductBatch } from '../models/product/ProductBatch.js';
import { Product } from '../models/product/Product.js';
import { User } from '../models/auth/User.js';
import { OrderStatus } from '../models/saleInvoice/OrderStatus.js';
import { Role } from '../models/auth/Role.js'; // Import Role
import { Warehouse } from '../models/warehouse/Warehouse.js';
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
        // EXCEPTION: If in-store but paying via VNPay, set to Pending until payment confirms
        const isPendingPayment = !isInStoreSale || (isInStoreSale && (customerInfo.paymentMethod === 'VNPay' || req.body.paymentMethod === 'VNPay'));
        const statusName = isPendingPayment ? 'Pending' : 'Confirmed';

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

        // 4. Determine warehouse for stock deduction
        let salesWarehouseId = warehouseId;
        if (!salesWarehouseId) {
            // For online sales, use central warehouse
            const centralWarehouse = await Warehouse.findOne({ warehouseType: 'central' }).session(session);
            if (!centralWarehouse) {
                throw new Error('Chưa cấu hình kho tổng. Vui lòng liên hệ admin.');
            }
            salesWarehouseId = centralWarehouse._id;
        }

        // Debug: Log which warehouse is being used
        const warehouseInfo = await Warehouse.findById(salesWarehouseId).session(session);
        console.log(`📦 Stock deduction from: ${warehouseInfo?.warehouseName || 'Unknown'} (${salesWarehouseId})`);
        console.log(`   isInStoreSale: ${isInStoreSale}, warehouseId from request: ${warehouseId || 'NONE'}`);

        // 5. Process Cart Items & Inventory (WITH UNIT CONVERSION)
        for (const item of cartItems) {
            const productId = item.id || item._id;

            // CRITICAL: Convert customer's unit to base unit
            const { convertToBaseUnit } = await import('../utils/unitConverter.js');
            const { baseQuantity, baseUnit, ratio } = await convertToBaseUnit(
                productId,
                item.quantity,
                item.unit || 'Đơn vị'  // Unit customer selected in cart
            );

            // Calculate price per base unit
            // If customer bought 2 Hộp at 5000đ/Hộp, and 1 Hộp = 10 Viên
            // Then unitPriceBase = 5000 / 10 = 500đ/Viên
            const conversionRatio = ratio || (baseQuantity / item.quantity) || 1;
            const unitPriceBase = item.cost / conversionRatio;

            let remainingReq = baseQuantity;  // Now in base unit!

            // Verify Stock (filter by warehouse!)
            const batches = await ProductBatch.find({
                productId: productId,
                warehouseId: salesWarehouseId,  // CRITICAL: Only from sales warehouse
                remainingQuantity: { $gt: 0 },
                expiryDate: { $gt: new Date() }
            }).sort({ expiryDate: 1 }).session(session);

            let totalAvailable = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
            if (totalAvailable < baseQuantity) {
                throw new Error(`Sản phẩm ${item.productName || productId} không đủ tồn kho (Cần: ${baseQuantity} ${baseUnit}, Còn: ${totalAvailable} ${baseUnit})`);
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
                    quantity: deduct,  // Stored in base unit
                    unitPrice: unitPriceBase,  // Price per base unit
                    totalPrice: deduct * unitPriceBase  // Correct total
                }], { session });

                remainingReq -= deduct;
            }
            calculatedTotal += item.quantity * item.cost;  // Use original quantity for price calc
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

        // Get order details for each order
        const formattedOrders = await Promise.all(orders.map(async (order) => {
            // Fetch order items from SaleInvoiceDetail
            const details = await SaleInvoiceDetail.find({ saleInvoiceId: order._id })
                .populate('productId', 'productName');

            const items = details.map(d => ({
                productId: d.productId?._id,
                medicineName: d.productId?.productName || 'Unknown',
                quantity: d.quantity,
                price: d.unitPrice,
                total: d.totalPrice
            }));

            // Calculate total quantity across all items
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

            return {
                id: order._id,
                customerName: order.userId?.fullName || 'Guest',
                customerPhone: order.userId?.phoneNum || '',
                customerAddress: order.shippingAddress || order.userId?.address || '',
                items: items,
                itemCount: items.length,
                totalQuantity: totalQuantity,  // Total units ordered
                total: order.totalAmount,
                status: order.statusId?.statusName || 'Unknown',
                deliveryBranch: order.warehouseId?.warehouseName || null,
                warehouseId: order.warehouseId?._id || null,
                isInStoreSale: order.isInStoreSale || false,
                staffName: order.staffId?.fullName || null,
                paymentMethod: order.paymentMethod,
                createdAt: order.createdAt
            };
        }));

        res.status(200).json(formattedOrders);
    } catch (error) {
        console.error("Get All Orders Error:", error);
        res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng" });
    }
};

// Get Order By ID (for Invoice display)
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await SaleInvoice.findById(id)
            .populate('userId', 'fullName phoneNum address email')
            .populate('statusId', 'statusName')
            .populate('warehouseId', 'warehouseName address')
            .populate('staffId', 'fullName');

        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        // Get order items
        const details = await SaleInvoiceDetail.find({ saleInvoiceId: id })
            .populate('productId', 'productName unit');

        const items = details.map(d => ({
            productId: d.productId?._id,
            productName: d.productId?.productName || 'Sản phẩm',
            quantity: d.quantity,
            unit: d.unit || d.productId?.unit || 'Đơn vị',
            unitPrice: d.unitPrice,
            totalPrice: d.totalPrice
        }));

        res.status(200).json({
            _id: order._id,
            customerId: order.userId,
            customerName: order.userId?.fullName || 'Khách hàng',
            customerPhone: order.userId?.phoneNum || '',
            customerAddress: order.shippingAddress || order.userId?.address || '',
            details: items,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod || 'COD',
            paymentStatus: order.paymentStatus || 'pending',
            status: order.statusId?.statusName || 'Pending',
            vnpayTransactionNo: order.vnpayTransactionNo || null,
            vnpayPayDate: order.vnpayPayDate || null,
            createdAt: order.createdAt,
            // New fields
            staffName: order.staffId?.fullName || null,
            branchName: order.warehouseId?.warehouseName || null,
            branchAddress: order.warehouseId?.address || null,
            isInStoreSale: order.isInStoreSale || false
        });
    } catch (error) {
        console.error("Get Order By ID Error:", error);
        res.status(500).json({ message: 'Lỗi lấy thông tin đơn hàng' });
    }
};

// Helper: Restore Stock for Order
export const restoreStockForOrder = async (orderId, session) => {
    // Find order details
    const details = await SaleInvoiceDetail.find({ saleInvoiceId: orderId }).session(session);

    let restoredCount = 0;

    for (const detail of details) {
        // Find batch and check if it still exists
        const batch = await ProductBatch.findById(detail.batchId).session(session);

        if (batch) {
            batch.remainingQuantity += detail.quantity;
            await batch.save({ session });
            restoredCount += detail.quantity;
        } else {
            // Log warning if batch not found (rare case)
            console.warn(`Cannot restore stock: Batch ${detail.batchId} not found for detail ${detail._id}`);
        }
    }

    console.log(`Restored ${restoredCount} items for order ${orderId}`);
    return restoredCount;
};

// Update Order (for Admin - assign branch, change status)
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { warehouseId, statusName, note } = req.body;

        const updateData = {};
        const order = await SaleInvoice.findById(id);

        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

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

            // CHECK LOGIC: If changing to 'Cancelled', restore stock
            const cancelledStatus = await OrderStatus.findOne({ statusName: 'Cancelled' });

            // If new status is Cancelled AND current status is NOT Cancelled
            if (statusName === 'Cancelled' && order.statusId?.toString() !== cancelledStatus?._id?.toString()) {
                // Start a session for atomic operation if possible, but here we might just run it
                // Ideally we wrap the whole controller in a transaction, but for now we follow existing pattern or add minimalist transaction
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    await restoreStockForOrder(id, session);
                    await session.commitTransaction();
                } catch (err) {
                    await session.abortTransaction();
                    throw err;
                } finally {
                    session.endSession();
                }
            }
        }

        // Update note
        if (note !== undefined) {
            updateData.note = note;
        }

        // Apply updates
        const updatedOrder = await SaleInvoice.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate('warehouseId', 'warehouseName')
            .populate('statusId', 'statusName');

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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        // Find the order first to check its status
        const order = await SaleInvoice.findById(id).populate('statusId', 'statusName').session(session);
        if (!order) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        // Check if order was already cancelled (stock already restored)
        const isAlreadyCancelled = order.statusId?.statusName === 'Cancelled';

        let restoredQuantity = 0;

        // Only restore stock if order was NOT cancelled
        if (!isAlreadyCancelled) {
            // Find order details to restore stock
            const details = await SaleInvoiceDetail.find({ saleInvoiceId: id }).session(session);

            // Restore stock to batches
            for (const detail of details) {
                await ProductBatch.updateOne(
                    { _id: detail.batchId },
                    { $inc: { remainingQuantity: detail.quantity } },
                    { session }
                );
                restoredQuantity += detail.quantity;
            }
        }

        // Delete order details
        await SaleInvoiceDetail.deleteMany({ saleInvoiceId: id }, { session });

        // Delete the order
        await SaleInvoice.findByIdAndDelete(id, { session });

        await session.commitTransaction();

        const message = isAlreadyCancelled
            ? 'Đã xóa đơn hàng (đã hủy trước đó, không hoàn kho)'
            : (restoredQuantity > 0
                ? `Đã xóa đơn hàng và hoàn trả ${restoredQuantity} sản phẩm về kho`
                : 'Đã xóa đơn hàng');

        res.status(200).json({
            message,
            restoredQuantity
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Delete Order Error:", error);
        res.status(500).json({ message: 'Lỗi khi xóa đơn hàng' });
    } finally {
        session.endSession();
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
