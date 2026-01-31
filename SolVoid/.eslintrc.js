module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Allow any for complex decoding/mocks
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-var-requires': 'off', // Allow dynamic requires for optional modules
        'no-empty': 'off' // Allow empty catch blocks (swallows errors intentionally)
    },
    ignorePatterns: [
        "dist/",
        "node_modules/",
        "coverage/",
        "jest.config.js",
        "*.js",
        "cli/test-*.ts" // Ignore test scripts in CLI
    ],
    overrides: [
        {
            files: ["cli/privacy-scan.ts"],
            rules: {
                "no-console": "off" // CLI tool needs stdout
            }
        },
        {
            files: ["tests/**/*.ts"],
            rules: {
                "@typescript-eslint/no-explicit-any": "off"
            }
        }
    ]
};
