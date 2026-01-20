import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import { Product } from '../models/product/Product.js';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';
import { InventoryTransfer } from '../models/warehouse/InventoryTransfer.js';
import { OrderStatus } from '../models/saleInvoice/OrderStatus.js';

export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Revenue Stats - only count paid orders
        const revenueAgg = await SaleInvoice.aggregate([
            {
                $match: {
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    todayRevenue: {
                        $sum: {
                            $cond: [{ $gte: ["$createdAt", today] }, "$totalAmount", 0]
                        }
                    }
                }
            }
        ]);

        const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
        const todayRevenue = revenueAgg[0]?.todayRevenue || 0;

        // 2. Order Counts
        const totalOrders = await SaleInvoice.countDocuments();
        const pendingStatus = await OrderStatus.findOne({ statusName: 'Pending' });
        const pendingOrders = pendingStatus
            ? await SaleInvoice.countDocuments({ statusId: pendingStatus._id })
            : 0;

        // 3. Product Stats
        const totalProducts = await Product.countDocuments();
        const lowStockCount = await Product.countDocuments({ stockQuantity: { $lt: 10 } });

        // 4. Customer Stats
        const customerRole = await Role.findOne({ roleName: 'Customer' });
        const totalCustomers = customerRole
            ? await User.countDocuments({ roleId: customerRole._id })
            : await User.countDocuments();

        // 5. Warehouse Stats
        const totalWarehouses = await Warehouse.countDocuments({ status: true });

        // 6. Transfer Stats
        const totalTransfers = await InventoryTransfer.countDocuments();
        const pendingTransfers = await InventoryTransfer.countDocuments({ status: 'Pending' });

        res.status(200).json({
            totalRevenue,
            todayRevenue,
            totalOrders,
            pendingOrders,
            totalProducts,
            lowStockCount,
            totalCustomers,
            totalWarehouses,
            totalTransfers,
            pendingTransfers
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Lỗi lấy thống kê dashboard" });
    }
};
