### **ScribeFlow Plugin: Scribe Dashboard Implementation Plan**

**Document Version:** 1.0
**Date:** July 1, 2025
**Author:** John Banister
**Project:** ScribeFlow Plugin for Obsidian
**Feature:** Scribe Dashboard Implementation

---

#### **1. Implementation Overview**

This document outlines the implementation plan for the Scribe Dashboard feature, based on the requirements in `scribe-dashboard-specification.md`. The implementation will use a template-driven parsing approach for maximum flexibility and user control.

#### **2. Core Architecture**

**2.1. Template-Driven Parsing Strategy**
- **Anchor Point**: Use `{{journal-content}}` placeholder as primary content boundary marker
- **Date Extraction**: Extract dates from `{{date}}` placeholder positions in templates
- **Flexible Matching**: Handle any user template that utilizes placeholders
- **Fallback Behavior**: Skip entries without recognizable placeholder patterns

**2.2. User Control Philosophy**
- Users select which folders to scan (multi-select)
- Users select which templates to parse (multi-select from existing templates)
- Template-agnostic approach - work with any placeholder-based template structure

**2.3. UI Design Philosophy**
- **Native Obsidian Styling**: Minimal custom CSS, maximum use of Obsidian's built-in styles
- **Standard HTML Elements**: Use native elements (button, select, table) that inherit Obsidian styling
- **View Pane Integration**: Function as a standard Obsidian view pane, not a modal

#### **3. Implementation Components**

**3.1. Settings Integration**
- **Location**: Add to existing Settings tab in Create ScribeFlow Entry modal
- **New Settings Structure**:
  ```typescript
  dashboardSettings: {
      scanFolders: string[];           // User-selected folders to scan
      parseTemplates: string[];        // Selected template IDs to parse
      previewWordLimit: number;        // Default: 50 words
  }
  ```

**3.2. Template Analysis Service**
- **Purpose**: Analyze selected templates to understand structure
- **Key Functions**:
  - Locate `{{journal-content}}` placeholder positions
  - Identify `{{date}}` placeholder for date extraction
  - Map template structure for content boundary detection
  - Handle multiple template variations

**3.3. Dashboard Parser Service**
- **Scanning Strategy**: Fresh scan approach (like Obsidian's native behavior)
- **File Processing**: Asynchronous processing for performance
- **Content Extraction**:
  - Match journal entries against selected template patterns
  - Extract journal content using template-defined boundaries
  - Calculate word count from journal content only
  - Count images across entire entry
  - Extract preview text (first X words from journal content)

**3.4. Dashboard View Pane**
- **Type**: Dedicated Obsidian view pane (not modal)
- **Access**: Command `ScribeFlow: Open Scribe Dashboard`
- **Styling**: Minimal custom CSS, rely on Obsidian's native styles and CSS variables
- **UI Components**:
  - Standard HTML `<select>` for date filtering (inherits Obsidian styling)
  - Native `<button>` elements for expansion controls (inherits Obsidian styling)
  - Standard `<table>` with Obsidian CSS variables for theming
- **Features**:
  - Date filter dropdown: Today, This Week, This Month, Last 30 Days, This Year
  - Sortable table with 6 columns (default sort: Date, most recent first)
  - Expandable "Journal Entry" column with native "more/less" buttons
  - Clickable file links for navigation using Obsidian's internal link styling
  - Resizable and dockable within Obsidian

**3.5. Data Model**
```typescript
interface DashboardEntry {
    date: string;           // From {{date}} placeholder
    title: string;          // From filename
    preview: string;        // First X words from journal content
    fullContent: string;    // Complete journal content for expansion
    wordCount: number;      // Journal content word count only
    imageCount: number;     // Images in entire entry
    filePath: string;       // For navigation link
}

enum DateFilter {
    TODAY = 'today',
    THIS_WEEK = 'this-week',
    THIS_MONTH = 'this-month',
    LAST_30_DAYS = 'last-30-days',
    THIS_YEAR = 'this-year'
}

interface DashboardState {
    entries: DashboardEntry[];
    filteredEntries: DashboardEntry[];
    currentFilter: DateFilter;
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
}
```

#### **4. Implementation Phases**

**Phase 1: Foundation**
- [ ] Add dashboard settings to existing Settings tab
- [ ] Create basic template analysis service
- [ ] Implement dashboard view pane structure

**Phase 2: Core Parsing**
- [ ] Build template-driven parser service
- [ ] Implement content extraction logic
- [ ] Add folder scanning functionality

**Phase 3: Dashboard Features**
- [ ] Add date filtering dropdown with preset ranges (using native `<select>`)
- [ ] Implement default sorting (Date, most recent first)
- [ ] Complete sortable table implementation for all columns
- [ ] Add expandable journal content with native `<button>` elements
- [ ] Add file navigation links using Obsidian's internal link styling
- [ ] Implement command registration

**Phase 4: Polish & Testing**
- [ ] Performance optimization
- [ ] Error handling and edge cases
- [ ] User feedback and iteration

#### **5. Technical Decisions**

**5.1. Legacy Entry Handling**
- **Approach**: Leave up to user to update content with templates
- **UI Guidance**: Add advisory text about bringing content up-to-date

**5.2. Template Matching Requirements**
- **Hard Requirement**: Templates must utilize placeholders
- **Graceful Degradation**: Skip entries without placeholder patterns
- **Error Handling**: Log parsing issues without breaking dashboard

**5.3. Performance Strategy**
- **Scanning**: Fresh scan on each dashboard open (no caching)
- **Processing**: Asynchronous file processing
- **UI**: Loading states and progress indication

#### **6. File Structure**

**New Files to Create**:
- `src/views/DashboardView.ts` - Main dashboard view pane (minimal custom styling)
- `src/services/DashboardParser.ts` - Template-driven parsing service
- `src/services/TemplateAnalyzer.ts` - Template structure analysis
- `src/types/dashboard.ts` - Dashboard-specific type definitions

**Modified Files**:
- `src/ui/tabs/JournalSettingsTab.ts` - Add dashboard settings
- `src/types.ts` - Add dashboard settings to main settings interface
- `src/main.ts` - Register dashboard command and view

**Styling Approach**:
- Use Obsidian's CSS variables for colors and theming
- Leverage existing Obsidian component classes where possible
- Use native HTML elements (button, select, etc.) that inherit Obsidian styling
- Minimal custom CSS focused only on dashboard-specific layout needs
- Ensure automatic theme adaptation (light/dark modes)

#### **7. Success Criteria**

- [ ] Dashboard opens as dedicated view pane via command
- [ ] Correctly parses user-selected templates with placeholders
- [ ] Extracts journal content boundaries accurately
- [ ] Displays sortable table with all required columns
- [ ] Date filtering works with all preset ranges
- [ ] Journal content expansion/collapse functions smoothly
- [ ] File links navigate correctly to journal entries
- [ ] Styling matches Obsidian's native appearance across themes
- [ ] Handles multiple folders and template variations
- [ ] Performs well with large vaults (100+ journal entries)
- [ ] Gracefully handles parsing errors and edge cases

---

**Next Steps**: Begin Phase 1 implementation with settings integration and basic view pane structure.