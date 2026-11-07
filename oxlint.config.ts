import query from '@tanstack/eslint-plugin-query'
import router from '@tanstack/eslint-plugin-router'
import playwright from 'eslint-plugin-playwright'
import { defineConfig } from 'oxlint'

const zodMessage = "Use zod mini: import { z } from 'zod/mini'."

function asErrors(rules: object = {}, prefix = '') {
  return Object.fromEntries(
    Object.keys(rules)
      .filter((rule) => rule.startsWith(prefix))
      .map((rule) => [rule, 'error' as const]),
  )
}

const snapshotMessage =
  'A snapshot records whatever the code returns. Assert on an expected value from a literal or the spec.'
const callCountMessage =
  'Assert on the outcome, not on how often or in what order a mock was called.'
const ownModuleMockMessage =
  'Mock only system boundaries (network, time, randomness); use the real modules you own.'
const userLocatorMessage =
  'Find elements the way a user does: getByRole, getByLabelText, getByText.'
const waitMessage =
  'Wait on a condition (expect.element, expect.poll, web-first assertions) or use fake timers.'

type Rules = NonNullable<Parameters<typeof defineConfig>[0]['rules']>

const testRules: Rules = {
  'no-restricted-properties': [
    'error',
    ...['getByTestId', 'querySelector', 'querySelectorAll'].map((property) => ({
      property,
      message: userLocatorMessage,
    })),
  ],
  'no-restricted-globals': [
    'error',
    ...['setTimeout', 'setInterval'].map((name) => ({ name, message: waitMessage })),
  ],
}

const compilerMessage =
  'React Compiler memoizes automatically: write plain values, functions and components.'

