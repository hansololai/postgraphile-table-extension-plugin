module.exports = {
  extends: 'airbnb-typescript/base',
  env: {
    es6: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    debugLevel: true
  },
  plugins: ['@typescript-eslint', 'import', 'jsdoc'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },

    // 'import/resolver': {
    //   // use <root>/tsconfig.json
    //   ts: {
    //     alwaysTryTypes: true, // always try to resolve types under `<roo/>@types` directory even it doesn't contain any source code, like `@types/unist`
    //   },
    //   tsx: {
    //     alwaysTryTypes: true, // always try to resolve types under `<roo/>@types` directory even it doesn't contain any source code, like `@types/unist`
    //   }
    // },
  },
  rules: {
    'jsdoc/require-jsdoc': [
      1,
      {
        publicOnly: true,
        require: { ClassDeclaration: true, ArrowFunctionExpression: true, MethodDefinition: true },
      },
    ], // Recommended
    'jsdoc/require-description': [1, { descriptionStyle: 'tag' }],
    'max-len': [
      'warn',
      {
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        code: 100,
      },
    ],
    'import/extensions':["error",
    {
      "ts":"never",
      "js":"never",
    }],
    "react/prop-types":"off",
    'no-multi-str': 'off',
    'import/no-cycle': 'off',
    '@typescript-eslint/indent': 'off',
  },
  "overrides":[
    {
      "files":[
        "**/*.test.*"
      ],
      "env":{
        "jest":true
      }
    }
  ]
};
