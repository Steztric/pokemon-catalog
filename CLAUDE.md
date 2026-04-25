# Claude Code — Project Instructions

## Testing requirement

Every new module and every behaviour change must have corresponding tests. Do not mark a
task complete without writing tests for the code it adds or modifies.

Test files live under `src/__tests__/`, mirroring the `src/` layout:

| Source layer | Test location |
|---|---|
| `src/domain/` | `src/__tests__/domain/` |
| `src/infrastructure/` | `src/__tests__/infrastructure/` |
| `src/application/` | `src/__tests__/application/` |
| `src/presentation/` | `src/__tests__/presentation/` |

Minimum coverage per file type:
- **Domain entities** — valid object satisfies the type; all fields present.
- **Infrastructure stubs / adapters** — each method resolves without throwing and returns the correct value.
- **Application use cases** — happy path and at least one error path.
- **Presentation components** — renders without crashing; primary content visible.

Run tests with `npm test` before reporting work done. All tests must pass.
