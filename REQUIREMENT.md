# Sheet Compare Tool Requirements

## Summary

Build a simple local browser tool "Sheet Compare" for comparing two tabular files. The tool parses CSV/XLSX files with SheetJS, converts selected sheets to daff-compatible 2D arrays, uses daff for all comparison logic, and renders the resulting Tabular Diff Format as a dense table UI.

This is a utility, not a product landing page. The first screen is the upload tool. Use `Left` and `Right` terminology everywhere.

Chosen defaults:

- Hidden unchanged rows by default.
- Hidden unchanged columns by default.
- Whitespace-sensitive by default.
- Case-sensitive by default.
- Render daff highlighter-format rows ourselves instead of relying on daff HTML.
- Standalone HTML exports persist embedded left/right files as the only source of truth.

## User Interface

The tool has two main UI states.

### Upload State

- Show two equal file drop zones: `Left` and `Right`.
- Each drop zone accepts `.csv` and `.xlsx`.
- Each drop zone has a visible `Browse Files` action.
- Drag-and-drop should be supported.
- The layout is side-by-side on desktop and stacked on narrow screens.
- No marketing copy, account UI, or profile icon.

### Compare State

- Show a compact top bar with the title `Sheet Compare`.
- Use explicit export actions such as `Export CSV` and `Export HTML`; do not use a vague `Save` label.
- Show one compact options bar with:
  - `Show unchanged rows`
  - `Show unchanged columns`
  - `Ignore whitespace`
  - `Ignore case`
- Show side-by-side preview panes above the diff:
  - Left pane: `Left`
  - Right pane: `Right`
- Each preview pane shows file name, selected sheet name, replacement file action, and a scrollable table preview.
- Preview and diff tables use sticky headers, dense row height, monospace cells, and horizontal/vertical scrolling.
- The diff table is the primary result and should get at least as much vertical space as the preview area.

## File And Compare Behavior

- Parse all files locally in the browser with SheetJS.
- For CSV, treat the file as a single sheet.
- For XLSX, allow selecting one worksheet per file.
- Convert the selected sheet to a rectangular 2D array for `daff.TableView`.
- Keep the first row as the header row.
- Convert missing cells consistently before passing data to daff.
- Prefer displayed cell values for the first version.
- Use daff for all row alignment, column alignment, and diff generation.
- Do not expose primary key selection.
- Do not expose ignored columns.
- Do not implement custom diff logic.

Compare options map directly to daff:

- `Show unchanged rows` -> `flags.show_unchanged`
- `Show unchanged columns` -> `flags.show_unchanged_columns`
- `Ignore whitespace` -> `flags.ignore_whitespace`
- `Ignore case` -> `flags.ignore_case`

Changing any compare option should rerun the diff or clearly invalidate the current diff until it is rerun.

## Diff Rendering

Use `TableDiff.hilite()` to produce daff highlighter-format rows and `TableDiff.getSummary()` for counts.

Render daff Tabular Diff Format as structured table data:

- Always include the action column as the first visible column.
- Header/body alignment must account for the action column.
- `LOCAL` means the left file.
- `REMOTE` means the right file.

Required tag handling:

- `@@`: header row.
- `!`: schema row.
- `+++`: inserted row or column, present in right only.
- `---`: deleted row or column, present in left only.
- `->`, `-->`, `--->`: updated row with one or more modified cells.
- `...`: omitted unchanged row or column.
- `:`: reordered row or column.
- Blank or `null`: unchanged context row or column.
- `(<NAME>)`: renamed column in a schema row, where `<NAME>` is the left column name and the header has the right column name.

Cell rendering:

- For updated rows, split modified cells using that row's actual update token, not a hardcoded `->`.
- Render left values in red with strikethrough.
- Render right values in green.
- Render the separator token in the update color.
- Preserve enough whitespace for data inspection.
- Render omitted unchanged sections as a visible `...` row or column, never as an empty row.

Diff colors:

- Inserts: muted green.
- Deletes: muted red.
- Updates: muted amber/yellow.
- Reorders and unchanged context: neutral gray.
- Color must be supported by visible action markers, not used as the only indicator.

Summary chips:

- Derive chips from `TableDiff.getSummary()`.
- Chips are UI summaries, not part of the daff spec.
- Use daff markers only as shorthand labels.
- Include counts for row inserts, row deletes, row updates, row reorders, column inserts, column deletes, column renames, and column reorders when nonzero.

## Export

### CSV Export

- Export the current daff highlighter-format diff table as CSV.
- The exported CSV should preserve the action column and daff markers.

### Standalone HTML Export

Export a self-contained HTML file that can reopen without network access and regenerate the diff.

Single-source-of-truth rule:

- Persist only the left file, right file, selected sheet names, and compare options.
- Do not persist `diffRows`, rendered diff HTML, or summary counts.
- When opened, the standalone HTML decodes embedded files, parses them with SheetJS, and reruns daff.

Implementation shape:

- Inline the app JavaScript and CSS in the exported HTML.
- Store report state in a non-executed JSON script block.
- Store CSV text directly when safe.
- Store XLSX files as base64 because they are binary.
- Include metadata for file name, MIME type, selected sheet, encoding, and compare options.
- Warn before generating very large standalone HTML files because the browser must parse through embedded data on load.

Example state block:

```html
<script id="table-compare-data" type="application/json">
  {
    "version": 1,
    "left": {
      "name": "left.xlsx",
      "mime": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "encoding": "base64",
      "data": "..."
    },
    "right": {
      "name": "right.xlsx",
      "mime": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "encoding": "base64",
      "data": "..."
    },
    "sheets": {
      "left": "Sheet1",
      "right": "Sheet1"
    },
    "options": {
      // Follow daff library naming convention
      "show_unchanged": false,
      "show_unchanged_columns": false,
      "ignore_whitespace": false,
      "ignore_case": false
    }
  }
</script>
```

