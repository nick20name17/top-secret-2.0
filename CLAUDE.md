- Add shadcn components only with `bun run ui:add <name>`.

## Tests

- Test behaviour through the public interface: a component as the user sees it (find by role or label, act, assert on what is on screen), a module through what it exports. If a test breaks on a refactor that keeps behaviour, it is coupled to the implementation: rewrite it.
- Use the highest seam that reaches the behaviour, and prefer seams that already have tests. Write a Playwright e2e test only for what needs the built app: routing, page loads, several pages in one flow.
- Check results the way a caller would, through the interface. Do not read internal state or private storage.
- Take expected values from a literal, a worked example or the spec. A value computed the way the code computes it makes the test tautological: it can never fail.
- Mock only system boundaries: the network, time, randomness. Use the real modules, hooks and providers you own. Assert on outcomes, not on how often or in what order a mock was called.
- Keep code testable: pass dependencies in, return results instead of mutating arguments, and give each API endpoint its own function so a mock returns one shape.
- Watch every new test go red once before it goes green. Add one test and the code for it at a time.
- For a bug, first write a test that goes red on the exact symptom the user reported, cut it down to the smallest failing case, then fix. If no seam reproduces the bug as it really happens, say so instead of adding a shallow test.
- Make tests deterministic: fake time, fixed data, wait on a condition (`expect.element`, `expect.poll`, web-first assertions), never on a timer.
- When tests at a deeper seam cover a module, delete the old tests of its parts.
