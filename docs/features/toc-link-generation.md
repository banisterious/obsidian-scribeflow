# Feature: Automatic TOC Link Generation

## Table of Contents

- [Overview](#overview)
- [Feature Requirements](#feature-requirements)
  - [Settings Interface](#settings-interface)
  - [Behavior Specification](#behavior-specification)
- [Technical Implementation](#technical-implementation)
  - [Data Sources (Already Available)](#data-sources-already-available)
  - [Core Functions to Implement](#core-functions-to-implement)
  - [Integration Points](#integration-points)
  - [Error Handling](#error-handling)
  - [File Structure](#file-structure)
- [Testing Scenarios](#testing-scenarios)
  - [Positive Cases](#positive-cases)
  - [Edge Cases](#edge-cases)
  - [Negative Cases](#negative-cases)
- [Future Enhancements](#future-enhancements)
  - [Potential Extensions](#potential-extensions)
  - [Performance Considerations](#performance-considerations)
- [Dependencies](#dependencies)
  - [Obsidian API Usage](#obsidian-api-usage)
  - [Internal Dependencies](#internal-dependencies)
- [Acceptance Criteria](#acceptance-criteria)
  - [Must Have](#must-have)
  - [Should Have](#should-have)
  - [Could Have](#could-have)

## Overview

Add two optional toggles in settings that automatically insert links to journal entries in existing table of contents structures when a new journal entry is created. This feature maintains organized navigation across year notes and a master journals note.

## Feature Requirements

### Settings Interface

#### Toggle Controls
- **Toggle 1**: "Update year note table of contents"
  - Description: "Automatically add journal entry links to the current year note's TOC"
  - Default: Disabled
- **Toggle 2**: "Update master journals table of contents" 
  - Description: "Automatically add journal entry links to the master journals note's TOC"
  - Default: Disabled

#### Configuration Fields
- **Master Journals Note**: File autosuggester field
  - Label: "Master journals note"
  - Description: "Select the note containing the master table of contents"
  - Required when Toggle 2 is enabled
  - Uses Obsidian's native file suggestion component

### Behavior Specification

#### Toggle 1: Year Note TOC Updates

**Trigger Conditions:**
- Toggle 1 is enabled
- A year note is currently open in the active editor
- The year note contains at least one nested callout

**Target Location:**
- First nested callout in the currently open year note
- End of the existing list within that callout

**Insert Format:**
```markdown
>> - [[2025#20250624|June 24, 2025]]
>>     - (Dream: [[Journals/Dream Diary/Dream Diary#^20250624-cliche|Cliche]])
```

**Insert Logic:**
- Main journal entry link is always inserted
- Dream diary subitem is only inserted if dream content exists in the form
- Links are appended to the end of the existing list

#### Toggle 2: Master Journals Note TOC Updates

**Trigger Conditions:**
- Toggle 2 is enabled
- Master journals note is specified in settings
- Master journals note exists and is accessible

**Target Location:**
- First nested callout in the specified master journals note
- End of the existing list within that callout

**Insert Format:**
```markdown
>> - [[2025#^20250624|June 24]]
```

## Technical Implementation

### Data Sources (Already Available)

#### From Form State:
- `state.date`: Form date input (e.g., "2025-06-24")
- `dateBlockID`: Block ID format (e.g., "^20250624") 
- `dreamTitle`: Dream title if present
- `dreamContent`: Dream content to determine if dream link needed

#### From Settings:
- `masterJournalsNote`: Path to master journals note
- `toggleYearNote`: Boolean for year note updates
- `toggleMasterJournals`: Boolean for master journals updates

### Core Functions to Implement

#### 1. Date Formatting Function
```typescript
function formatDisplayDate(date: string): string {
    // Convert "2025-06-24" to "June 24, 2025"
}
```

#### 2. Callout Parsing Function
```typescript
function findFirstCalloutListEnd(content: string): number {
    // Parse note content to find insertion point
    // Return line number for insertion
}
```

#### 3. Link Generation Functions
```typescript
function generateYearNoteLinks(state: FormState, dateBlockID: string): string[] {
    // Generate main journal link and optional dream link
}

function generateMasterJournalsLink(state: FormState, dateBlockID: string): string {
    // Generate single master journals link
}
```

#### 4. Note Update Function
```typescript
function updateNoteWithLinks(notePath: string, links: string[]): Promise<void> {
    // Insert links at appropriate position in target note
}
```

### Integration Points

#### Settings Integration
- Add toggles to `ScribeFlowPluginSettings` interface
- Add master journals note path to settings
- Update settings UI in both main plugin settings and modal settings tab

#### Entry Writer Integration
- Extend `insertJournalEntry()` function in `entry-writer.ts`
- Call TOC update functions after successful journal entry insertion
- Maintain existing functionality while adding optional TOC updates

### Error Handling

#### Validation Checks
- **Year note validation**: Verify current note contains callout structure
- **Master note validation**: Verify specified note exists and is readable
- **Insertion point validation**: Confirm callout parsing finds valid insertion point

#### Error Responses
- **Show user notice**: Brief error message for user feedback
- **Log detailed error**: Console logging for debugging
- **Graceful degradation**: Continue with journal entry creation even if TOC updates fail

#### Error Scenarios
1. **No callout found**: "Could not find table of contents in current note"
2. **Master note not found**: "Master journals note not found or inaccessible" 
3. **Parse failure**: "Could not determine insertion point in table of contents"
4. **Write failure**: "Failed to update table of contents"

### File Structure

#### New Files
- `src/logic/toc-updater.ts`: Core TOC update functionality
- `src/utils/date-formatter.ts`: Date formatting utilities
- `src/utils/callout-parser.ts`: Callout parsing utilities

#### Modified Files
- `src/types.ts`: Add TOC settings to interface
- `src/settings.ts`: Add TOC toggle controls and file selector
- `src/ui/tabs/JournalSettingsTab.ts`: Mirror TOC settings in modal
- `src/logic/entry-writer.ts`: Integrate TOC updates into entry insertion

## Testing Scenarios

### Positive Cases
1. **Year note update**: Current note has callout, links inserted correctly
2. **Master note update**: Specified note exists, links inserted correctly  
3. **Both updates**: Both toggles enabled, both notes updated successfully
4. **Dream link**: Dream content present, dream subitem added to year note
5. **No dream link**: No dream content, only main link added to year note

### Edge Cases
1. **No callout in year note**: Error handling, journal entry still created
2. **Master note missing**: Error handling, other updates still proceed
3. **Empty callout**: Links added as first items in list
4. **Malformed callout**: Robust parsing handles various callout formats

### Negative Cases
1. **Invalid file paths**: Proper error messages, no crashes
2. **Permission issues**: Handle read/write permission errors
3. **Corrupted note content**: Parser handles unexpected content gracefully

## Future Enhancements

### Potential Extensions
- **Custom link formats**: Allow users to customize link text patterns
- **Multiple master notes**: Support updating multiple TOC notes
- **Smart positioning**: Insert links in chronological order rather than always at end
- **Batch updates**: Update TOCs for existing entries when settings change
- **Template support**: Allow custom templates for TOC link formats

### Performance Considerations
- **Async operations**: Ensure TOC updates don't block UI
- **Error batching**: Handle multiple errors gracefully
- **File watching**: Consider implications of modifying multiple notes

## Dependencies

### Obsidian API Usage
- `app.vault.read()`: Read note contents for parsing
- `app.vault.modify()`: Update notes with new links  
- `app.workspace.getActiveFile()`: Determine current year note
- `app.vault.getAbstractFileByPath()`: Validate master journals note

### Internal Dependencies
- Existing form state management
- Current date formatting utilities
- Settings management system
- Entry writer workflow

## Acceptance Criteria

### Must Have
- [ ] Two toggle controls in settings interface
- [ ] File autosuggester for master journals note
- [ ] Year note updates when toggle enabled and conditions met
- [ ] Master note updates when toggle enabled and file specified
- [ ] Proper error handling with user feedback
- [ ] Integration with existing entry creation workflow

### Should Have
- [ ] Settings mirrored in modal interface
- [ ] Comprehensive error logging
- [ ] Graceful degradation on failures
- [ ] Performance optimization for file operations

### Could Have
- [ ] Preview of generated links before insertion
- [ ] Undo functionality for TOC updates
- [ ] Validation of TOC structure before enabling toggles