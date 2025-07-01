# Changelog

All notable changes to the ScribeFlow Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2025-07-01

### Added
- **Advanced Dashboard Search**: Native Obsidian search integration with real-time filtering
  - Search across journal content and filenames with individual field toggles
  - Live result highlighting with visual feedback for matched terms
  - Keyboard shortcuts (Ctrl+F to focus, Esc to clear) for efficient navigation
  - Debounced search with 300ms delay for optimal performance
  - Smart clear handling that properly removes search query and highlighting

### Enhanced
- **Collapsible Dashboard Interface**: Toggle button to hide header and search sections
  - Maximizes table viewing space for better journal entry browsing
  - Automatically clears active searches when collapsing to prevent confusion
  - Clean toggle between full-featured and minimal viewing modes
- **Optimized Table Layout**: Removed title column for cleaner, more focused design
  - More space allocated to journal content preview
  - Streamlined 5-column layout (Date, Journal Entry, Words, Images, File)
- **Improved Content Previews**: Updated default word limit from 50 to 100 words
  - Better balance between preview length and table space
  - Fixed CSS issues that were truncating content with ellipsis
  - Proper multi-line wrapping for longer previews
  - **Paragraph Break Preservation**: Journal entries now display with proper paragraph formatting
    - Preserves empty lines as paragraph breaks during content parsing
    - Enhanced readability with natural paragraph spacing in table view

### Fixed
- **Table Display Issues**: Resolved overflow problems that limited visible entries
  - Fixed CSS `overflow: hidden` that was cutting off table rows
  - All journal entries now properly display with scrollable table container
- **Search Component Integration**: Proper event handling for native Obsidian SearchComponent
  - Multiple event listeners ensure all clear scenarios are captured
  - Consistent behavior with other Obsidian search interfaces

## [0.4.0] - 2025-07-01

### Added
- **Scribe Dashboard**: Comprehensive journal overview with template-driven parsing
  - Sortable data table displaying entries by date, title, word count, images, and source file
  - Smart content preview with expandable journal content and configurable word limits
  - Flexible date filtering (today, this week, month, year, all time)
  - Multi-entry support to discover multiple journal entries per file
  - Dream content inclusion capturing both journal and dream diary content while excluding metrics
  - Quick access ribbon buttons for dashboard and journal entry creation
  - Dashboard settings for configuring scan folders and parsing templates
- **Enhanced Content Processing**:
  - Advanced content cleaning to strip markdown/HTML syntax while preserving readable text
  - Support for multiple date formats including ISO dates, compact dates (^20250114), and natural language
  - Recursive folder scanning for comprehensive journal discovery
  - Template-driven parsing with validation and analysis

### Enhanced
- **User Interface**: New ribbon buttons with notebook-pen and table icons for quick access
- **Settings Interface**: Added comprehensive dashboard configuration section
- **Content Extraction**: Improved parsing to handle nested callouts and complex markdown structures
- **Template Integration**: Enhanced template analyzer for dashboard compatibility

### Fixed
- **Modal Scrolling**: Resolved settings tab cut-off issues with proper flexbox layout
- **Template Processing**: Fixed date/time formatting and kebab-case title handling
- **Content Display**: Enhanced "more/less" button functionality for content expansion

### Technical
- **New Services**: Added `DashboardParser` and `TemplateAnalyzer` for robust content processing
- **View System**: Implemented `DashboardView` as native Obsidian view pane
- **Type Definitions**: Added comprehensive dashboard-related type definitions
- **CSS Integration**: Enhanced styling with native Obsidian CSS variables for theme compatibility

## [0.4.0-alpha] - 2025-06-28

### Added
- **Complete Template System**:
  - Template management interface with professional template cards
  - CRUD operations (Create, Read, Update, Delete, Copy) with icon-based buttons
  - 3-step template creation wizard with guided workflow
  - Multiple creation methods: Direct input, plugin integration, predefined structures
- **Template Plugin Integration**:
  - Templater plugin support with automatic syntax conversion
  - Core Templates plugin compatibility
  - Smart template import with structured logging for debugging
- **Interactive Placeholder System**:
  - Dropdown placeholder selector with organized categories
  - Smart cursor-based insertion with position preservation
  - Comprehensive placeholder reference with live examples
- **Enhanced Template Processing**:
  - Automatic word counting from dream content
  - Multiple metrics formatting options (multi-line and inline)
  - OneiroMetrics compatibility with clean numeric output
  - Dynamic date formatting with multiple format options
- **Predefined Template Structures**:
  - Flat dual callout layout
  - 2-level and 3-level nested structures
  - Editable content customization after selection

### Enhanced
- **User Interface**: Professional icon-based buttons with tooltips and hover effects
- **Template Management**: Edit mode support with pre-populated forms and smart navigation
- **Metrics Processing**: Word count automatically included in all metrics output
- **Validation**: Comprehensive template content validation with informative error messages
- **Responsive Design**: Adaptive layouts for different screen sizes with theme integration

### Technical
- **Service Architecture**: New `TemplateIntegrationService` and `TemplateProcessingService`
- **Plugin Detection**: Robust detection of external template plugins with fallback mechanisms
- **Error Handling**: Graceful degradation with structured logging throughout template operations
- **Documentation**: Complete architecture documentation update with template system coverage

## [0.3.0] - 2025-06-28

