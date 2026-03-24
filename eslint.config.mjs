import {defineConfig} from "eslint/config";
import globals from "globals";
import path from "node:path";
import {fileURLToPath} from "node:url";
import js from "@eslint/js";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    // Global ignores: ESLint will skip these entirely
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "coverage/**",
            "migration/**",
            "**/.eslintrc.js"
        ]
    },
    {
        // TARGETING: Only scan these specific folders
        files: [
            "src/**/*.ts",
            "apps/**/*.ts",
            "libs/**/*.ts",
            "test/**/*.ts"
        ],

        extends: compat.extends(
            "plugin:prettier/recommended"
        ),

        plugins: {},

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },

            ecmaVersion: "latest", // Updated from 5 to latest for modern TS
            sourceType: "module",

            parserOptions: {
                project: "tsconfig.json",
                tsconfigRootDir: __dirname, // Using __dirname for more reliable path resolution
            },
        },

        rules: {},
    }
]);
