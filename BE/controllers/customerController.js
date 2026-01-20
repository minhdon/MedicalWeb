import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';
import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import bcrypt from 'bcrypt';

// Get all customers with stats
export const getAllCustomers = async (req, res) => {
    try {
        const customerRole = await Role.findOne({ roleName: 'Customer' });

        // If role doesn't exist, try finding 'Khách hàng' or just return empty
        if (!customerRole) {
            // Create role if not exists? Or just return empty.
            // Let's assume for now we return empty or try to find users who might be customers
            return res.status(200).json({ data: [] });
        }

        const customers = await User.aggregate([
            { $match: { roleId: customerRole._id } },
            {
                $lookup: {
                    from: 'saleinvoices',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'invoices'
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: '$invoices' },
                    totalSpent: { $sum: '$invoices.totalAmount' }
                }
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    phoneNum: 1,
                    email: 1,
                    address: 1,
                    createdAt: 1,
                    totalOrders: 1,
                    totalSpent: 1
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.status(200).json({ data: customers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tải danh sách khách hàng' });
    }
};

// Search customer by phone number (for staff in-store sales)
export const searchCustomerByPhone = async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone || phone.length < 3) {
            return res.status(200).json({ found: false, customer: null });
        }

        // Search by phone number (partial match)
        const customer = await User.findOne({
            phoneNum: { $regex: phone, $options: 'i' }
        }).select('_id fullName phoneNum email');

        if (customer) {
            return res.status(200).json({
                found: true,
                customer: {
                    id: customer._id,
                    name: customer.fullName,
                    phone: customer.phoneNum,
                    email: customer.email
                }
            });
        }

        res.status(200).json({ found: false, customer: null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tìm kiếm khách hàng' });
    }
};

// Create new customer
export const createCustomer = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Tên khách hàng là bắt buộc' });
        }
        if (!phone || !phone.trim()) {
            return res.status(400).json({ message: 'Số điện thoại là bắt buộc' });
        }

        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();

        // Check if phone already exists (check both userName and phoneNum)
        const existingUser = await User.findOne({
            $or: [
                { userName: trimmedPhone },
                { phoneNum: trimmedPhone }
            ]
        }).populate('roleId', 'roleName');

        if (existingUser) {
            const roleName = existingUser.roleId?.roleName || 'Không xác định';
            const userName = existingUser.fullName || 'Không có tên';
            return res.status(400).json({
                message: `Số điện thoại đã được đăng ký (Thuộc về: ${userName} - Role: ${roleName})`
            });
        }

        // Find or Create Customer Role
        let customerRole = await Role.findOne({ roleName: 'Customer' });
        if (!customerRole) {
            customerRole = await Role.create({ roleName: 'Customer', description: 'Khách hàng mua thuốc' });
        }

        // Create User
        // Default password for customers created by admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const newUser = new User({
            fullName: trimmedName,
            userName: trimmedPhone, // Use phone as username
            phoneNum: trimmedPhone,
            email: email?.trim() || '',
            address: address?.trim() || '',
            passWord: hashedPassword,
            roleId: customerRole._id
        });

        await newUser.save();

        res.status(201).json({ message: 'Thêm khách hàng thành công', data: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi thêm khách hàng' });
    }
};

// Update customer
export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                fullName: name,
                phoneNum: phone,
                userName: phone, // Assuming we keep username synced with phone
                email,
                address
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Khách hàng không tồn tại' });
        }

        res.status(200).json({ message: 'Cập nhật thành công', data: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi cập nhật khách hàng' });
    }
};

// Delete customer (with cascade delete of related orders)
export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if customer exists first
        const customer = await User.findById(id);
        if (!customer) {
            return res.status(404).json({ message: 'Khách hàng không tồn tại' });
        }

        // Find all orders for this customer
        const orders = await SaleInvoice.find({ userId: id });
        const orderIds = orders.map(o => o._id);

        // Delete related order details
        if (orderIds.length > 0) {
            const { SaleInvoiceDetail } = await import('../models/saleInvoice/SaleInvoiceDetail.js');
            const detailsDeleted = await SaleInvoiceDetail.deleteMany({ saleInvoiceId: { $in: orderIds } });
            console.log(`Deleted ${detailsDeleted.deletedCount} order details for customer ${id}`);
        }

        // Delete all orders for this customer
        const ordersDeleted = await SaleInvoice.deleteMany({ userId: id });
        console.log(`Deleted ${ordersDeleted.deletedCount} orders for customer ${id}`);

        // Finally delete the customer
        await User.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Đã xóa khách hàng và các đơn hàng liên quan',
            deletedOrders: ordersDeleted.deletedCount
        });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ message: 'Lỗi khi xóa khách hàng: ' + error.message });
    }
};

// Reset customer password (Admin function)
export const resetCustomerPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        const customer = await User.findById(id);
        if (!customer) {
            return res.status(404).json({ message: 'Khách hàng không tồn tại' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        customer.passWord = hashedPassword;
        await customer.save();

        res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Lỗi khi đặt lại mật khẩu' });
    }
};

