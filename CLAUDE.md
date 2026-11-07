- Add shadcn components only with `bun run ui:add <name>`.

## Architecture

- Put each feature in `src/features/<name>/`. Its root files are its interface; its subfolders are private.
- Keep modules deep: a small interface over a lot of behaviour. Add a root file only when a caller needs it, and an abstraction only when a second implementation exists.
- Keep routes thin: the loader fills the Query cache and the component composes features. Put UI that only one route uses in a `-`-prefixed folder next to it, such as `-components/`; the router ignores it.
- Move code into `src/components/`, `src/hooks/` or `src/lib/` only when a second feature needs it.
- Define a feature's server data in its `queries.ts` as `queryOptions()` factories, with each key next to its `queryFn`. Order key parts from generic to specific: `['todos', 'detail', id]`.

## Tests

- Test behaviour through the public interface: a component as the user sees it (find by role or label, act, assert on what is on screen), a module through what it exports, never through internal state or private storage. If a test breaks on a refactor that keeps behaviour, it is coupled to the implementation: rewrite it.
- Use the highest seam that reaches the behaviour, and prefer seams that already have tests. Write a Playwright e2e test only for what needs the built app: routing, page loads, several pages in one flow.
- Take expected values from a literal, a worked example or the spec. A value computed the way the code computes it makes the test tautological: it can never fail.
- Mock only system boundaries: the network (MSW: `worker.use()` from `@/test/msw`), time, randomness. Use the real modules, hooks and providers you own.
- Keep code testable: pass dependencies in, return results instead of mutating arguments, and give each API endpoint its own function so a mock returns one shape.
- Watch every new test go red once before it goes green. Add one test and the code for it at a time.
- When a test fails, fix the code. Change the test only when the spec changed, and say so.
- For a bug, first write a test that goes red on the exact symptom the user reported, cut it down to the smallest failing case, then fix. If no seam reproduces the bug as it really happens, say so instead of adding a shallow test.
- Make tests deterministic: fake time, fixed data, and wait on a condition (`expect.element`, `expect.poll`, web-first assertions).
- When tests at a deeper seam cover a module, delete the old tests of its parts.
