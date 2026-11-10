// Checks that lint catches the mistakes the project rules forbid.
// Each case writes a file with one mistake where it would really appear, lints them all, then deletes them.
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { z } from 'zod/mini'

interface Case {
  name: string
  file: string
  code: string
  rule: string
  // Part of the rule's help text, for rules that guard several things
  help?: string
}

const prefix = 'zz-guardrail'
const feature = `src/features/${prefix}`

const cases: Case[] = [
  {
    name: 'shared code imports a feature',
    file: `src/lib/${prefix}-feature.ts`,
    code: "import { meQuery } from '@/features/auth/queries'\nexport const q = meQuery",
    rule: 'eslint(no-restricted-imports)',
    help: 'Shared code must not know about features',
  },
  {
    name: 'shared code imports the router',
    file: `src/lib/${prefix}-router.ts`,
    code: "import { router } from '@/router'\nexport const r = router",
    rule: 'eslint(no-restricted-imports)',
    help: 'Shared code must not know about features',
  },
  {
    name: "a feature imports another feature's private file",
    file: `${feature}/private.ts`,
    code: "import { themeSchema } from '@/features/theme/lib/theme-context'\nexport const s = themeSchema",
    rule: 'eslint(no-restricted-imports)',
    help: "A feature's root files are its interface",
  },
  {
    name: 'a feature imports a route',
    file: `${feature}/route.ts`,
    code: "import { Route } from '@/routes/login'\nexport const r = Route",
    rule: 'eslint(no-restricted-imports)',
    help: 'Routes compose features',
  },
  {
    name: 'a relative import',
    file: `${feature}/relative.ts`,
    code: "import { meQuery } from '../auth/queries'\nexport const q = meQuery",
    rule: 'eslint(no-restricted-imports)',
    help: "Import with '@/'",
  },
  {
    name: 'full zod instead of zod/mini',
    file: `${feature}/zod.ts`,
    code: "import { z } from 'zod'\nexport const s = z.string()",
    rule: 'eslint(no-restricted-imports)',
    help: 'zod/mini',
  },
  {
    name: 'manual memoization',
    file: `${feature}/memo.ts`,
    code: "import { useMemo } from 'react'\nexport const m = useMemo",
    rule: 'eslint(no-restricted-imports)',
    help: 'React Compiler',
  },
  {
    name: 'reading loader data instead of the Query cache',
    file: `${feature}/loader-data.ts`,
    code: "import { useLoaderData } from '@tanstack/react-router'\nexport const l = useLoaderData",
    rule: 'eslint(no-restricted-imports)',
    help: 'Loaders only fill the Query cache',
  },
  {
    name: 'a type assertion',
    file: `${feature}/assertion.ts`,
    code: "export const n = JSON.parse('1') as number",
    rule: 'typescript(consistent-type-assertions)',
  },
  {
    name: 'any',
    file: `${feature}/any.ts`,
    code: 'export function f(value: any) {\n  return String(value)\n}',
    rule: 'typescript(no-explicit-any)',
  },
  {
    name: 'a non-null assertion',
    file: `${feature}/non-null.ts`,
    code: "export const root = document.getElementById('root')!",
    rule: 'typescript(no-non-null-assertion)',
  },
  {
    name: 'a ts-ignore comment',
    file: `${feature}/ts-ignore.ts`,
    code: '// @ts-ignore\nexport const n: number = 1',
    rule: 'typescript(ban-ts-comment)',
  },
  {
    name: 'turning lint off for a whole file',
    file: `${feature}/disable.ts`,
    code: '/* oxlint-disable */\nexport const n = 1',
    rule: 'unicorn(no-abusive-eslint-disable)',
  },
  {
    name: 'console.log',
    file: `${feature}/console.ts`,
    code: "export function f() {\n  console.log('debug')\n}",
    rule: 'eslint(no-console)',
  },
  {
    name: 'a comment that narrates the change',
    file: `${feature}/comment.ts`,
    code: '// Previously this used a cache\nexport const n = 1',
    rule: 'eslint(no-warning-comments)',
  },
  {
    name: 'a barrel file',
    file: `${feature}/barrel.ts`,
    code: "export * from '@/features/auth/queries'",
    rule: 'oxc(no-barrel-file)',
  },
  {
    name: 'a raw color class',
    file: `${feature}/raw-color.tsx`,
    code: "export function Badge() {\n  return <span className='text-red-500'>New</span>\n}",
    rule: 'shadcn(no-raw-colors)',
  },
  {
    name: 'a native control instead of a shadcn component',
    file: `${feature}/native-select.tsx`,
    code: "export function Picker() {\n  return <select aria-label='Size' />\n}",
    rule: 'react(forbid-elements)',
  },
  {
    name: 'a snapshot assertion',
    file: `${feature}/snapshot.test.ts`,
    code: "import { expect, test } from 'vitest'\n\ntest('t', () => {\n  expect(1).toMatchSnapshot()\n})",
    rule: 'vitest(no-restricted-matchers)',
  },
  {
    name: 'asserting on call counts',
    file: `${feature}/call-count.test.ts`,
    code: "import { expect, test, vi } from 'vitest'\n\ntest('t', () => {\n  const f = vi.fn()\n  expect(f).toHaveBeenCalledTimes(0)\n})",
    rule: 'vitest(no-restricted-matchers)',
  },
  {
    name: 'mocking a module the project owns',
    file: `${feature}/mock.test.ts`,
    code: "import { test, vi } from 'vitest'\n\nvi.mock('@/lib/api')\n\ntest('t', () => {})",
    rule: 'vitest(no-restricted-vi-methods)',
  },
  {
    name: 'a test id locator',
    file: `${feature}/test-id.test.ts`,
    code: "import { expect, test } from 'vitest'\nimport { page } from 'vitest/browser'\n\ntest('t', async () => {\n  await expect.element(page.getByTestId('x')).toBeVisible()\n})",
    rule: 'eslint(no-restricted-properties)',
  },
  {
    name: 'sleeping in a test',
    file: `${feature}/sleep.test.ts`,
    code: "import { test } from 'vitest'\n\ntest('t', async () => {\n  await new Promise((resolve) => {\n    setTimeout(resolve, 100)\n  })\n})",
    rule: 'eslint(no-restricted-globals)',
  },
  {
    name: 'a condition in a test',
    file: `${feature}/conditional.test.ts`,
    code: "import { expect, test } from 'vitest'\n\ntest('t', () => {\n  const n = Number('1')\n  if (n > 0) expect(n).toBe(1)\n})",
    rule: 'vitest(no-conditional-in-test)',
  },
  {
    name: "a test imports a feature's private file",
    file: `src/lib/${prefix}-private.test.ts`,
    code: "import { expect, test } from 'vitest'\nimport { themeSchema } from '@/features/theme/lib/theme-context'\n\ntest('t', () => {\n  expect(themeSchema).toBeDefined()\n})",
    rule: 'eslint(no-restricted-imports)',
    help: 'Test a feature through its root files',
  },
  {
    name: 'a skipped test',
    file: `${feature}/skip.test.ts`,
    code: "import { test } from 'vitest'\n\ntest.skip('t', () => {})",
    rule: 'vitest(no-disabled-tests)',
  },
  {
    name: 'a focused test',
    file: `${feature}/only.test.ts`,
    code: "import { test } from 'vitest'\n\ntest.only('t', () => {})",
    rule: 'vitest(no-focused-tests)',
  },
  {
    name: 'a skipped e2e test',
    file: `e2e/${prefix}-skip.spec.ts`,
    code: "import { test } from '@playwright/test'\n\ntest.skip('t', async () => {})",
    rule: 'playwright(no-skipped-test)',
  },
  {
    name: 'a fixed wait in an e2e test',
    file: `e2e/${prefix}.spec.ts`,
    code: "import { test } from '@playwright/test'\n\ntest('t', async ({ page }) => {\n  await page.waitForTimeout(100)\n})",
    rule: 'playwright(no-wait-for-timeout)',
  },
]

