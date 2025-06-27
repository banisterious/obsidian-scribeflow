# Changelog

All notable changes to the ScribeFlow Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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