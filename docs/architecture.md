# ScribeFlow Plugin Architecture

This document outlines the modular architecture for the ScribeFlow plugin. The primary goal of this architecture is to ensure a clean separation of concerns, making the codebase more maintainable, scalable, and easier to debug. The plugin features a modern Material Design interface optimized for Obsidian's theming system.

## Table of Contents

- [Directory Structure](#directory-structure)
  - [File Breakdown](#file-breakdown)
- [Data Flow](#data-flow)

## Directory Structure

The core logic of the plugin is housed within the `src/` directory. The old, monolithic `main.ts` has been replaced by a collection of focused modules.

```
.
├── src/
│   ├── logic/
│   │   ├── draft-manager.ts
│   │   ├── entry-writer.ts
│   │   └── toc-updater.ts
│   ├── services/
│   │   ├── DashboardParser.ts
│   │   ├── TemplateAnalyzer.ts
│   │   ├── TemplateIntegrationService.ts
│   │   ├── TemplateProcessingService.ts
│   │   └── export/
│   │       ├── types.ts
│   │       ├── ExportFormatters.ts
│   │       ├── DashboardExporter.ts
│   │       └── EntryExporter.ts
│   ├── types/
│   │   └── dashboard.ts
│   ├── ui/
│   │   ├── components/
│   │   │   ├── ExportButton.ts
│   │   │   └── ExportContextMenu.ts
│   │   ├── tabs/
│   │   │   ├── JournalEntryTab.ts
│   │   │   ├── JournalSettingsTab.ts
│   │   │   ├── JournalStructuresTab.ts
│   │   │   ├── InspirationsTab.ts
│   │   │   └── MetricTab.ts
│   │   ├── JournalEntryModal.ts
│   │   ├── TemplateWizardModal.ts
│   │   ├── FileSuggest.ts
│   │   └── FolderSuggest.ts
│   ├── utils/
│   │   ├── callout-parser.ts
│   │   └── date-formatter.ts
│   ├── views/
│   │   └── DashboardView.ts
│   ├── main.ts
│   ├── settings.ts
│   └── types.ts
├── main.ts         (Legacy, now empty)
└── styles.css
```

### File Breakdown

*   **`src/main.ts`**: The main entry point of the plugin. Its responsibilities are minimal:
    *   Loading and saving settings.
    *   Loading and saving drafts.
    *   Registering the command to open the `JournalEntryModal`.
    *   Registering the main settings tab.

*   **`src/types.ts`**: A central file for all shared `interface` definitions, such as `JournalPluginSettings` and `FormState`. This provides a single source of truth for data structures.

*   **`src/settings.ts`**: Contains the `JournalSettingTab` class for the main plugin settings page and defines the `DEFAULT_SETTINGS` object.

*   **`src/logic/`**: This directory contains the "business logic" of the plugin, completely decoupled from the UI.
    *   **`draft-manager.ts`**: Handles the logic for saving, loading, and clearing the state of the journal entry form, enabling the draft functionality.
    *   **`entry-writer.ts`**: Responsible for generating the final Markdown string based on the selected template and form data. It also handles the logic for inserting the content at the cursor position or appending it to the specified journal file.
    *   **`toc-updater.ts`**: Manages automatic table of contents link generation for both year notes and master journals notes, with support for specific callout targeting and proper error handling.

*   **`src/services/`**: Contains specialized services for template management, processing, and data export.
    *   **`DashboardParser.ts`**: Comprehensive parsing service that scans folders recursively for journal entries, extracts content based on template structures, and generates dashboard data. Handles multiple date formats, callout parsing, and content extraction from structured markdown.
    *   **`TemplateAnalyzer.ts`**: Analyzes templates to identify required placeholders and validates template compatibility for dashboard parsing. Ensures templates contain necessary elements for content extraction.
    *   **`TemplateIntegrationService.ts`**: Handles integration with external template plugins (Templater and Core Templates). Provides plugin detection, template file discovery, and conversion from external template syntax to ScribeFlow placeholders with comprehensive structured logging for debugging.
    *   **`TemplateProcessingService.ts`**: Core template processing engine that replaces placeholders with actual content. Handles date formatting, content mapping, metrics processing with automatic word counting, and OneiroMetrics-compatible numeric output formatting.
    *   **`export/`**: Export services for dashboard data and individual journal entries.
        *   **`types.ts`**: TypeScript definitions for export formats, options, and result types with separate enums for dashboard and entry export formats.
        *   **`ExportFormatters.ts`**: Format conversion service that transforms data into Markdown tables, CSV, and JSON formats with proper escaping and statistics integration.
        *   **`DashboardExporter.ts`**: Orchestrates dashboard data exports in multiple formats (Markdown table, CSV, JSON) with comprehensive metadata and file download functionality.
        *   **`EntryExporter.ts`**: Handles individual journal entry exports in multiple formats (Markdown, Plain Text, PDF, Image) with HTML conversion and third-party library integration.

*   **`src/ui/`**: This directory contains all the code related to the user interface.
    *   **`JournalEntryModal.ts`**: The core of the new UI. This class creates the main modal window with Material Design styling, implements the two-pane layout with vertical navigation tabs, and manages action buttons in the header region. It handles the lifecycle of the tabs and passes button references to active tabs. Includes template selection dropdown with dynamic state management.
    *   **`TemplateWizardModal.ts`**: Comprehensive template creation and editing wizard with 3-step workflow. Features creation method selection (direct input, plugin integration, predefined structures), template information forms, and content editing with placeholder reference guides. Supports edit mode for existing templates with smart navigation and validation.
    *   **`FileSuggest.ts`**: Provides file suggestion functionality for markdown files with proper event handling for settings integration.
    *   **`FolderSuggest.ts`**: Provides folder suggestion functionality for image path settings.
    *   **`components/`**: Reusable UI components for specific functionality.
        *   **`ExportButton.ts`**: Professional dropdown export button for dashboard with Lucide icons, Material Design styling, and three format options (Markdown table, CSV, JSON).
        *   **`ExportContextMenu.ts`**: Right-click context menu component for individual journal entries offering four export formats (Markdown, Plain Text, PDF, Image) with native Obsidian Menu API integration.
    *   **`tabs/`**: Each file in this subdirectory represents a single vertical tab in the modal, ensuring the UI is modular and easy to expand.
        *   **`JournalEntryTab.ts`**: Contains the primary form for writing a journal entry with modern Material Design elements including horizontal date/time fields, side-by-side content/preview sections with resizable image previews, and interactive grid-based metrics with visual sliders. Handles image selection from vault files, real-time preview updates, and template processing with placeholder replacement for entry insertion.
        *   **`JournalSettingsTab.ts`**: Contains the in-modal settings for fine-tuning entry creation on the fly, including TOC settings management.
        *   **`JournalStructuresTab.ts`**: Complete template management interface with icon-based CRUD operations (Create, Read, Update, Delete, Copy). Features professional template cards with descriptions, template wizard integration, confirmation dialogs, and responsive grid layouts.
        *   **`InspirationsTab.ts`**: Provides reference content and inspiration for journal entries.
        *   **`MetricTab.ts`**: Individual metric configuration and information tabs.

*   **`src/types/`**: Specialized type definitions for different plugin features.
    *   **`dashboard.ts`**: Type definitions for dashboard functionality including DashboardEntry, DashboardState, DateFilter, and ParsedTemplate interfaces.

*   **`src/utils/`**: Utility functions for data processing and formatting.
    *   **`date-formatter.ts`**: Handles date formatting for display and TOC link generation with proper localization.
    *   **`callout-parser.ts`**: Parses markdown callout structures to find insertion points for TOC links with support for nested lists and indentation.

*   **`src/views/`**: Contains view implementations for different plugin interfaces.
    *   **`DashboardView.ts`**: Main dashboard view implementation featuring sortable tables, date filtering, content previews, and summary statistics. Provides comprehensive journal entry overview with native Obsidian styling and responsive design.

*   **`styles.css`**: All CSS rules are now located in this file, completely separate from the TypeScript code. It contains comprehensive Material Design styling for the modal, tabs, form elements, interactive components, and responsive layouts. The styling uses Obsidian's CSS custom properties for theme compatibility.

## Data Flow

### Journal Entry Creation Flow
1.  The user triggers the `Create Journal Entry` command.
2.  `main.ts` instantiates and opens the `JournalEntryModal`.
3.  `JournalEntryModal` creates the main layout with header containing title, template selection dropdown, and action buttons, initializes the active tab (`JournalEntryTab`), and passes button references to the tab.
4.  The user selects a template from the dropdown, which updates the modal's selected template state.
5.  The user interacts with the modern form interface including date/time inputs, content areas with resizable image preview containers (supporting click-to-select from vault files with width controls), and interactive metric sliders. The state is periodically saved as a draft by the `draft-manager.ts`.
6.  When the user clicks "Insert Entry" (now located in the header), the `JournalEntryTab` gathers the final `FormState` and selected template.
7.  The `TemplateProcessingService` processes the template by replacing all placeholders with actual content including automatic word count calculation and OneiroMetrics-compatible formatting.
8.  The processed content is inserted into the active note at the cursor position using Obsidian's editor API.
9.  If TOC settings are enabled, `toc-updater.ts` automatically updates the specified table of contents in year notes and/or master journals notes with appropriately formatted links.
10. The draft is cleared by `draft-manager.ts`.

### Template Management Flow
1.  The user navigates to the "Journal Structures" tab in the modal.
2.  `JournalStructuresTab` displays existing templates with professional template cards showing names, descriptions, and icon-based action buttons.
3.  For template creation, the user clicks "Start Template Wizard" which opens the `TemplateWizardModal`.
4.  The wizard guides through a 3-step process: creation method selection, template information, and content editing.
5.  For plugin integration, `TemplateIntegrationService` detects available plugins and imports templates with syntax conversion.
6.  Templates are saved to plugin settings and the list is refreshed with new template cards.
7.  For template editing, the wizard opens in edit mode with pre-populated data and modified navigation flow.
8.  Template copying creates duplicates with modified names and new unique IDs.
9.  Template deletion shows confirmation dialogs before removal from settings.

## Template System

The ScribeFlow plugin features a comprehensive template management and processing system that enables users to create, edit, and manage journal entry templates with dynamic placeholder replacement.

### Template Management Features
*   **Professional Template Interface**: Clean template cards with names, descriptions, and icon-based action buttons (Edit, Copy, Delete)
*   **Template Wizard**: 3-step guided creation process with method selection, information entry, and content editing
*   **Plugin Integration**: Seamless import from Templater and Core Templates plugins with automatic syntax conversion
*   **Predefined Structures**: Ready-to-use templates for common journal layouts (flat dual callout, nested 2-level, nested 3-level)
*   **Edit Mode**: Comprehensive editing support with pre-populated forms and smart navigation
*   **Template Copying**: One-click duplication with automatic name modification and unique ID generation
*   **Confirmation Dialogs**: Safe deletion with user confirmation to prevent accidental loss

### Template Processing Engine
*   **Dynamic Placeholder Replacement**: Real-time processing of template placeholders with form data
*   **Date Formatting**: Multiple date format options (YYYY-MM-DD, long form, month-day, compact, time)
*   **Content Mapping**: Flexible content placeholders for journal, dream, and combined content
*   **Automatic Word Counting**: Real-time word count calculation from dream content
*   **Metrics Integration**: Support for both multi-line and inline metrics formatting
*   **OneiroMetrics Compatibility**: Clean numeric output for external analysis tools
*   **Individual Metric Placeholders**: Direct access to specific metric values by name

### Placeholder Reference System
*   **Comprehensive Documentation**: Built-in reference guide showing all available placeholders
*   **Categorized Organization**: Placeholders grouped by type (Dates, Content, Metrics)
*   **Live Examples**: Real-time placeholder examples with expected output formats
*   **Usage Guidance**: Clear descriptions and formatting expectations for each placeholder

### Technical Architecture
*   **Service-Oriented Design**: Separation of template integration and processing concerns
*   **Plugin Detection**: Robust detection of Templater and Core Templates with fallback mechanisms
*   **Syntax Conversion**: Intelligent conversion from Templater syntax to ScribeFlow placeholders
*   **Template Validation**: Built-in validation for template content and placeholder usage
*   **Error Handling**: Graceful degradation with informative error messages
*   **Structured Logging**: Comprehensive debug logging for troubleshooting template issues

### User Experience
*   **Intuitive Workflow**: Step-by-step guidance through template creation and editing
*   **Visual Feedback**: Hover effects, tooltips, and status indicators throughout the interface
*   **Responsive Design**: Adaptive layouts that work across different screen sizes
*   **Theme Integration**: Full compatibility with Obsidian's theme system and CSS custom properties
*   **Keyboard Accessibility**: Proper tab navigation and keyboard shortcuts
*   **Progress Indicators**: Clear visual progress through multi-step workflows

### Template Placeholder Reference
Available placeholders for template content:

**Date Placeholders:**
- `{{date}}` - 2025-06-28
- `{{date-long}}` - June 28, 2025
- `{{date-month-day}}` - June 28
- `{{date-compact}}` - 20250628
- `{{time}}` - 14:30
- `{{time-12}}` - 2:30 PM
- `{{time-12-lower}}` - 2:30pm

**Content Placeholders:**
- `{{content}}` - Combined journal + dream content
- `{{journal-content}}` - Journal text only
- `{{dream-content}}` - Dream text only
- `{{title}}` - Dream title
- `{{dream-title-kebab}}` - Dream title in kebab-case

**Image Placeholders:**
- `{{journal-image}}` - Journal entry image embed
- `{{dream-image}}` - Dream diary image embed

**Metrics Placeholders:**
- `{{metrics}}` - Multi-line format with automatic word count
- `{{metrics-inline}}` - Comma-separated format with automatic word count
- `{{Metric Name}}` - Individual metric values (e.g., `{{Sensory Detail}}`)

## Scribe Dashboard System

The ScribeFlow plugin features a comprehensive dashboard system that provides an overview of journaling activity and trends. The dashboard offers a data-driven, template-based approach to content analysis with native Obsidian styling and responsive design.

### Dashboard Features
*   **Template-Driven Parsing**: Analyzes journal entries based on selected templates to extract structured data
*   **Multi-Folder Scanning**: Recursively scans configured folders for journal entries across all nested subdirectories
*   **Advanced Search System**: Native Obsidian search component with real-time filtering, highlighting, and debounced input
*   **Date Range Filtering**: Provides preset date filters (Today, This Week, This Month, Last 30 Days, This Year) for content analysis
*   **Optimized Data Tables**: Space-efficient 5-column layout with combined metadata fields to eliminate horizontal scrolling
*   **Vocabulary Analysis**: Advanced text processing with unique word counting, vocabulary richness calculation, and linguistic insights
*   **Content Previews**: Expandable content previews with configurable word limits (default 100 words) and "show more/less" functionality
*   **Inline Tag Extraction**: Automatic detection and display of hashtag-based tags (#tagname) from journal content
*   **Collapsible Interface**: Toggle button to hide header and search sections for maximum table viewing space
*   **Enhanced Statistics**: Real-time statistics with vocabulary metrics, productivity insights, and comprehensive pattern analysis
*   **Productivity Pattern Recognition**: Distinguishes between journaling frequency (most frequent day) and writing productivity (highest/lowest word output per day)
*   **File Navigation**: Direct links to journal files for seamless editing workflow
*   **Export Compatibility**: UI optimizations maintain full data separation in exports (CSV, JSON, Markdown)
*   **Mobile Responsive**: Adaptive design without hidden columns, ensuring all data remains accessible on any screen size
*   **Native Styling**: Consistent with Obsidian's theme system using CSS custom properties

### Technical Architecture
*   **Service-Oriented Design**: Separation of parsing, analysis, and view concerns across dedicated services
*   **Recursive Folder Scanning**: Comprehensive file discovery that handles complex folder hierarchies
*   **Template Validation**: Ensures selected templates contain required placeholders for content extraction
*   **Multi-Format Date Support**: Handles ISO dates (YYYY-MM-DD), compact dates (YYYYMMDD), and natural language dates
*   **Callout-Based Parsing**: Extracts content from structured markdown callouts using configurable callout names
*   **Advanced Content Processing**: Intelligent parsing that preserves paragraph structure and formatting
*   **Real-Time Updates**: Dynamic content filtering and statistics calculation without page reloads

### Content Processing Pipeline
The dashboard employs a sophisticated content processing system that maintains readability while extracting structured data:

**Parsing Phase:**
*   **Callout Detection**: Identifies journal entry callouts and nested dream diary sections
*   **Line Processing**: Removes callout prefixes while preserving content structure
*   **Empty Line Preservation**: Maintains empty lines as paragraph break markers
*   **Syntax Cleaning**: Strips markdown/HTML syntax while preserving readable text
*   **Tag Extraction**: Uses regex patterns to identify inline hashtags with nested support (#work/project)

**Analysis Phase:**
*   **Vocabulary Tokenization**: Advanced word extraction handling contractions, URLs, possessives, and markdown
*   **Content Normalization**: Case-insensitive deduplication with intelligent filtering of numeric references
*   **Richness Calculation**: Unique word counting with percentage-based vocabulary diversity scoring
*   **Performance Caching**: LRU cache (1000 items) with content hashing for expensive text processing operations

**Formatting Phase:**
*   **Paragraph Reconstruction**: Converts empty line markers to proper paragraph breaks (`\n\n`)
*   **HTML Generation**: Wraps paragraphs in `<div>` elements with proper spacing
*   **Preview Generation**: Creates word-limited previews while maintaining paragraph structure
*   **Search Integration**: Applies highlighting while preserving paragraph formatting
*   **Table Optimization**: Combines related metadata fields for space-efficient display

### Pattern Recognition & Analytics

The dashboard employs sophisticated analytics to identify journaling patterns and productivity insights:

**Day-Based Analytics:**
*   **Frequency Analysis**: Identifies days of the week when journaling occurs most/least often (entry count-based)
*   **Productivity Analysis**: Calculates average word count per entry for each day of the week to identify writing productivity patterns
*   **Statistical Calculations**: Uses robust algorithms to handle edge cases (days with no entries, single-entry days)

**Pattern Categories:**
*   **Most Frequent Day**: Day with highest number of journal entries (behavioral consistency)
*   **Most Productive Day**: Day with highest average words per entry (content output optimization)  
*   **Least Productive Day**: Day with lowest average words per entry (identifies potential improvement opportunities)

**Analytics Value:**
*   **Schedule Optimization**: Users can identify their most productive writing days for important journaling
*   **Habit Formation**: Understanding frequency patterns helps establish consistent journaling routines
*   **Productivity Insights**: Distinguishing between "when I write" vs "when I write well" provides actionable insights

### Dashboard Components

**DashboardView.ts:**
*   **View Pane Integration**: Dedicated Obsidian view pane (not modal) for persistent dashboard access
*   **Collapsible Header**: Title, subtitle, enhanced statistics with vocabulary metrics, and toggle/refresh controls
*   **Native Search Component**: Obsidian SearchComponent with content and filename filtering, highlighting, and keyboard shortcuts
*   **Filter Controls**: Date range selection with preset options and custom range support
*   **Optimized Data Table**: 5-column layout with combined Entry (date+file) and Words (total+unique) columns for space efficiency
*   **Mobile Responsive**: Adaptive design ensuring all columns remain visible across different screen sizes without hiding data
*   **Export Integration**: UI optimizations for table display while maintaining full data separation in export formats

**DashboardParser.ts:**
*   **Content Extraction**: Parses journal callouts to extract dates, content, and metadata with vocabulary analysis
*   **Template Matching**: Attempts to match file content against selected template structures
*   **Date Normalization**: Converts various date formats to standardized ISO format for consistency
*   **Paragraph Preservation**: Maintains original paragraph structure by preserving empty lines as paragraph breaks
*   **Content Cleaning**: Removes markdown syntax while preserving readable text and formatting structure
*   **Advanced Word Analysis**: Calculates word counts, unique word identification, and vocabulary richness scoring
*   **Tag Processing**: Extracts inline hashtags with support for nested tags and edge case handling
*   **Image Detection**: Counts embedded images within journal callout blocks
*   **Performance Optimization**: Implements LRU caching for expensive vocabulary calculations with content hashing

**TemplateAnalyzer.ts:**
*   **Placeholder Detection**: Identifies required placeholders in templates for dashboard compatibility
*   **Template Validation**: Ensures templates contain minimum required elements (journal-content, date placeholders)
*   **Structure Analysis**: Analyzes template structure to determine optimal parsing strategies

### Dashboard Search System

The dashboard features a comprehensive search system that provides real-time filtering and highlighting of journal entries.

**Search Features:**
*   **Native Obsidian Integration**: Uses Obsidian's SearchComponent for consistent styling and behavior
*   **Multi-Field Search**: Search across journal content and filenames with individual field toggles
*   **Real-Time Filtering**: Debounced search with 300ms delay for optimal performance
*   **Result Highlighting**: Visual highlighting of matched terms in titles, content, and filenames
*   **Keyboard Shortcuts**: Ctrl+F to focus search field, Esc to clear search and highlighting
*   **Smart Clear Handling**: Clear button properly removes search query and visual highlighting

**Search Implementation:**
*   **Event Handling**: Multiple event listeners (input, change, blur) to capture all clear scenarios
*   **Debounced Updates**: Prevents excessive filtering during typing for better performance
*   **State Management**: Search query and results integrated into dashboard state for consistency
*   **Visual Feedback**: Search results counter shows number of matching entries

### Dashboard Settings Integration
*   **Scan Folders Configuration**: Multi-folder selection with folder suggestion and validation
*   **Template Selection**: Choose which templates to use for content parsing from available templates
*   **Preview Word Limit**: Configurable word count for content previews (default: 100 words)
*   **Settings Persistence**: All configuration saved to plugin settings with automatic refresh

### User Experience
*   **Command Integration**: Accessible via command palette ("Open Scribe Dashboard")
*   **Ribbon Button**: Quick access via dashboard icon in Obsidian's ribbon bar
*   **Loading States**: Visual feedback during data refresh operations
*   **Empty State Handling**: Informative messages for missing configuration or no journal entries
*   **Filter Feedback**: Clear indication of active filters and result counts
*   **Keyboard Navigation**: Accessible table navigation and interaction

### Dashboard Data Flow
1.  **Configuration**: User configures scan folders and selects templates in dashboard settings
2.  **Template Analysis**: TemplateAnalyzer validates selected templates for required placeholders
3.  **File Discovery**: DashboardParser recursively scans configured folders for markdown files
4.  **Content Parsing**: Each file is analyzed for journal entry callouts and template matching
5.  **Data Extraction**: Dates, content, word counts, inline tags, and vocabulary metrics are extracted from matching entries
6.  **Vocabulary Analysis**: Advanced text processing calculates unique word counts, vocabulary richness, and linguistic diversity
7.  **Pattern Recognition**: Day-based analytics identify frequency patterns and productivity trends across weekdays
8.  **Performance Caching**: Expensive vocabulary calculations are cached using content hashing and LRU eviction
9.  **Statistics Calculation**: Comprehensive metrics including frequency, productivity, and vocabulary insights
10. **View Rendering**: DashboardView displays data in optimized 5-column table with enhanced pattern recognition statistics
11. **Export Processing**: Data transformations maintain UI optimization while preserving separate fields for exports
12. **Real-Time Updates**: Users can refresh data, apply filters, sort by vocabulary metrics, and navigate to source files

### Date Format Support
The dashboard handles multiple date formats commonly used in journal templates:

**ISO Format**: `2025-01-14` (direct parsing)
**Compact Format**: `^20250114` (converted to ISO)
**Natural Language**: `Tuesday, January 14` (parsed and converted to current year ISO)

### Content Structure Requirements
For optimal dashboard functionality, journal entries should follow this structure:
```markdown
> [!journal-entry] Date Information
> ^CompactDate (optional)
> 
> Journal content goes here...
>
>> [!dream-diary] Dream Title (optional)
>> Dream content goes here...
```

### Performance Considerations
*   **Lazy Loading**: Content is parsed on-demand when dashboard is opened
*   **Caching Strategy**: Parsed data is cached until manual refresh or settings change
*   **Efficient Filtering**: Client-side filtering for responsive user interaction
*   **Memory Management**: Proper cleanup of file handles and parsed content

## Export System

The ScribeFlow plugin features a comprehensive export system that allows users to export both dashboard data and individual journal entries in multiple formats. The system is designed with a service-oriented architecture that separates format conversion, export orchestration, and user interface concerns.

### Export Features
*   **Dashboard Data Export**: Export filtered dashboard data in three formats (Markdown table, CSV, JSON)
*   **Individual Entry Export**: Export single journal entries in four formats (Markdown, Plain Text, PDF, Image)
*   **Professional UI Integration**: Dropdown export button with Lucide icons and right-click context menus
*   **Comprehensive Metadata**: All exports include export timestamps, filter information, and content metadata
*   **Native File Downloads**: Browser-based file download system with proper filename formatting
*   **Statistics Integration**: Dashboard exports include comprehensive summary statistics when available

### Export Formats

**Dashboard Export Formats:**
*   **Markdown Table**: Complete dashboard data formatted as a markdown table with statistics header and metadata
*   **CSV**: Structured data suitable for Excel analysis with proper escaping and headers
*   **JSON**: Structured data with full metadata, statistics, and entry details for programmatic access

**Individual Entry Export Formats:**
*   **Markdown**: Original markdown content with preserved formatting and structure
*   **Plain Text**: Clean text version with markdown syntax stripped and proper line formatting
*   **PDF**: Professional PDF document with styled layout, headers, and formatted content using html2pdf.js
*   **Image**: High-resolution PNG image using html2canvas with proper layout and typography

### Technical Architecture

**Service-Oriented Design:**
*   **ExportFormatters.ts**: Handles format-specific conversion logic with proper escaping and content processing
*   **DashboardExporter.ts**: Orchestrates dashboard data exports with metadata generation and file operations
*   **EntryExporter.ts**: Manages individual entry exports with HTML conversion and third-party library integration
*   **types.ts**: Comprehensive TypeScript definitions with separate enums for dashboard and entry formats

**UI Components:**
*   **ExportButton.ts**: Professional dropdown component with three dashboard export options and Material Design styling
*   **ExportContextMenu.ts**: Right-click context menu for individual entries using Obsidian's native Menu API
*   **Dashboard Integration**: Export button integrated into dashboard controls section with consistent theming

### Export Data Processing

**Content Processing Pipeline:**
*   **Data Preparation**: Extracts and structures data from dashboard entries with comprehensive metadata
*   **Format Conversion**: Transforms data into target formats with proper escaping and syntax handling
*   **Statistics Integration**: Includes summary statistics in dashboard exports with formatted presentation
*   **Filename Generation**: Creates timestamped filenames with consistent naming conventions (YYYYMMDD-HHMMSS format)

**Metadata Inclusion:**
*   **Export Timestamps**: All exports include generation date and time for tracking
*   **Filter Information**: Dashboard exports preserve active date filters and search queries
*   **Content Statistics**: Word counts, image counts, and entry statistics included where applicable
*   **Source Information**: File paths and entry dates maintained for reference

### File Format Specifications

**Dashboard Markdown Table Format:**
```markdown
# ScribeFlow Dashboard Export

**Export Date:** [timestamp]
**Filter:** [active filter]
**Total Entries:** [count]

## Summary Statistics
[comprehensive statistics section]

## Journal Entries
| Date | Content | Words | Images | File |
|------|---------|--------|--------|------|
[table data with escaped markdown]
```

**CSV Format:**
```csv
"Date","Content","Word Count","Image Count","Filename"
"2025-01-14","Escaped content...","256","2","journal-entry.md"
```

**JSON Format:**
```json
{
  "metadata": {
    "exportDate": "ISO timestamp",
    "filter": "date filter",
    "totalEntries": 123
  },
  "statistics": { /* complete statistics object */ },
  "entries": [ /* array of entry objects */ ]
}
```

### HTML-to-PDF/Image Conversion

**PDF Generation:**
*   **html2pdf.js Integration**: Third-party library for high-quality PDF generation
*   **Styled Layout**: Professional typography with headers, metadata, and formatted content
*   **Page Formatting**: Letter size with proper margins and page handling
*   **Content Processing**: Markdown-to-HTML conversion with callout support and proper formatting

**Image Generation:**
*   **html2canvas Integration**: High-resolution canvas-based image generation
*   **Layout Optimization**: Fixed-width layout (800px) for consistent image dimensions
*   **Quality Settings**: High-resolution output (scale: 2) with PNG format for clarity
*   **Memory Management**: Proper cleanup of temporary DOM elements and blob URLs

### User Experience

**Dashboard Export Workflow:**
1.  User clicks export button in dashboard controls
2.  Dropdown menu appears with three format options and descriptive text
3.  User selects desired format (Markdown table, CSV, or JSON)
4.  Export is processed with current filter and search settings
5.  File downloads automatically with timestamped filename
6.  Success notification confirms export completion

**Individual Entry Export Workflow:**
1.  User right-clicks on a journal entry row in the dashboard
2.  Context menu appears with four export format options
3.  User selects desired format (Markdown, Plain Text, PDF, or Image)
4.  Individual entry content is processed and converted
5.  File downloads with entry-specific filename (entry-date-exported-timestamp)
6.  Success notification confirms export completion

### Filename Conventions

**Dashboard Exports:**
*   Markdown Table: `markdown-table-YYYYMMDD-HHMMSS.md`
*   CSV: `dashboard-export-YYYYMMDD-HHMMSS.csv`
*   JSON: `dashboard-export-YYYYMMDD-HHMMSS.json`

**Individual Entry Exports:**
*   All formats: `YYYYMMDD-exported-YYYYMMDD-HHMMSS.extension`
*   Example: `20250114-exported-20250701-143025.pdf`

### Error Handling and Performance

**Robust Error Handling:**
*   Graceful degradation when export libraries fail to load
*   Comprehensive error messages with specific failure information
*   Fallback handling for missing or corrupted content
*   User notifications for both success and failure scenarios

**Performance Optimizations:**
*   Efficient content processing with minimal memory usage
*   Proper cleanup of blob URLs and temporary resources
*   Asynchronous processing to prevent UI blocking
*   Optimized HTML generation for large datasets

### Integration Points

**Dashboard Integration:**
*   Export button positioned in dashboard controls section
*   Respects current date filters and search queries
*   Includes active statistics and filtered entry counts
*   Consistent styling with dashboard theme and layout

**Context Menu Integration:**
*   Native Obsidian Menu API for consistent styling and behavior
*   Keyboard accessibility and proper event handling
*   Visual feedback with icons and descriptive text
*   Seamless integration with existing table interactions

## Table of Contents (TOC) System

The ScribeFlow plugin includes an intelligent table of contents system that automatically maintains navigation links across journal organization notes:

### TOC Features
*   **Dual Update Modes**: Supports updating both year notes and master journals notes simultaneously or independently
*   **Specific Callout Targeting**: Can target specific callouts by name or default to the first callout with a list structure
*   **Smart Link Generation**: Creates appropriately formatted links with date displays and dream diary sub-items when applicable
*   **Error Handling**: Graceful degradation with user notifications when TOC updates fail
*   **Async Updates**: Non-blocking TOC updates that don't interfere with the main journal entry workflow

### Technical Implementation
*   **Callout Parser**: Advanced parsing logic that handles nested callout structures and indented list items
*   **Date Formatting**: Locale-aware date formatting for display consistency across different link formats
*   **File Suggestion**: Integrated file picker for selecting master journals notes with autocomplete functionality
*   **Event Timing**: Carefully timed updates to ensure editor stability and prevent race conditions

### User Experience
*   **Toggle Controls**: Simple on/off switches for each TOC update mode in both main settings and modal settings
*   **File Selection**: User-friendly file picker with autocomplete for master journals note selection
*   **Callout Specification**: Optional callout name fields to target specific TOC sections
*   **Automatic Links**: Seamless link generation including main journal entries and dream diary references

### Link Format Examples
Year Note TOC format:
```markdown
>> - [[2025#^20250627|June 27, 2025]]
>>     - (Dream: [[Journals/Dream Diary/Dream Diary#^20250627-dream-title|Dream Title]])
```

Master Journals Note format:
```markdown
>> - [[2025#^20250627|June 27]]
```

## Image Preview System

The ScribeFlow plugin features an advanced image preview system integrated into both journal and dream content sections:

### Preview Container Features
*   **Resizable containers**: Users can horizontally resize preview areas from 150px to 400px to optimize layout
*   **Click-to-select interface**: Clicking preview containers opens a modal with all vault image files
*   **Real-time preview**: Selected images are immediately displayed with proper scaling and aspect ratio preservation
*   **Width control**: Dedicated input fields allow precise width specification for final markdown output
*   **Hover effects**: Visual feedback with border color changes and subtle animations

### Technical Implementation
*   **File filtering**: Automatically detects image files (.png, .jpg, .jpeg, .gif, .bmp, .svg, .webp) from vault
*   **Binary loading**: Uses Obsidian's vault API to read image files as binary data
*   **Blob URL creation**: Converts binary data to blob URLs for browser display
*   **Memory management**: Properly cleans up blob URLs to prevent memory leaks
*   **Error handling**: Graceful fallback for missing or corrupted image files
*   **Resize observers**: Monitors container size changes for responsive layout adjustments

### User Experience
*   **Side-by-side layout**: Content editing and image preview displayed simultaneously
*   **Non-blocking workflow**: Image selection doesn't interrupt content writing
*   **Visual consistency**: Consistent styling with Material Design principles
*   **Theme integration**: Respects Obsidian's color schemes and CSS custom properties

## Template Examples

The ScribeFlow template system supports various journal structures using placeholder syntax. Here are examples of templates and their processed output:

### Template Input Example
```markdown
> [!journal-entry] {{date-month-day}} [[Journals|John's Journal]]
> ^{{date-compact}}
> 
> {{journal-content}}
>
>> [!dream-diary] {{title}} [[Journals/Dream Diary/Dream Diary#^{{date-compact}}-{{title}}|Dream Diary]]
>> 
>> {{dream-content}}
>>
>>> [!dream-metrics]
>>> {{metrics-inline}}
```

### Processed Output Example
```markdown
> [!journal-entry] June 28 [[Journals|John's Journal]]
> ^20250628
> 
> Today I had an interesting conversation about the nature of dreams and consciousness.
>
>> [!dream-diary] Flying Over Mountains [[Journals/Dream Diary/Dream Diary#^20250628-Flying Over Mountains|Dream Diary]]
>> 
>> I found myself soaring above snow-capped peaks with incredible clarity and control over my flight path.
>>
>>> [!dream-metrics]
>>> Words: 18, Sensory Detail: 4, Emotional Recall: 5, Lost Segments: 1, Descriptiveness: 4, Confidence Score: 5
```

### Predefined Structure Templates

**Flat Dual Callout:**
```markdown
# Dream Journal Entry

> [!journal-entry] {{date-month-day}}
> ^{{date-compact}}
> {{content}}

> [!dream-metrics]
> {{metrics-inline}}
```

**2-Level Nested Structure:**
```markdown
> [!journal-entry] {{date-month-day}}
> ^{{date-compact}}
> {{journal-content}}
> 
>> [!dream-diary] Dream Diary
>> {{dream-content}}
>> 
>>> [!dream-metrics]
>>> {{metrics}}
```

**3-Level Nested Structure:**
```markdown
> [!journal-entry] {{date-month-day}}
> ^{{date-compact}}
> {{journal-content}}
>
>> [!dream-diary] Dream Diary
>> {{dream-content}}
>>
>>> [!dream-metrics]
>>> {{metrics}}
```