### Added
- **Automatic Table of Contents System**: 
  - Smart TOC link generation for year notes and master journals notes
  - Dual toggle controls for independent update modes
  - Specific callout targeting with customizable callout names
  - Automatic dream diary sub-item links when dreams are included
- **Enhanced Settings Interface**:
  - File autosuggester for master journals note selection
  - Callout name specification fields for precise TOC targeting
  - Settings mirrored in both main plugin settings and modal interface
- **Advanced Callout Parser**:
  - Intelligent parsing of nested callout structures
  - Support for indented list items and sub-entries
  - Proper handling of complex markdown callout hierarchies
- **Improved File Integration**:
  - Custom `FileSuggest` component with proper event handling
  - Enhanced `FolderSuggest` with consistent behavior
  - Robust file selection with autocomplete functionality

### Enhanced
- **Date Handling**: Fixed timezone-aware date initialization to always show today's date
- **Draft Management**: Proper draft loading and restoration in modal interface
- **Error Handling**: Comprehensive error messages and graceful degradation for TOC operations
- **User Experience**: Non-blocking TOC updates that don't interfere with journal entry workflow

### Fixed
- **Content Duplication**: Resolved race condition causing journal entries to be written twice
- **Settings Persistence**: Fixed master journals note path not saving when selected from suggestions
- **Date Field**: Corrected timezone issue causing date field to default to tomorrow
- **TOC Insertion**: Fixed insertion point detection for callouts with indented sub-items

### Technical
- **Architecture**: Added new `utils/` directory with date formatting and callout parsing utilities
- **Code Organization**: Modular TOC system with separate updater, parser, and formatter components
- **Event Handling**: Improved suggestion component integration with settings system
- **Async Operations**: Proper timing for TOC updates to ensure editor stability

## [0.2.1] - 2024-12-27

### Enhanced
- **Improved Resize Capabilities**: Both textareas and image previews now support horizontal and vertical resizing
- **Increased Image Preview Limits**: Maximum image preview size expanded to 800px width and 600px height
- **Better Layout Control**: Added minimum height constraints (100px) for image preview containers

### Fixed
- **Image Embedding Syntax**: Added missing exclamation points for proper image display in markdown (`![[image.png|400]]`)
- **Cleaner Headers**: Removed word count from journal entry headers for a more minimal appearance

### Technical
- **Code Cleanup**: Removed unused `wordCount` variable
- **CSS Improvements**: Updated resize constraints in both inline and external CSS

## [0.2.0] - 2024-12-27

### Added
- **Plugin Rebranding**: Renamed from "Chronicle" to "ScribeFlow" with updated branding
- **Comprehensive Settings System**: 
  - Customizable callout names for journal-entry and dream-diary
  - Image folder autosuggester for organizing images
  - File type multi-select for filtering image picker (PNG, JPG, SVG, etc.)
  - Unlimited selectable dream metrics with drag-to-reorder
- **Enhanced Modal Interface**:
  - Reference section with Inspirations tab and individual metric description tabs
  - Settings tab within modal mirroring main plugin settings
  - 18+ detailed dream metrics with comprehensive descriptions and scoring guides
- **Smart Image Management**:
  - Folder autosuggester using Obsidian's native `AbstractInputSuggest`
  - Image file type filtering based on user preferences
  - Improved error messages when no images found
- **UI/UX Improvements**:
  - Material Design styling with Obsidian theme compatibility
  - Proper CSS class organization with `sfp-` prefixes
  - Obsidian-style setting headers and sentence case naming
  - Removed inline styles in favor of CSS classes
- **Documentation**: Added MCL Multi Column requirement note for image callout floating

### Changed
- **Architecture Overhaul**: Complete redesign of plugin structure and settings system
- **Settings Management**: 
  - Moved from hardcoded values to user-configurable settings
  - Settings available in both main plugin settings and modal interface
  - Dynamic metric selection replacing fixed metric set
- **Image Picker Logic**: Now respects user's selected file types instead of hardcoded extensions
- **Right-click Menu**: Updated text to "ScribeFlow: insert journal entry"
- **Plugin Metadata**: Updated all references, URLs, and documentation for ScribeFlow branding

### Fixed
- **Image Types Manager Position**: Fixed bug where file type selector would drop below Dream metrics section
- **CSS Class Conflicts**: Resolved potential conflicts with Obsidian's global styles using proper prefixing
- **Unused Variables**: Cleaned up TypeScript warnings for unused declarations
- **Inline Styles**: Moved all inline styles to CSS classes for better maintainability

### Technical Improvements
- **TypeScript**: Enhanced type safety with comprehensive interfaces
- **Code Organization**: Better separation of concerns and modular structure
- **Build Process**: Optimized build pipeline with proper error handling
- **Documentation**: Complete overhaul of README.md and project documentation

## [0.1.0] - 2024-03-XX

### Added
- Initial release as Chronicle Plugin
- Basic journal entry creation with tabbed interface
- Dream diary integration with metrics tracking
- Image attachment support with preview
- Form state persistence
- Two-column layout with resizable columns
- Modern Material Design UI

### Features
- Journal Entry tab with word count tracking
- Dream Diary tab with title, content, and metrics
- Image selection with preview and resize functionality
- Comprehensive dream metrics (sensory detail, emotional recall, etc.)
- Auto-save form state between sessions
- Customizable date formatting and target note configuration