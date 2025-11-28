import Joi from 'joi'

export const signUpSchema = Joi.object({
    userName: Joi.string()
    .required()
    .min(3)
    .max(30)
    .messages({
        'string.empty': 'Tên đăng nhập không được để trống!',
        'string.min': 'Tên đăng nhập phải có ít nhất 3 ký tự!',
        'string.max': 'Tên đăng nhập không được quá 30 ký tự!'
    }),
    
})