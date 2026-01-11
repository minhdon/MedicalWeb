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
        const { customerInfo, cartItems, totalAmount } = req.body;
        // customerInfo: { name, phone, email, address, paymentMethod, ... }
        // cartItems: [{ id, quantity, cost, unit, ... }]

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

        // 2. Find Order Status (Pending)
        let status = await OrderStatus.findOne({ statusName: 'Pending' }).session(session);
        if (!status) {
            // Create if not exists (seed fallback)
            status = await OrderStatus.create([{ statusName: 'Pending' }], { session });
            status = status[0];
        }

        // 3. Create SaleInvoice
        const newInvoice = await SaleInvoice.create([{
            userId: user._id,
            warehouseId: null, // Default to Online/Unassigned
            saleDate: new Date(),
            statusId: status._id,
            shippingAddress: customerInfo.address,
            paymentMethod: customerInfo.paymentMethod || 'COD',
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
            .populate('warehouseId', 'warehouseName')
            .sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            id: order._id,
            customerName: order.userId?.fullName || 'Guest',
            customerPhone: order.userId?.phoneNum || '',
            customerAddress: order.shippingAddress || order.userId?.address || '',
            total: order.totalAmount,
            status: order.statusId?.statusName || 'Unknown',
            deliveryBranch: order.warehouseId?.warehouseName || null,
            createdAt: order.createdAt
        }));

        res.status(200).json(formattedOrders);
    } catch (error) {
        console.error("Get All Orders Error:", error);
        res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng" });
    }
};
