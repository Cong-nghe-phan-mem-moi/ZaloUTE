const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
    // Enable ESLint's recommended default rules
    pluginJs.configs.recommended,
    {
        // Declare the Node.js environment to avoid require/module/process errors
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        // Custom project rules
        rules: {
            'no-undef': 'error',       // Missing imports or undeclared variables are errors
            'no-unused-vars': 'warn',  // Unused variables are warnings
            'no-console': 'off'        // Allow console logging
        }
    }
];