## Validation And States

Required validation:

- Missing left file.
- Missing right file.
- Unsupported file type.
- XLSX with no sheets.
- Selected sheet with no rows.
- Parse failure.
- daff comparison failure.

Required UI states:

- Empty upload state.
- Loading/parsing state.
- Diffing state.
- Loaded preview state.
- Diff result state.
- Error state with actionable message.

## Technical Requirements

### Framework

- Build the application with Svelte 5.
- Use Svelte 5 idioms directly.
- Avoid legacy or compatibility patterns unless a dependency requires them.

### Code Shape

- Treat every line of code as maintenance debt.
- Prefer the smallest implementation that satisfies the current requirement.
- Avoid adding abstractions, helpers, classes, wrappers, or configuration until they remove real complexity.
- Follow DRY, YAGNI, and KISS.
- Reuse existing code when it stays obvious.
- Do not force reuse through hidden indirection.

### API Design

- Before writing code, review the API shape from the caller's perspective.
- Ask whether the API is obvious for the client.
- Ask whether the API is straightforward or error-prone.
- Prefer direct inputs and outputs over hidden abstractions.
- Avoid hidden behavior, implicit normalization, surprising fallbacks, and clever indirection.
- If an API requires explanation to use safely, simplify the API before implementing it.

### Types And Documentation

- Use JSDoc for complex types.
- Keep JSDoc concise.
- Document intent, data shape, and non-obvious constraints.
- Do not add comments that restate what the code already says.

### HTML And Accessibility

- Use semantic HTML by default.
- Follow accessibility guidance for names, labels, keyboard behavior, focus management, and state.
- Prefer built-in platform elements over custom div-based controls.
- Use `<dialog>` for modal dialogs instead of building modal behavior from generic containers.
- Avoid div-heavy markup when a semantic element communicates structure or behavior.

### CSS

- Use nested CSS where it improves locality and readability.
- Follow standard CSS nesting syntax as documented by MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Nesting/Using
- Keep selectors shallow and scoped to the component or feature.

### Type Handling

- Do not add defensive type guards for values already controlled by the program.
- Avoid noisy checks such as `typeof foo === 'string'` when the type contract already guarantees a string.
- Avoid coercive normalization such as `Number(bar)` unless the input boundary explicitly requires conversion.
- Validate at real boundaries, such as user input, file parsing, or third-party library output.
- Inside trusted code paths, rely on the established data contract instead of repeating defensive checks.

### Testing

- Unit tests and integration tests are both required.
- Unit tests must stay fast. They should focus on small, deterministic logic such as SheetJS normalization, daff option mapping, diff row parsing, summary chip mapping, and export formatting.
- Integration tests must focus on end-to-end user actions. They should verify that the main compare flow does not break: choose left file, choose right file, select sheets when needed, run diff, inspect summary/table output, and export.
- Before adding a function or class, check whether it can be tested directly. If it cannot be tested without heavy setup, simplify the API or move logic to a smaller boundary.
- Before adding a test, check whether it proves meaningful behavior. Do not add tests only for coverage numbers or appearance.
- Test names and assertion messages must clearly describe the behavior under test.
- Before adding a new HTML element, check whether it gives integration tests a reliable query target through semantic role, label, accessible name, or stable visible text.
- Prefer semantic HTML that is both accessible to users and easy to target in integration tests.

### Test Data Generation

- Provide a small deterministic test file generator for CSV and XLSX fixtures.
- Use Python with Polars for fixture data creation.
- Use `uv` as the package manager and runner for the generator.
- Generated fixtures should cover unchanged rows, inserted rows, deleted rows, updated cells, inserted columns, deleted columns, renamed columns when practical, blank cells, blank rows, formatted date-like values, formatted number-like values, and multiple XLSX sheets.
- Keep generated files small so unit and integration tests remain fast.
- Generated fixtures should be reproducible from source and should not require manual editing.

## Out Of Scope

- Custom diff algorithm.
- Custom row/column alignment.
- Primary key selection.
- Ignored column selection.
- Patch application.
- 3-way merge.
- Comparing multiple sheets at once.
- Uploading files to a backend.
- User accounts or saved history.
- Password-protected workbooks.
- Formula recalculation.

## Milestones

1. Replace the starter Vite screen with the upload state.
2. Install and import `xlsx` and `daff`.
3. Add left/right file selection and drag-and-drop.
4. Parse CSV/XLSX files and add worksheet selectors for XLSX files.
5. Normalize selected sheets into daff-ready 2D arrays.
6. Add the thin daff wrapper and compare options.
7. Add left/right table previews.
8. Add structured highlighter-format diff rendering.
9. Add summary chips from `TableDiff.getSummary()`.
10. Add CSV export for the daff diff table.
11. Add standalone HTML export and load-from-embedded-state behavior.

## Acceptance Criteria

- User can compare two CSV files and see previews, summary chips, and a diff table.
- User can compare selected sheets from two XLSX files.
- User can replace either left or right file from the compare screen.
- User can toggle unchanged rows, unchanged columns, whitespace sensitivity, and case sensitivity.
- Diff rendering correctly handles inserted, deleted, updated, omitted, schema, renamed, and reordered markers.
- Updated cells split on the actual daff update token.
- Summary chips match `TableDiff.getSummary()` counts.
- User can export the current diff table as CSV.
- User can export a standalone HTML file that reopens offline and regenerates the diff from embedded left/right files.
- No file contents leave the browser.
