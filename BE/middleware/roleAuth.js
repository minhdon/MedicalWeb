import { Role } from '../models/Role.js';

// Middleware kiểm tra quyền dựa trên roleName
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Lấy roleId từ user hoặc admin (giả sử có field roleId trong User/Admin)
      const roleId = req.user?.roleId || req.admin?.roleId;

      if (!roleId) {
        return res.status(403).json({
          success: false,
          message: 'Không tìm thấy thông tin phân quyền'
        });
      }

      // Tìm role trong database bằng _id
      const role = await Role.findById(roleId);

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Role không tồn tại'
        });
      }

      // Kiểm tra roleName có trong danh sách được phép không
      if (!allowedRoles.includes(role.roleName)) {
        return res.status(403).json({
          success: false,
          message: `Bạn không có quyền truy cập. Yêu cầu role: ${allowedRoles.join(', ')}`
        });
      }

      // Gắn thông tin role vào request
      req.role = {
        id: role._id,
        roleName: role.roleName,
        description: role.description
      };

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra quyền',
        error: error.message
      });
    }
  };
};

// Middleware chỉ cho phép admin
export const requireAdminRole = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền truy cập'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực admin',
      error: error.message
    });
  }
};

export default requireRole;
