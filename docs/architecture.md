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
│   │   └── TemplateProcessingService.ts
│   ├── types/
│   │   └── dashboard.ts
│   ├── ui/
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

*   **`src/services/`**: Contains specialized services for template management and processing.
    *   **`DashboardParser.ts`**: Comprehensive parsing service that scans folders recursively for journal entries, extracts content based on template structures, and generates dashboard data. Handles multiple date formats, callout parsing, and content extraction from structured markdown.
    *   **`TemplateAnalyzer.ts`**: Analyzes templates to identify required placeholders and validates template compatibility for dashboard parsing. Ensures templates contain necessary elements for content extraction.
    *   **`TemplateIntegrationService.ts`**: Handles integration with external template plugins (Templater and Core Templates). Provides plugin detection, template file discovery, and conversion from external template syntax to ScribeFlow placeholders with comprehensive structured logging for debugging.
    *   **`TemplateProcessingService.ts`**: Core template processing engine that replaces placeholders with actual content. Handles date formatting, content mapping, metrics processing with automatic word counting, and OneiroMetrics-compatible numeric output formatting.

*   **`src/ui/`**: This directory contains all the code related to the user interface.
    *   **`JournalEntryModal.ts`**: The core of the new UI. This class creates the main modal window with Material Design styling, implements the two-pane layout with vertical navigation tabs, and manages action buttons in the header region. It handles the lifecycle of the tabs and passes button references to active tabs. Includes template selection dropdown with dynamic state management.
    *   **`TemplateWizardModal.ts`**: Comprehensive template creation and editing wizard with 3-step workflow. Features creation method selection (direct input, plugin integration, predefined structures), template information forms, and content editing with placeholder reference guides. Supports edit mode for existing templates with smart navigation and validation.
    *   **`FileSuggest.ts`**: Provides file suggestion functionality for markdown files with proper event handling for settings integration.
    *   **`FolderSuggest.ts`**: Provides folder suggestion functionality for image path settings.
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
*   **Date Range Filtering**: Provides preset date filters (Today, This Week, This Month, Last 30 Days, This Year) for content analysis
*   **Sortable Data Tables**: Interactive tables with clickable column headers for sorting by date, title, word count, or image count
*   **Content Previews**: Expandable content previews with configurable word limits and "show more/less" functionality
*   **Summary Statistics**: Real-time statistics showing total entries, filtered results, average word count, and monthly activity
*   **File Navigation**: Direct links to journal files for seamless editing workflow
*   **Native Styling**: Consistent with Obsidian's theme system using CSS custom properties

### Technical Architecture
*   **Service-Oriented Design**: Separation of parsing, analysis, and view concerns across dedicated services
*   **Recursive Folder Scanning**: Comprehensive file discovery that handles complex folder hierarchies
*   **Template Validation**: Ensures selected templates contain required placeholders for content extraction
*   **Multi-Format Date Support**: Handles ISO dates (YYYY-MM-DD), compact dates (YYYYMMDD), and natural language dates
*   **Callout-Based Parsing**: Extracts content from structured markdown callouts using configurable callout names
*   **Real-Time Updates**: Dynamic content filtering and statistics calculation without page reloads

### Dashboard Components

**DashboardView.ts:**
*   **View Pane Integration**: Dedicated Obsidian view pane (not modal) for persistent dashboard access
*   **Header Section**: Title, subtitle, refresh functionality, and summary statistics display
*   **Filter Controls**: Date range selection with preset options and custom range support
*   **Data Table**: Sortable columns for Date, Title, Journal Entry, Word Count, Images, and File
*   **Responsive Layout**: Adaptive design that works across different screen sizes and themes

**DashboardParser.ts:**
*   **Content Extraction**: Parses journal callouts to extract dates, content, and metadata
*   **Template Matching**: Attempts to match file content against selected template structures
*   **Date Normalization**: Converts various date formats to standardized ISO format for consistency
*   **Word Counting**: Calculates accurate word counts from extracted journal content
*   **Image Detection**: Counts embedded images within journal callout blocks

**TemplateAnalyzer.ts:**
*   **Placeholder Detection**: Identifies required placeholders in templates for dashboard compatibility
*   **Template Validation**: Ensures templates contain minimum required elements (journal-content, date placeholders)
*   **Structure Analysis**: Analyzes template structure to determine optimal parsing strategies

### Dashboard Settings Integration
*   **Scan Folders Configuration**: Multi-folder selection with folder suggestion and validation
*   **Template Selection**: Choose which templates to use for content parsing from available templates
*   **Preview Word Limit**: Configurable word count for content previews (default: 50 words)
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
5.  **Data Extraction**: Dates, content, word counts, and metadata are extracted from matching entries
6.  **View Rendering**: DashboardView displays data in sortable table with filtering and statistics
7.  **Real-Time Updates**: Users can refresh data, apply filters, and navigate to source files

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