# Chronicle Plugin for Obsidian

A plugin for Obsidian that provides a structured way to create journal entries with integrated dream diary tracking and robust image support.

## Features

- **Modern Tabbed Interface**: 
  - Clean, two-column layout with image preview and content sections
  - Tabbed interface for switching between Journal Entry and Dream Diary
  - Resizable columns for customizable workspace
- **Structured Journal Entries**: Create formatted journal entries with a consistent structure
- **Dream Diary Integration**: 
  - Dedicated dream diary tab with title, content, and metrics
  - Dream section automatically included only when content is present
  - Comprehensive dream metrics tracking
- **Word Count Tracking**: 
  - Total word count combining journal and dream diary content
  - Separate word count for dream diary section
  - Real-time updates as you type
- **Image Support**: 
  - Attach images using an autocomplete field with filename suggestions
  - Helper message shown when no images are found
  - Resizable image preview with persistent size
  - Clear image functionality with ability to select new images
  - Robust preview logic with no recursion issues
- **Metrics for Dreams**: Track various aspects of your dreams:
  - Sensory Detail
  - Emotional Recall
  - Lost Segments
  - Descriptiveness
  - Confidence Score
- **Form State Persistence**: 
  - Auto-save functionality for all form fields
  - Restore previous entries with one click
  - Persistent image preview size and selection
- **Customizable Settings**: 
  - Date format
  - Target note location (with autocomplete)
  - Form state preferences

## Usage

1. Open the command palette (Ctrl/Cmd + P)
2. Select "Create Journal Entry"
3. Fill in your journal entry in the right column
4. Switch to the Dream Diary tab to add dream details (optional)
5. Add images using the autocomplete field in the left column
   - Preview and resize images as needed
   - Use the Clear Image button to remove and select different images
6. Click "Create Entry" to save

## Layout

The plugin features a modern, two-column layout:

- **Left Column**: Image selection and preview
  - Image search with autocomplete
  - Resizable preview area
  - Clear image functionality
- **Right Column**: Content tabs
  - Journal Entry tab for main content
  - Dream Diary tab with:
    - Dream title
    - Dream content (resizable text area)
    - Dream metrics
  - Smooth tab switching
  - Responsive design that adapts to window size

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Custom Journal Entry"
4. Install and enable the plugin

## Settings

- **Date Format**: Customize how dates appear in your entries
- **Target Note**: Specify where new entries will be added
- **Form State**: Control automatic saving of form state

## Support

If you encounter any issues or have suggestions:

1. Check the [GitHub Issues](https://github.com/yourusername/custom-journal-entry/issues)
2. Review the [Documentation](https://github.com/yourusername/custom-journal-entry/wiki)
3. Submit a new issue if needed

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

## License

MIT License - see LICENSE file for details 

## UI/UX Features

- Opens in the main workspace as a dedicated tab
- Modern tabbed interface for better organization
- Resizable columns for customizable workspace
- Responsive layout with plugin-specific styling
- Smooth transitions and consistent spacing
- Persistent form state and layout preferences
- Robust image handling with clear feedback
- Intuitive tab switching between journal and dream content 