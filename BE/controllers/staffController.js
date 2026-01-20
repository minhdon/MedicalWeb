/**
 * Staff Management Controller
 */
import bcrypt from 'bcrypt';
import { User } from '../models/auth/User.js';
import { Role } from '../models/auth/Role.js';
import { Warehouse } from '../models/warehouse/Warehouse.js';

/**
 * Get all staff members (Admin, Staff roles)
 * GET /api/staff
 */
export const getAllStaff = async (req, res) => {
    try {
        // Find roles for Admin and Staff
        const staffRoles = await Role.find({
            roleName: { $in: ['Admin', 'Staff'] }
        });
        const roleIds = staffRoles.map(r => r._id);

        // Get users with these roles
        const staff = await User.find({ roleId: { $in: roleIds } })
            .populate('roleId', 'roleName')
            .populate('warehouseId', 'warehouseName address')
            .select('-passWord') // Exclude password
            .sort({ createdAt: -1 });

        const formattedStaff = staff.map(s => ({
            id: s._id,
            fullName: s.fullName || s.userName,
            userName: s.userName,
            email: s.email,
            phoneNum: s.phoneNum,
            address: s.address,
            DoB: s.DoB,
            sex: s.sex,
            role: s.roleId?.roleName || 'Unknown',
            roleId: s.roleId?._id,
            warehouse: s.warehouseId ? {
                id: s.warehouseId._id,
                name: s.warehouseId.warehouseName,
                address: s.warehouseId.address
            } : null,
            warehouseId: s.warehouseId?._id || null,
            isActive: s.isActive !== false, // Default to true if not set
            createdAt: s.createdAt
        }));

        res.status(200).json(formattedStaff);
    } catch (error) {
        console.error('Get All Staff Error:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách nhân viên' });
    }
};

/**
 * Get all roles
 * GET /api/staff/roles
 */
export const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find().sort({ roleName: 1 });
        res.status(200).json(roles.map(r => ({
            id: r._id,
            name: r.roleName,
            description: r.description
        })));
    } catch (error) {
        console.error('Get All Roles Error:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách vai trò' });
    }
};

/**
 * Get staff by ID
 * GET /api/staff/:id
 */
export const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await User.findById(id)
            .populate('roleId', 'roleName')
            .populate('warehouseId', 'warehouseName address')
            .select('-passWord');

        if (!staff) {
            return res.status(404).json({ message: 'Nhân viên không tồn tại' });
        }

        res.status(200).json({
            id: staff._id,
            fullName: staff.fullName || staff.userName,
            userName: staff.userName,
            email: staff.email,
            phoneNum: staff.phoneNum,
            address: staff.address,
            DoB: staff.DoB,
            sex: staff.sex,
            role: staff.roleId?.roleName,
            roleId: staff.roleId?._id,
            warehouse: staff.warehouseId ? {
                id: staff.warehouseId._id,
                name: staff.warehouseId.warehouseName
            } : null,
            warehouseId: staff.warehouseId?._id,
            isActive: staff.isActive !== false,
            createdAt: staff.createdAt
        });
    } catch (error) {
        console.error('Get Staff By ID Error:', error);
        res.status(500).json({ message: 'Lỗi lấy thông tin nhân viên' });
    }
};

/**
 * Create new staff member
 * POST /api/staff
 */
