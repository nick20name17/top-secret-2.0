- Build UI from the shadcn components in `src/components/ui` and pass them layout classes only. Add a missing one with `bun run ui:add <name>`.
- When the request needs something the API doesn't have (a field, a filter, an endpoint), ask the user how to get it before writing code.

## Architecture

- Put each feature in `src/features/<name>/`. Its root files are its interface; its subfolders are private.
- Keep modules deep: a small interface over a lot of behaviour. Add a root file only when a caller needs it, and an abstraction only when a second implementation exists.
- Keep routes thin: the loader starts the queries and the component composes features. Put UI that only one route uses in a `-`-prefixed folder next to it, such as `-components/`; the router ignores it.
- Start each page's queries in its loader and read them with `useQuery`. Await only the data the page cannot render without; start the rest with `void client.query(…).catch(noop)` and render its pending state.
- Keep code where it is used until a second feature or route needs it; then move it into `src/components/`, `src/hooks/`, `src/lib/` or, for test helpers, `src/test/`. A second page with the same search form or the same search params is that moment.
- Define a feature's server data in its `queries.ts` as `queryOptions()` factories, with each key next to its `queryFn`. Order key parts from generic to specific: `['todos', 'detail', id]`.
- Wrap each zod schema of an API response in `apiSchema('<Name>', …)` from `@/lib/api-schema`, where `<Name>` is its schema in `src/lib/api.gen.ts`. Regenerate that file with `bun run api:types`.

## Tests

- Work in vertical slices: one test, the code that turns it green, then the next test.
- Watch every new test go red before the code for it exists. Red is the assertion failing on the missing behaviour; an import, type or setup error is not red yet. If a new test is green from the start, break the code it covers, watch it go red, then restore the code.
- For a bug, first write a test that goes red on the exact symptom the user reported, cut it down to the smallest failing case, then fix. If no seam reproduces the bug as it really happens, say so instead of adding a shallow test.
- Keep code testable: pass dependencies in, return results instead of mutating arguments, and give each API endpoint its own function so a mock returns one shape.
- Before you write or change a test, read `.claude/rules/tests.md`.
