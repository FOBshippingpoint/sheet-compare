# Coding Guidelines

## Framework

- Build the application with Svelte 5.
- Use Svelte 5 idioms directly.
- Avoid legacy or compatibility patterns unless a dependency requires them.

## Code Shape

- Treat every line of code as maintenance debt.
- Prefer the smallest implementation that satisfies the current requirement.
- Avoid adding abstractions, helpers, classes, wrappers, or configuration until they remove real complexity.
- Follow DRY, YAGNI, and KISS.
- Reuse existing code when it stays obvious.
- Do not force reuse through hidden indirection.

## API Design

- Before writing code, review the API shape from the caller's perspective.
- Ask whether the API is obvious for the client.
- Ask whether the API is straightforward or error-prone.
- Prefer direct inputs and outputs over hidden abstractions.
- Avoid hidden behavior, implicit normalization, surprising fallbacks, and clever indirection.
- If an API requires explanation to use safely, simplify the API before implementing it.

## Types And Documentation

- Use JSDoc for complex types.
- Keep JSDoc concise.
- Document intent, data shape, and non-obvious constraints.
- Do not add comments that restate what the code already says.

## HTML And Accessibility

- Use semantic HTML by default.
- Follow accessibility guidance for names, labels, keyboard behavior, focus management, and state.
- Prefer built-in platform elements over custom div-based controls.
- Use `<dialog>` for modal dialogs instead of building modal behavior from generic containers.
- Avoid div-heavy markup when a semantic element communicates structure or behavior.

## CSS

- Use nested CSS where it improves locality and readability.
- Follow standard CSS nesting syntax as documented by MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Nesting/Using
- Keep selectors shallow and scoped to the component or feature.

## Type Handling

- Do not add defensive type guards for values already controlled by the program.
- Avoid noisy checks such as `typeof foo === 'string'` when the type contract already guarantees a string.
- Avoid coercive normalization such as `Number(bar)` unless the input boundary explicitly requires conversion.
- Validate at real boundaries, such as user input, file parsing, or third-party library output.
- Inside trusted code paths, rely on the established data contract instead of repeating defensive checks.

## Testing

- Unit tests and integration tests are both required.
- Unit tests must stay fast. They should focus on small, deterministic logic such as SheetJS normalization, daff option mapping, diff row parsing, summary chip mapping, and export formatting.
- Integration tests must focus on end-to-end user actions. They should verify that the main compare flow does not break: choose left file, choose right file, select sheets when needed, run diff, inspect summary/table output, and export.
- Before adding a function or class, check whether it can be tested directly. If it cannot be tested without heavy setup, simplify the API or move logic to a smaller boundary.
- Before adding a test, check whether it proves meaningful behavior. Do not add tests only for coverage numbers or appearance.
- Test names and assertion messages must clearly describe the behavior under test.
- Before adding a new HTML element, check whether it gives integration tests a reliable query target through semantic role, label, accessible name, or stable visible text.
- Prefer semantic HTML that is both accessible to users and easy to target in integration tests.

## Test Data Generation

- Provide a small deterministic test file generator for CSV and XLSX fixtures.
- Use Python with Polars for fixture data creation.
- Use `uv` as the package manager and runner for the generator.
- Generated fixtures should cover unchanged rows, inserted rows, deleted rows, updated cells, inserted columns, deleted columns, renamed columns when practical, blank cells, blank rows, formatted date-like values, formatted number-like values, and multiple XLSX sheets.
- Keep generated files small so unit and integration tests remain fast.
- Generated fixtures should be reproducible from source and should not require manual editing.