export const createStaff = async (req, res) => {
    try {
        const { fullName, userName, email, passWord, phoneNum, address, DoB, sex, roleId, warehouseId } = req.body;

        // Validate required fields
        if (!userName || !passWord || !email) {
            return res.status(400).json({ message: 'Tên đăng nhập, mật khẩu và email là bắt buộc' });
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ userName }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(passWord, 10);

        // Get role (default to Staff if not provided)
        let role = null;
        if (roleId) {
            role = await Role.findById(roleId);
        }
        if (!role) {
            role = await Role.findOne({ roleName: 'Staff' });
            if (!role) {
                role = await Role.create({ roleName: 'Staff', description: 'Nhân viên' });
            }
        }

        // Create user
        const newStaff = await User.create({
            fullName: fullName || userName,
            userName,
            email,
            passWord: hashedPassword,
            phoneNum,
            address,
            DoB: DoB ? new Date(DoB) : null,
            sex,
            roleId: role._id,
            warehouseId: warehouseId || null,
            isActive: true
        });

        res.status(201).json({
            message: 'Tạo nhân viên thành công',
            data: {
                id: newStaff._id,
                fullName: newStaff.fullName,
                userName: newStaff.userName,
                email: newStaff.email,
                role: role.roleName
            }
        });
    } catch (error) {
        console.error('Create Staff Error:', error);
        res.status(500).json({ message: error.message || 'Lỗi tạo nhân viên' });
    }
};

/**
 * Update staff member
 * PUT /api/staff/:id
 */
export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, phoneNum, address, DoB, sex, roleId, warehouseId } = req.body;

        const staff = await User.findById(id);
        if (!staff) {
            return res.status(404).json({ message: 'Nhân viên không tồn tại' });
        }

        // Check email uniqueness (if changed)
        if (email && email !== staff.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: id } });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email đã được sử dụng' });
            }
        }

        // Update fields
        if (fullName) staff.fullName = fullName;
        if (email) staff.email = email;
        if (phoneNum !== undefined) staff.phoneNum = phoneNum;
        if (address !== undefined) staff.address = address;
        if (DoB) staff.DoB = new Date(DoB);
        if (sex !== undefined) staff.sex = sex;
        if (roleId) staff.roleId = roleId;
        if (warehouseId !== undefined) staff.warehouseId = warehouseId || null;

        await staff.save();

        // Reload with populated fields
        const updatedStaff = await User.findById(id)
            .populate('roleId', 'roleName')
            .populate('warehouseId', 'warehouseName');

        res.status(200).json({
            message: 'Cập nhật nhân viên thành công',
            data: {
                id: updatedStaff._id,
                fullName: updatedStaff.fullName,
                email: updatedStaff.email,
                role: updatedStaff.roleId?.roleName,
                warehouse: updatedStaff.warehouseId?.warehouseName
            }
        });
    } catch (error) {
        console.error('Update Staff Error:', error);
        res.status(500).json({ message: error.message || 'Lỗi cập nhật nhân viên' });
    }
};

/**
 * Delete staff member
 * DELETE /api/staff/:id
 */
export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await User.findById(id);
        if (!staff) {
            return res.status(404).json({ message: 'Nhân viên không tồn tại' });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({ message: 'Xóa nhân viên thành công' });
    } catch (error) {
        console.error('Delete Staff Error:', error);
        res.status(500).json({ message: 'Lỗi xóa nhân viên' });
    }
};

/**
 * Reset staff password (Admin action)
 * PUT /api/staff/:id/reset-password
 */
export const resetStaffPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        const staff = await User.findById(id);
        if (!staff) {
            return res.status(404).json({ message: 'Nhân viên không tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        staff.passWord = hashedPassword;
        await staff.save();

        res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        console.error('Reset Staff Password Error:', error);
        res.status(500).json({ message: 'Lỗi đặt lại mật khẩu' });
    }
};

/**
 * Toggle staff active status
 * PUT /api/staff/:id/toggle-status
 */
export const toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await User.findById(id);
        if (!staff) {
            return res.status(404).json({ message: 'Nhân viên không tồn tại' });
        }

        staff.isActive = !staff.isActive;
        await staff.save();

        res.status(200).json({
            message: staff.isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản',
            isActive: staff.isActive
        });
    } catch (error) {
        console.error('Toggle Staff Status Error:', error);
        res.status(500).json({ message: 'Lỗi thay đổi trạng thái tài khoản' });
    }
};
