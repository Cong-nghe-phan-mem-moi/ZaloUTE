const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
    // Bật các rules mặc định tốt nhất của ESLint
    pluginJs.configs.recommended,
    {
        // Khai báo môi trường là Node.js (để không báo lỗi require, module, process...)
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        // Các rules tùy chỉnh của mình
        rules: {
            'no-undef': 'error',       // Quên import hoặc chưa khai báo biến -> Báo đỏ
            'no-unused-vars': 'warn',  // Khai báo mà không xài -> Cảnh báo vàng
            'no-console': 'off'        // Cho phép dùng console.log thoải mái
        }
    }
];