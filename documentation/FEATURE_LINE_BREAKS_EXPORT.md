# Feature: Fix Line Break Handling in Export Formats

## Overview
Line breaks entered in form fields are not properly preserved when exporting meetings to various formats (HTML, DOCX, RTF, Markdown). This results in text appearing on single lines instead of maintaining the intended formatting.

## Current Status Analysis

### ✅ Working Correctly
- **RTF Export**: Line breaks correctly converted to `\par` commands in `RTFGenerator.ts:362`
- **Basic Structure**: All formats maintain overall document structure

### ❌ Issues Found

#### 1. HTML Export
- **File**: `src/utils/export/transformers/HTMLGenerator.ts`
- **Issue**: `escapeHtml()` method at line 580 doesn't convert `\n` to `<br>` tags
- **Impact**: Multi-line text appears as single line in HTML exports
- **Current**: `text.replace(/\n/g, "")` (line breaks ignored)
- **Needed**: `text.replace(/\n/g, "<br>")` (after HTML escaping)

#### 2. DOCX Export  
- **File**: `src/utils/export/transformers/DOCXTransformer.ts`
- **Issue**: Text content creates single `Paragraph` objects, line breaks within text aren't preserved
- **Impact**: Multi-line text appears as single line in DOCX exports
- **Current**: Single `TextRun` per field
- **Needed**: Split text on `\n` and create multiple `TextRun` objects with line breaks

#### 3. Markdown Export
- **File**: `src/utils/export/transformers/MarkdownTransformer.ts`
- **Issue**: Uses single `\n` between label and content, but doesn't handle line breaks within content properly
- **Impact**: Line breaks in content may not render correctly in markdown viewers
- **Current**: `**[${label}]**\n${content}` (lines 231-249) - treats all `\n` the same
- **Needed**: Smart line break handling:
  - Single `\n` → Two spaces + newline (hard line break within paragraph)
  - Double `\n\n` → Empty line (paragraph break)
  - This preserves user intent for both line breaks and paragraph breaks

## Technical Implementation Plan

### 1. HTML Export Fix
**Location**: `HTMLGenerator.ts:580-606`

```typescript
private escapeHtml(text: string): string {
  if (typeof text !== "string") {
    return "";
  }

  // Existing HTML escaping logic...
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");  // ← ADD THIS LINE

  return escaped;
}
```

### 2. DOCX Export Fix
**Location**: `DOCXTransformer.ts` (text rendering sections)

```typescript
// Helper function to create TextRuns with line breaks
private createTextRunsWithLineBreaks(text: string, styling: any): TextRun[] {
  const lines = text.split('\n');
  const runs: TextRun[] = [];
  
  lines.forEach((line, index) => {
    runs.push(new TextRun({ text: line, ...styling }));
    if (index < lines.length - 1) {
      runs.push(new TextRun({ text: '', break: 1 })); // Line break
    }
  });
  
  return runs;
}

// Update all TextRun creations to use this helper
```

### 3. Markdown Export Fix
**Location**: `MarkdownTransformer.ts:231-249`

```typescript
private formatBlockFromData(blockData: any): string {
  const label = blockData.label;

  switch (blockData.type) {
    case "textblock":
      return `**[${label}]**\n\n${this.formatMarkdownText(blockData.content.text)}`;
    // ... other cases
  }
}

private formatMarkdownText(text: string): string {
  // Smart line break handling:
  // - Single \n → two spaces + \n (hard line break within paragraph)
  // - Double \n\n → remains \n\n (paragraph break)
  return text.replace(/\n(?!\n)/g, '  \n');
}
```

**Rationale**: This approach gives users maximum control:
- **Single `\n`** becomes hard line break (two spaces + newline) for line breaks within paragraphs
- **Double `\n\n`** remains paragraph break (empty line) for separating paragraphs
- Uses negative lookahead regex `/\n(?!\n)/g` to only replace `\n` when NOT followed by another `\n`

## Testing Strategy

### Unit Tests Required
- Test each export format with multi-line text input
- Verify line breaks are preserved in output
- Test edge cases (empty lines, multiple consecutive line breaks)

### Test Data
```typescript
const testContent = `First line
Second line

Fourth line (after empty line)
Fifth line`;
```

### Expected Results
- **HTML**: `First line<br>Second line<br><br>Fourth line (after empty line)<br>Fifth line`
- **DOCX**: Separate TextRuns with line breaks
- **RTF**: `First line\par Second line\par \par Fourth line (after empty line)\par Fifth line`
- **Markdown**: `First line  \nSecond line  \n\nFourth line (after empty line)  \nFifth line`

### Markdown Behavior Explanation
With the smart line break handling:
- `First line\nSecond line` → `First line  \nSecond line` (hard line break)
- `Second line\n\nFourth line` → `Second line\n\nFourth line` (paragraph break, unchanged)
- `Fourth line\nFifth line` → `Fourth line  \nFifth line` (hard line break)

## Files to Modify

### Primary Changes
1. `src/utils/export/transformers/HTMLGenerator.ts` - Fix `escapeHtml()` method
2. `src/utils/export/transformers/DOCXTransformer.ts` - Add line break handling
3. `src/utils/export/transformers/MarkdownTransformer.ts` - Fix markdown line breaks

### Test Files
1. `src/test/export/` - Add line break preservation tests
2. Update existing export tests to include multi-line content

## Priority
- **High**: HTML and DOCX fixes (most commonly used formats)
- **Medium**: Markdown fix (affects readability in markdown viewers)
- **Low**: RTF already working correctly

## Dependencies
- No new dependencies required
- Uses existing `docx` library features for DOCX line breaks
- Pure string manipulation for HTML and Markdown

## Backward Compatibility
- All changes are additive (preserve existing functionality)
- No breaking changes to export API
- Existing single-line content will continue to work unchanged

## Success Criteria
- [ ] Multi-line text in form fields preserves line breaks in all export formats
- [ ] HTML exports show `<br>` tags for line breaks
- [ ] DOCX exports show proper line breaks in Word
- [ ] Markdown exports render line breaks correctly in markdown viewers
- [ ] RTF exports continue to work correctly (no regression)
- [ ] All existing tests continue to pass
- [ ] New tests verify line break preservation