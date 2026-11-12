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
const wholeTextMessage =
  'toHaveTextContent compares the whole text of the element. Use toMatchTextContent: it takes a part of the text or a RegExp.'
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
    { property: 'toHaveTextContent', message: wholeTextMessage },
  ],
  'no-restricted-globals': [
    'error',
    ...['setTimeout', 'setInterval'].map((name) => ({ name, message: waitMessage })),
  ],
}

const forbidElements = [
  'button',
  'input',
  'select',
  'option',
  'optgroup',
  'textarea',
  'label',
  'fieldset',
  'legend',
  'table',
  'caption',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'dialog',
  'details',
  'summary',
  'hr',
  'progress',
  'kbd',
].map((element) => ({
  element,
  message: `Use the shadcn component from @/components/ui. Find a missing one with bunx shadcn search @shadcn -q ${element}, add it with bun run ui:add <name>.`,
}))

const compilerMessage =
  'React Compiler memoizes automatically: write plain values, functions and components.'

const restrictedPaths = [
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
]

const apiClientPath = {
  name: '@/lib/api',
  importNames: ['api'],
  message:
    "Request server data in the feature's queries.ts as queryOptions(); routes and components read it with useSuspenseQuery.",
}

function restrictedImports(
  paths = [...restrictedPaths, apiClientPath],
): Rules['no-restricted-imports'] {
  return [
    'error',
    {
      paths,
      patterns: [
        { group: ['zod', 'zod/**', '!zod/mini'], message: zodMessage },
        {
          group: ['@testing-library/**'],
          message:
            "Vitest browser mode has this built in: render from 'vitest-browser-react'; page and userEvent from 'vitest/browser'; matchers on expect.element.",
        },
      ],
    },
  ]
}

// Where files in src/ may import from; the last matching policy wins
const boundaries: Rules['boundaries/dependencies'] = [
  'error',
  {
    default: 'allow',
    checkInternals: true,
    policies: [
      {
        from: { element: { type: 'shared' } },
        disallow: { to: [{ element: { type: 'feature' } }, { file: { categories: 'shell' } }] },
        message:
          'Shared code must not know about features or the app shell. Move the code into the feature.',
      },
      {
        from: { element: { type: 'feature' } },
        disallow: { to: { file: { categories: 'shell' } } },
        message:
          'Routes compose features, never the other way round. Pass what the feature needs as props or arguments.',
      },
      {
        disallow: { to: { file: { categories: 'private' } } },
        message:
          "A feature's root files are its interface; its subfolders are private. Import a root file, or add one.",
      },
      {
        from: { element: { type: 'feature' } },
        allow: {
          to: {
            element: {
              type: 'feature',
              captured: { feature: '{{from.element.captured.feature}}' },
            },
          },
        },
      },
      {
        from: { file: { categories: 'test' } },
        disallow: { to: { file: { categories: 'private' } } },
        message: 'Test a feature through its root files, not its private subfolders.',
      },
    ],
  },
]

export default defineConfig({
  plugins: ['typescript', 'react', 'jsx-a11y', 'oxc', 'unicorn', 'import', 'promise', 'vitest'],
  jsPlugins: [
    '@shadcn/lint',
    '@tanstack/eslint-plugin-query',
    '@tanstack/eslint-plugin-router',
    'eslint-plugin-playwright',
    'eslint-plugin-boundaries',
    'eslint-plugin-no-relative-import-paths',
  ],
  settings: {
    // Lets the boundaries plugin follow the '@/' alias
    'import/resolver': { typescript: { project: 'tsconfig.app.json' } },
    'boundaries/elements': [
      { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
      { type: 'shared', pattern: 'src/(components|hooks|lib)' },
    ],
    'boundaries/files': [
      { pattern: 'src/features/*/*/**', category: 'private' },
      { pattern: ['**/*.test.(ts|tsx)', 'src/test/**'], category: 'test' },
      { pattern: ['src/routes/**', 'src/(router|main|routeTree.gen).(ts|tsx)'], category: 'shell' },
    ],
  },
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
    'no-restricted-imports': restrictedImports(),
    'boundaries/dependencies': boundaries,
    'no-relative-import-paths/no-relative-import-paths': ['error', { rootDir: 'src', prefix: '@' }],

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
    'react/forbid-elements': ['error', { forbid: forbidElements }],
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
    // src/test/setup.ts asserts after each test
    'vitest/no-standalone-expect': [
      'error',
      { additionalTestBlockFunctions: ['afterEach', 'onTestFinished'] },
    ],
    'oxc/no-barrel-file': ['error', { threshold: 0 }],

    ...asErrors(query.configs.recommendedStrict.rules),
    ...asErrors(router.configs.recommended.rules),

    'shadcn/no-restyle': ['error', { allow: ['layout'] }],
    'shadcn/no-raw-colors': 'error',
    'shadcn/no-arbitrary-values': ['error', { allow: ['layout'] }],
    'shadcn/no-inline-styles': 'error',
    'shadcn/no-unknown-classes': 'error',
    'shadcn/require-static-classes': 'error',
  },
  ignorePatterns: ['src/routeTree.gen.ts', 'src/lib/api.gen.ts', '.claude/skills/**'],
  overrides: [
    {
      files: ['*.config.ts', 'e2e/**'],
      rules: { 'max-lines': 'off', 'no-relative-import-paths/no-relative-import-paths': 'off' },
    },
    {
      files: ['src/features/*/queries.ts', 'src/lib/**'],
      rules: { 'no-restricted-imports': restrictedImports(restrictedPaths) },
    },
    {
      files: ['src/components/ui/**'],
      rules: {
        // shadcn generates import * as React and memo hooks
        'no-restricted-imports': restrictedImports([]),
        // shadcn components are built on the native elements
        'react/forbid-elements': 'off',
        'shadcn/no-restyle': 'off',
        'shadcn/no-arbitrary-values': 'off',
        'react/only-export-components': 'off',
        'jsx-a11y/prefer-tag-over-role': 'off',
        // Wrappers like Label get htmlFor from the caller
        'jsx-a11y/label-has-associated-control': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        complexity: 'off',
        'no-nested-ternary': 'off',
      },
    },
    {
      files: ['e2e/*.spec.ts'],
      rules: {
        'no-restricted-imports': restrictedImports([
          {
            name: '@playwright/test',
            importNames: ['test', 'expect'],
            message: "Import test and expect from './test.ts': its test mocks the API.",
          },
        ]),
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
        'vitest/no-test-return-statement': 'error',
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
