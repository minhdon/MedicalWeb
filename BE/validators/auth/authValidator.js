import Joi from "joi";

export const signUpSchema = Joi.object({
  userName: Joi.string().required().min(3).max(30).messages({
    "any.required": "Tên đăng nhập là bắt buộc!",
    "string.empty": "Tên đăng nhập không được để trống!",
    "string.min": "Tên đăng nhập phải có ít nhất 3 ký tự!",
    "string.max": "Tên đăng nhập không được quá 30 ký tự!",
  }),
  passWord: Joi.string()
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .min(8)
    .messages({
      "any.required": "Mật khẩu là bắt buộc!",
      "string.empty": "Mật khẩu không được để trống!",
      "string.pattern.base":
        "Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 chữ số!",
      "string.min": "Mật khẩu phải có ít nhất 8 ký tự!",
    }),
  email: Joi.string().email().optional().messages({
    "string.email": "Email không hợp lệ!",
  }),
  address: Joi.string().optional().allow(""),
  DoB: Joi.string().optional().allow(""),
  phoneNum: Joi.string().optional().allow(""),
  sex: Joi.boolean().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().required().messages({
    "any.required": "Email hoặc Số điện thoại là bắt buộc!",
    "string.empty": "Vui lòng nhập email hoặc số điện thoại!",
  }),
  userName: Joi.string().optional(),
  passWord: Joi.string().required().messages({
    "any.required": "Mật khẩu là bắt buộc!",
    "string.empty": "Mật khẩu không được để trống!",
  }),
});

export const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "any.required": "Mật khẩu mới là bắt buộc!",
      "string.pattern.base":
        "Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ in hoa và 1 ký tự!",
      "string.empty": "Mật khẩu không được để trống",
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword"))
    .messages({
      "any.only": "Xác nhận mật khẩu không khớp",
      "string.empty": "Vui lòng nhập mật khẩu mới",
    }),
});

export const resetPasswordRequestSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email là bắt buộc!",
    "string.email": "Email không hợp lệ!",
    "string.empty": "Email không được để trống!",
  }),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email là bắt buộc!",
    "string.email": "Email không hợp lệ!",
    "string.empty": "Email không được để trống!",
  }),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "any.required": "Mật khẩu mới là bắt buộc!",
      "string.pattern.base":
        "Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ in hoa và 1 ký tự!",
      "string.empty": "Mật khẩu không được để trống",
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword"))
    .messages({
      "any.only": "Xác nhận mật khẩu không khớp",
      "string.empty": "Vui lòng nhập mật khẩu mới",
    }),
});

export const changePasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email là bắt buộc!",
    "string.email": "Email không hợp lệ!",
    "string.empty": "Email không được để trống!",
  }),
  oldPassword: Joi.string().required(),
  newPassword: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "any.required": "Mật khẩu mới là bắt buộc!",
      "string.pattern.base":
        "Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ in hoa và 1 ký tự!",
      "string.empty": "Mật khẩu không được để trống",
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword"))
    .messages({
      "any.only": "Xác nhận mật khẩu không khớp",
      "string.empty": "Vui lòng nhập mật khẩu mới",
    }),
});