const reportSchema = z.object({
  diagnostics: z.array(
    // Parse errors have no code
    z.object({ code: z.optional(z.string()), help: z.optional(z.string()), filename: z.string() }),
  ),
})

function writeCases() {
  for (const { file, code } of cases) {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, `${code}\n`)
  }
}

function removeCases() {
  rmSync(feature, { recursive: true, force: true })
  for (const { file } of cases) rmSync(file, { force: true })
}

function lint() {
  // The config lists features when it loads, so lint after the files exist
  const files = cases.map((c) => c.file)
  const result = spawnSync('bunx', ['oxlint', '--format', 'json', ...files], { encoding: 'utf8' })
  return reportSchema.parse(JSON.parse(result.stdout)).diagnostics
}

function missedCases(diagnostics: ReturnType<typeof lint>) {
  return cases.filter(
    ({ file, rule, help }) =>
      !diagnostics.some(
        (d) => d.filename === file && d.code === rule && (!help || d.help?.includes(help)),
      ),
  )
}

writeCases()
let diagnostics: ReturnType<typeof lint>
try {
  diagnostics = lint()
} finally {
  removeCases()
}

const missed = missedCases(diagnostics)
for (const { name, rule } of missed) console.error(`Not caught: ${name} (expected ${rule})`)
if (missed.length > 0) process.exit(1)
console.warn(`Lint catches all ${cases.length} guarded mistakes.`)
