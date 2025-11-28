import { User } from '../models/User.js';
import { Admin } from '../models/Admin.js';

// Middleware xác thñc user
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm th¥y token xác thñc'
      });
    }

    const token = authHeader.split(' ')[1];

    // TODO: Thêm logic verify JWT token ß ây khi cài ·t jsonwebtoken
    // import jwt from 'jsonwebtoken';
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const user = await User.findById(decoded.id);

    // T¡m thÝi: gi£ sí token là _id
    const user = await User.findById(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Ng°Ýi dùng không tÓn t¡i'
      });
    }

    req.user = {
      id: user._id,
      userName: user.userName,
      email: user.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hãp lÇ',
      error: error.message
    });
  }
};

// Middleware xác thñc admin
export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm th¥y token xác thñc'
      });
    }

    const token = authHeader.split(' ')[1];

    // TODO: Thêm logic verify JWT token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const admin = await Admin.findById(decoded.id);

    // T¡m thÝi: gi£ sí token là _id
    const admin = await Admin.findById(token);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin không tÓn t¡i ho·c không có quyÁn truy c­p'
      });
    }

    req.admin = {
      id: admin._id,
      adminName: admin.adminName,
      email: admin.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hãp lÇ',
      error: error.message
    });
  }
};

// Middleware kiÃm tra c£ User ho·c Admin
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm th¥y token xác thñc'
      });
    }

    const token = authHeader.split(' ')[1];

    // TODO: Verify JWT và xác Ënh lo¡i user
    // T¡m thÝi: thí tìm c£ User và Admin b±ng _id
    let user = await User.findById(token);
    let admin = await Admin.findById(token);

    if (!user && !admin) {
      return res.status(401).json({
        success: false,
        message: 'Ng°Ýi dùng không tÓn t¡i'
      });
    }

    if (user) {
      req.user = {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: 'user'
      };
    } else if (admin) {
      req.admin = {
        id: admin._id,
        adminName: admin.adminName,
        email: admin.email,
        role: 'admin'
      };
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Xác thñc th¥t b¡i',
      error: error.message
    });
  }
};
