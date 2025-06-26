# Custom Journal Entry Plugin Specification

## Overview
The Custom Journal Entry Plugin provides a structured way to create journal entries in Obsidian, with support for dream diary entries and image attachments. It features a modern tabbed interface and a responsive two-column layout.

## Features
- [x] Custom callout format: `[!journal-entry]`
- [x] Date-based entries
- [x] Word count tracking
- [x] Dream diary integration with automatic inclusion
- [x] Image attachment support with preview
- [x] Metrics for dream entries
- [x] Automatic entry placement
- [x] Form state persistence
- [x] Tabbed interface
- [x] Resizable columns

## Technical Details

### CSS Class Naming Convention
All CSS classes use the `cjep` prefix (Custom Journal Entry Plugin) for better maintainability and to avoid conflicts:
- Main container: `.cjep-container`
- Layout: `.cjep-main-flex`, `.cjep-resizable-col`
- Tabs: `.cjep-tabs`, `.cjep-tab`, `.cjep-tab-content`
- Form elements: `.cjep__form-group`, `.cjep__input`, `.cjep__textarea`
- Dream diary: `.cjep-dream-section`
- Metrics: `.cjep__metric-group`, `.cjep__metric-slider`
- Image handling: `.cjep__image-preview`, `.cjep__image-content`

### Layout Structure
```
cjep-container
├── cjep-top-section
│   ├── cjep-top-row
│   │   ├── Date Input
│   │   └── Restore Button (if available)
├── cjep-main-flex
│   ├── Left Column (Image)
│   │   ├── Image Search
│   │   ├── Image Preview
│   │   └── Clear Image Button
│   └── Right Column (Content)
│       ├── Tab Navigation
│       │   ├── Journal Entry Tab
│       │   └── Dream Diary Tab
│       └── Tab Content
│           ├── Journal Content
│           └── Dream Content
└── Button Container
```

### Entry Format
```markdown
> [!journal-entry] {date} [[Journals|John's Journal]] *Words: {totalWordCount}*
> ^{dateId}
> 
>> [!journal-page|right]
>> JOURNALPAGE
> 
{journalContent}
> 

[Dream diary section included only if content exists]
>> [!dream-diary] {dreamTitle} [[Journals/Dream Diary/Dream Diary#^{dateId}-{dreamTitle}|Dream Diary]]
>>
>>> [!journal-page|right]
>>> JOURNALPAGE
>>
{dreamContent}
>>
>>> [!dream-metrics|hide]
>>> Words: {dreamWordCount}, Sensory Detail: {sensory}, Emotional Recall: {emotional}, Lost Segments: {lost}, Descriptiveness: {descriptive}, Confidence Score: {confidence}
```

### Word Count Behavior
- Main word count displays the total words from both journal and dream diary sections when dream diary is enabled
- Dream diary section shows its own word count separately
- Word counts update in real-time as content is entered
- Final entry displays the total word count in the header

### Settings
- Date Format: Customizable date format for entries
- Target Note: Path to the note where entries will be added
- Form State: Automatic saving of form state for recovery

### UI Components

#### Main Layout
- Two-column responsive design
- Resizable columns with visible handles
- Tab-based content organization
- Persistent layout preferences

#### Left Column (Image)
- Image search with autocomplete
- Resizable preview area
- Clear image functionality
- Preview size persistence

#### Right Column (Content)
- Tab navigation
  - Journal Entry tab
  - Dream Diary tab
- Content areas
  - Full-width text areas
  - Resizable dream content
  - Metric sliders in dream tab

### Features Implementation

#### Tab System
- Smooth transitions between tabs
- Active state management
- Content preservation when switching
- Responsive behavior

#### Column Resizing
- Drag handles with visual feedback
- Minimum and maximum width constraints
- Size persistence
- Mobile-responsive behavior

#### Dream Diary Integration
- Automatic inclusion based on content
- No manual toggle required
- Full-width content area
- Preserved metrics system

#### Auto-Save
- Interval: 5 seconds
- Storage: Plugin data
- State restoration on view open
- Clear state after successful restoration

#### Image Handling
- Supported formats: PNG, JPG, JPEG, GIF
- Base64 encoding for preview
- Path storage for restoration
- Modal selection interface
- Image preview logic is robust and stable, with no risk of recursion or stack overflow. Preview is resizable and persists its size.

#### Word Counting
- Real-time updates
- Separate counts for journal and dream
- Whitespace handling
- Display in header

#### Dream Metrics
- Slider inputs (0-5)
- Real-time value display
- Hidden in final output
- Comprehensive tracking

### CSS Classes

All CSS classes are prefixed with `cjep__` to avoid conflicts:

```css
.cjep
.cjep__main-pane
.cjep__content
.cjep__form-group
.cjep__label
.cjep__input
.cjep__textarea
.cjep__word-count
.cjep__dream-toggle
.cjep__dream-section
.cjep__metric-group
.cjep__metric-label
.cjep__metric-slider
.cjep__metric-value
.cjep__button-container
.cjep__image-pane
.cjep__image-modal
.cjep__image-grid
.cjep__image-container
.cjep__preview-image
```