export default defineConfig({
  plugins: ['typescript', 'react', 'jsx-a11y', 'oxc', 'unicorn', 'import', 'promise', 'vitest'],
  jsPlugins: [
    '@shadcn/lint',
    '@tanstack/eslint-plugin-query',
    '@tanstack/eslint-plugin-router',
    'eslint-plugin-playwright',
  ],
  options: {
    typeAware: true,
    reportUnusedDisableDirectives: 'error',
  },
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'error',
  },
  rules: {
    eqeqeq: ['error', 'smart'],
    'func-style': ['error', 'declaration'],
    'array-callback-return': 'error',
    'default-case-last': 'error',
    'default-param-last': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-promise-executor-return': 'error',
    'no-self-compare': 'error',
    'no-var': 'error',
    'no-case-declarations': 'error',
    'no-empty': 'error',
    'no-fallthrough': 'error',
    'no-prototype-builtins': 'error',
    'no-useless-assignment': 'error',
    'object-shorthand': 'error',
    'prefer-const': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'error',
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
    'max-depth': ['error', 3],
    'max-nested-callbacks': ['error', 3],
    'max-params': ['error', 3],
    complexity: ['error', 10],
    'no-nested-ternary': 'error',
    'no-warning-comments': [
      'error',
      {
        terms: [
          'as requested',
          'the user asked',
          'now uses',
          'changed from',
          'previously',
          'originally',
          'no longer',
        ],
        location: 'anywhere',
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react',
            importNames: ['default'],
            message: "Use named imports: import { useEffect } from 'react', not React.useEffect.",
          },
          {
            name: 'react',
            importNames: ['useMemo', 'useCallback', 'memo'],
            message: compilerMessage,
          },
          {
            name: '@tanstack/react-router',
            importNames: ['useLoaderData'],
            message:
              'Loaders only fill the Query cache. Read the data with useSuspenseQuery and the same queryOptions, so the query stays fresh.',
          },
        ],
        patterns: [
          {
            group: ['zod', 'zod/**', '!zod/mini'],
            message: zodMessage,
          },
        ],
      },
    ],

    'typescript/ban-ts-comment': 'error',
    'typescript/consistent-return': 'off',
    'typescript/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    'typescript/consistent-type-definitions': 'error',
    'typescript/consistent-type-imports': 'error',
    'typescript/no-deprecated': 'error',
    'typescript/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
    'typescript/no-explicit-any': 'error',
    'typescript/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    'typescript/no-non-null-assertion': 'error',
    'typescript/no-namespace': 'error',
    'typescript/no-require-imports': 'error',
    'typescript/no-unnecessary-condition': 'error',
    'typescript/no-unsafe-argument': 'error',
    'typescript/no-unsafe-assignment': 'error',
    'typescript/no-unsafe-call': 'error',
    'typescript/no-unsafe-function-type': 'error',
    'typescript/no-unsafe-member-access': 'error',
    'typescript/no-unsafe-return': 'error',
    'typescript/only-throw-error': [
      'error',
      {
        allow: [
          {
            from: 'package',
            package: '@tanstack/router-core',
            name: ['NotFoundError', 'Redirect'],
          },
        ],
      },
    ],
    'typescript/prefer-nullish-coalescing': 'error',
    'typescript/prefer-optional-chain': 'error',
    'typescript/prefer-promise-reject-errors': 'error',
    'typescript/require-await': 'error',
    'typescript/restrict-plus-operands': 'error',
    'typescript/return-await': 'error',
    'typescript/switch-exhaustiveness-check': 'error',
    'typescript/use-unknown-in-catch-callback-variable': 'error',
    'promise/valid-params': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/rules-of-hooks': 'error',
    'react/button-has-type': 'error',
    'react/jsx-boolean-value': 'error',
    'react/jsx-curly-brace-presence': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/no-unknown-property': 'error',
    'react/only-export-components': ['error', { allowConstantExport: true }],
    'react/self-closing-comp': 'error',
    'react/jsx-no-constructed-context-values': 'off',
    'react/unsupported-syntax': 'error',
    'unicorn/error-message': 'error',
    'unicorn/filename-case': 'error',
    'unicorn/no-abusive-eslint-disable': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'unicorn/throw-new-error': 'error',
    'import/no-cycle': 'error',
    'import/no-duplicates': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],
    // src/test/setup.ts checks console.error after every test
    'vitest/no-standalone-expect': ['error', { additionalTestBlockFunctions: ['afterEach'] }],
    'oxc/no-barrel-file': ['error', { threshold: 0 }],

    ...asErrors(query.configs.recommendedStrict.rules),
    ...asErrors(router.configs.recommended.rules),

    'shadcn/no-restyle': ['error', { allow: ['layout'] }],
    'shadcn/no-raw-colors': 'error',
    'shadcn/no-arbitrary-values': 'error',
    'shadcn/no-inline-styles': 'error',
    'shadcn/no-unknown-classes': 'error',
    'shadcn/require-static-classes': 'error',
  },
  ignorePatterns: ['src/routeTree.gen.ts', '.claude/skills/**'],
  overrides: [
    {
      files: ['src/components/ui/**'],
      rules: {
        'shadcn/no-restyle': 'off',
        'shadcn/no-arbitrary-values': 'off',
        'react/only-export-components': 'off',
        'jsx-a11y/prefer-tag-over-role': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        complexity: 'off',
        'no-nested-ternary': 'off',
      },
    },
    {
      files: ['e2e/**'],
      rules: {
        ...asErrors(playwright.configs['flat/recommended'].rules, 'playwright/'),
        'playwright/missing-playwright-await': 'off',
        ...testRules,
        'playwright/no-raw-locators': ['error', { allowed: ['html', 'meta[name="theme-color"]'] }],
        'playwright/no-nth-methods': 'error',
        'playwright/no-get-by-title': 'error',
        'playwright/no-commented-out-tests': 'error',
        'playwright/no-test-return-statement': 'error',
        'playwright/no-restricted-matchers': ['error', { toMatchSnapshot: snapshotMessage }],
        'playwright/prefer-to-be': 'error',
        'playwright/prefer-to-contain': 'error',
        'playwright/prefer-comparison-matcher': 'error',
        'playwright/prefer-equality-matcher': 'error',
        'playwright/require-to-throw-message': 'error',
      },
    },
    {
      files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
      rules: {
        ...testRules,
        'vitest/no-restricted-matchers': [
          'error',
          {
            toMatchSnapshot: snapshotMessage,
            toMatchInlineSnapshot: snapshotMessage,
            toHaveBeenCalledTimes: callCountMessage,
            toHaveBeenCalledOnce: callCountMessage,
            toHaveBeenCalledExactlyOnceWith: callCountMessage,
            toHaveBeenNthCalledWith: callCountMessage,
            toHaveBeenCalledBefore: callCountMessage,
            toHaveBeenCalledAfter: callCountMessage,
          },
        ],
        'vitest/no-restricted-vi-methods': [
          'error',
          { mock: ownModuleMockMessage, doMock: ownModuleMockMessage },
        ],
        'vitest/no-conditional-in-test': 'error',
        'vitest/consistent-test-it': ['error', { fn: 'test', withinDescribe: 'test' }],
        'vitest/no-identical-title': 'error',
        'vitest/no-duplicate-hooks': 'error',
        'vitest/prefer-hooks-on-top': 'error',
        'vitest/prefer-hooks-in-order': 'error',
        'vitest/no-test-return-statement': 'error',
        'vitest/no-alias-methods': 'error',
        'vitest/prefer-to-be': 'error',
        'vitest/prefer-to-have-length': 'error',
        'vitest/prefer-to-contain': 'error',
        'vitest/prefer-comparison-matcher': 'error',
        'vitest/prefer-equality-matcher': 'error',
      },
    },
    {
      files: ['src/routes/**'],
      rules: {
        'unicorn/filename-case': 'off',
        'react/only-export-components': 'off',
      },
    },
  ],
})
