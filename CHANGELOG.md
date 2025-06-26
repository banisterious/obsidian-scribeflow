# Changelog

All notable changes to the Custom Journal Entry Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Versioning Guidelines

This project follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR** version (1.0.0) for incompatible API changes
- **MINOR** version (0.1.0) for backwards-compatible functionality
- **PATCH** version (0.0.1) for backwards-compatible bug fixes

## [Unreleased]

### Added
- Modern tabbed interface for Journal Entry and Dream Diary
- Two-column layout with resizable columns
- Clear Image button functionality
- Automatic dream diary inclusion based on content
- Improved responsive design
- Enhanced tab switching animations
- Better visual feedback for active states

### Changed
- Removed manual dream diary toggle in favor of content-based inclusion
- Updated layout to use two main columns instead of three
- Improved textarea resizing behavior
- Enhanced column resize handles
- Better organization of UI components
- Optimized form state management
- Updated CSS class naming and structure

### Fixed
- Horizontal resizing of columns
- Image selection after clearing
- Dream content textarea resizing
- Column resize handle visibility
- Top section spacing and alignment
- Tab switching behavior
- Form state restoration with new layout

## [0.1.0] - 2024-03-XX

### Added
- Initial release
- Basic journal entry creation
- Dream diary integration
- Image attachment support
- Metrics tracking for dreams
- Form state persistence
- Settings management
- Target note configuration

### Changed
- Migrated from QuickAdd-based solution
- Implemented custom UI
- Added proper callout formatting
- Enhanced error handling

### Fixed
- Various bug fixes and improvements

## Changelog Template

When adding new entries to the changelog, follow this template:

```markdown
## [X.Y.Z] - YYYY-MM-DD
### Added
- New feature 1
  - Sub-feature or detail
  - Implementation note
- New feature 2
  - Sub-feature or detail
  - Implementation note

### Changed
- Changed feature 1
  - What changed
  - Why it changed
- Changed feature 2
  - What changed
  - Why it changed

### Deprecated
- Deprecated feature 1
  - Why it's deprecated
  - What to use instead
- Deprecated feature 2
  - Why it's deprecated
  - What to use instead

### Removed
- Removed feature 1
  - Why it was removed
  - Migration path if any
- Removed feature 2
  - Why it was removed
  - Migration path if any

### Fixed
- Fixed bug 1
  - What was fixed
  - How it was fixed
- Fixed bug 2
  - What was fixed
  - How it was fixed

### Security
- Security fix 1
  - What was fixed
  - Impact of the fix
- Security fix 2
  - What was fixed
  - Impact of the fix
```

### Guidelines for Changelog Entries

1. **Be Specific**: Include details about what changed and why
2. **Be Consistent**: Use the same format and style throughout
3. **Be Clear**: Write entries that are easy to understand
4. **Be Complete**: Include all relevant changes
5. **Be Organized**: Group related changes together
6. **Be Timely**: Add entries as changes are made
7. **Be Accurate**: Verify all information is correct 