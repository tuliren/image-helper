# CLAUDE.md

## Dev Preferences

- After each change, run `yarn lint`, `yarn typecheck`, and `yarn test` to ensure no errors.
- DRY the code when appropriate.
- Always use curly braces after `if` statements.
- Always think about adding unit tests for new features and bug fixes. Aim for good coverage on critical parsing logic and workflows. But skip unit tests if it involves complicated mocking or stubs.
- In unit tests, use `it.each` to group similar test cases together. Do not use "should" in test descriptions.
- When a React component file is long, separate subcomponents into their own component files.
- After making a change, thinking about updating these docs, if applicable:
  - `CLAUDE.md` (this file)
  - `README.md`
