- Add shadcn components only with `bun run ui:add <name>`.
- When the request needs something the API doesn't have (a field, a filter, an endpoint), ask the user how to get it before writing code.

## Architecture

- Put each feature in `src/features/<name>/`. Its root files are its interface; its subfolders are private.
- Keep modules deep: a small interface over a lot of behaviour. Add a root file only when a caller needs it, and an abstraction only when a second implementation exists.
- Keep routes thin: the loader fills the Query cache and the component composes features. Put UI that only one route uses in a `-`-prefixed folder next to it, such as `-components/`; the router ignores it.
- Keep code where it is used until a second feature or route needs it; then move it into `src/components/`, `src/hooks/` or `src/lib/`. A second page with the same search form or pager is that moment.
- Define a feature's server data in its `queries.ts` as `queryOptions()` factories, with each key next to its `queryFn`. Order key parts from generic to specific: `['todos', 'detail', id]`.

## Tests

- Test behaviour through the public interface: a component as the user sees it (find by role or label, act, assert on what is on screen), a module through what it exports, never through internal state or private storage. If a test breaks on a refactor that keeps behaviour, it is coupled to the implementation: rewrite it.
- Use the highest seam that reaches the behaviour, and prefer seams that already have tests. Write a Playwright e2e test only for what needs the built app: routing, page loads, several pages in one flow.
- Take expected values from a literal, a worked example or the spec. A value computed the way the code computes it makes the test tautological: it can never fail.
- Test the behaviour you own. Leave `src/components/ui`, generated files and library behaviour untested.
- Mock only system boundaries: the network (MSW: `worker.use()` from `@/test/msw`), time, randomness. Use the real modules, hooks and providers you own.
- Browser storage and cross-tab events are a system boundary too: write to them directly only to simulate another tab or corrupted data; otherwise go through the module's exports.
- Copy mock response bodies from a real API response or its docs. A body written from the zod schema can never disagree with the code.
- Keep code testable: pass dependencies in, return results instead of mutating arguments, and give each API endpoint its own function so a mock returns one shape.
- Watch every new test go red before the code for it exists. Red is the assertion failing on the missing behaviour; an import, type or setup error is not red yet. If a new test is green from the start, say what already provides the behaviour.
- When a test fails, fix the code. Change the test only when the spec changed, and say so. Never skip a test, loosen an assertion or add a retry to make it pass.
- For a bug, first write a test that goes red on the exact symptom the user reported, cut it down to the smallest failing case, then fix. If no seam reproduces the bug as it really happens, say so instead of adding a shallow test.
- Make tests deterministic: fake time, fixed data, and wait on a condition (`expect.element`, `expect.poll`, web-first assertions).
- Make each test pass alone and in any order: before it ends, settle every request it started and restore real timers.
- When tests at a deeper seam cover a module, delete the old tests of its parts.