### Event Handling

#### Form Events
- Input changes for word counting
- Dream toggle for section visibility
- Metric slider updates
- Image selection
- Form submission

#### View Events
- Open: Initialize form, restore state
- Close: Save state, clear interval
- Unload: Final state save

### Error Handling

- Null checks for form elements
- Image file validation
- State restoration validation
- Graceful fallbacks for missing data

## Future Enhancements

### Planned Features
1. Custom folder settings
2. Template customization
3. Keyboard shortcuts
4. Batch processing
5. Export functionality
6. Statistics dashboard

### Potential Improvements
1. Rich text editing
2. Tag support
3. Custom metrics
4. Multiple image support
5. Cloud sync integration

## Performance Considerations

- Efficient state management
- Debounced auto-save
- Optimized image handling
- Minimal DOM updates
- Memory leak prevention

## Security

- No external API calls
- Local storage only
- Input sanitization
- Path validation
- Safe file handling 

## Technical Requirements

### Core Dependencies
- Obsidian API v1.0.0+
- TypeScript 4.9+
- Node.js 16+

### Plugin Structure
```
custom-journal-entry/
├── main.ts           # Main plugin code
├── styles.css        # Plugin-specific styles
├── manifest.json     # Plugin manifest
└── package.json      # Dependencies and scripts
```

## Implementation Details

### Journal Entry Format

```markdown
> [!journal-entry] [Date] [[Journals|John's Journal]] *Words: [count]*
> ^[dateId]
> 
>> [!journal-page|right]
>> JOURNALPAGE
> 
>> [Journal content with proper callout nesting]
> 
>> [!dream-diary] [Dream Title] [[Journals/Dream Diary/Dream Diary#^[dateId]-[dreamId]|Dream Diary]]
>>
>>> [!journal-page|right]
>>> JOURNALPAGE
>>
>> [Dream content with proper callout nesting]
>>
>>> [!dream-metrics|hide]
>>> Words: [count], Sensory Detail: [0-5], Emotional Recall: [0-5], Lost Segments: [0-5], Descriptiveness: [0-5], Confidence Score: [0-5]
```

### Data Structures

#### FormState Interface
```typescript
interface FormState {
    date: string;
    journalContent: string;
    includeDreamDiary: boolean;
    dreamTitle: string;
    dreamContent: string;
    metrics: {
        sensory: string;
        emotional: string;
        lost: string;
        descriptive: string;
        confidence: string;
    };
    selectedImage: string | null;
}
```

#### Settings Interface
```typescript
interface JournalEntrySettings {
    dateFormat: string;
}
```

### UI Components

#### Main View
- Two-pane layout
- Left pane: Form inputs
- Right pane: Image preview
- Responsive design with plugin-specific classes
- Image preview is robust, resizable, and persistent.

#### Form Elements
- Date picker (native HTML5)
- Journal content textarea
- Dream diary toggle
- Dream title input
- Dream content textarea
- Metric sliders (0-5 range)
- Image selection button
- Submit button

### Features Implementation

#### Auto-Save
- Interval: 5 seconds
- Storage: Plugin data
- State restoration on view open
- Clear state after successful restoration

#### Image Handling
- Supported formats: PNG, JPG, JPEG, GIF
- Base64 encoding for preview
- Path storage for restoration
- Modal selection interface
- Image preview logic is robust and stable, with no risk of recursion or stack overflow. Preview is resizable and persists its size.

#### Word Counting
- Real-time updates
- Separate counts for journal and dream
- Whitespace handling
- Display in header

#### Dream Metrics
- Slider inputs (0-5)
- Real-time value display
- Hidden in final output
- Comprehensive tracking

### CSS Classes

All CSS classes are prefixed with `cjep__` to avoid conflicts:

```css
.cjep
.cjep__main-pane
.cjep__content
.cjep__form-group
.cjep__label
.cjep__input
.cjep__textarea
.cjep__word-count
.cjep__dream-toggle
.cjep__dream-section
.cjep__metric-group
.cjep__metric-label
.cjep__metric-slider
.cjep__metric-value
.cjep__button-container
.cjep__image-pane
.cjep__image-modal
.cjep__image-grid
.cjep__image-container
.cjep__preview-image
```

### Event Handling

#### Form Events
- Input changes for word counting
- Dream toggle for section visibility
- Metric slider updates
- Image selection
- Form submission

#### View Events
- Open: Initialize form, restore state
- Close: Save state, clear interval
- Unload: Final state save

### Error Handling

- Null checks for form elements
- Image file validation
- State restoration validation
- Graceful fallbacks for missing data

## Future Enhancements

### Planned Features
1. Custom folder settings
2. Template customization
3. Keyboard shortcuts
4. Batch processing
5. Export functionality
6. Statistics dashboard

### Potential Improvements
1. Rich text editing
2. Tag support
3. Custom metrics
4. Multiple image support
5. Cloud sync integration

## Performance Considerations

- Efficient state management
- Debounced auto-save
- Optimized image handling
- Minimal DOM updates
- Memory leak prevention

## Security

- No external API calls
- Local storage only
- Input sanitization
- Path validation
- Safe file handling 