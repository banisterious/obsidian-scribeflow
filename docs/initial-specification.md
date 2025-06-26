# Custom Journal Entry Plugin for Obsidian

## Overview
An Obsidian plugin for creating structured journal entries with dream diary tracking and metrics. Designed to replace the previous QuickAdd-based solution with a more robust, feature-rich implementation.

## Core Features

### Journal Entry ✓
- [x] Custom callout format: `[!journal-entry]`
- [x] Date selection with native date picker
- [x] Word count tracking (displayed in header)
- [x] Proper callout nesting and formatting
- [x] Unique date-based ID system for referencing
- [ ] Image attachment placeholders
- [ ] Links to journal index

### Dream Diary ✓
- [x] Optional section with toggle control
- [x] Smooth fade/slide transition when showing/hiding
- [x] Custom callout format: `[!dream-diary]`
- [x] Title and content input
- [x] Title-based link generation (e.g., `#^20250508-some-dream`)
- [x] Word count tracking
- [x] Comprehensive metrics tracking (0-5 scale):
  - [x] Sensory Detail
  - [x] Emotional Recall
  - [x] Lost Segments
  - [x] Descriptiveness
  - [x] Confidence Score
- [ ] Image attachment placeholders
- [ ] Links to dream diary index

## Technical Requirements

### Dependencies ✓
- [x] Obsidian API
- [x] TypeScript
- [x] Node.js development environment

### Development Environment ✓
- [x] Node.js
- [x] npm
- [x] TypeScript compiler
- [x] Obsidian Plugin Developer Tools

## Template Format A ✓
```markdown
> [!journal-entry] {date} [[Journals|John's Journal]] *Words: {wordCount}*
> ^{dateBlockID}
> 
>> [!journal-page|right]
>> [[image.png|400]
> 
> Journal content here
> 
>> [!dream-diary] {dreamTitle} [[Journals/Dream Diary/Dream Diary#^{dateId}-{dreamTitle}|Dream Diary]]
>>
>>> [!journal-page|right]
>>> [[image2.png|400]
>>
>> Dream content here
>>
>>> [!dream-metrics]
>>> Words: {dreamWordCount}, Sensory Detail: {sensory}, Emotional Recall: {emotional}, Lost Segments: {lost}, Descriptiveness: {descriptive}, Confidence Score: {confidence}
```

## Template Format B ✓
```markdown
> [!journal-entry] {date} [[Journals|John's Journal]] *Words: {wordCount}*
> ^{dateBlockID}
> 
> ### {time}
> 
>> [!dream-diary] {dreamTitle} [[Journals/Dream Diary/Dream Diary#^{dateId}-{dreamTitle}|Dream Diary]]
>>
>>> [!journal-page|right]
>>> [[image2.png|400]
>>
>> Dream content here
>>
>>> [!dream-metrics]
>>> Words: {dreamWordCount}, Sensory Detail: {sensory}, Emotional Recall: {emotional}, Lost Segments: {lost}, Descriptiveness: {descriptive}, Confidence Score: {confidence}
```

## Plugin Components

### Main Plugin Class ✓
- [x] Plugin initialization
- [x] Command registration
- [x] Settings management
- [x] Event listeners

### UI Components ✓
1. Journal Entry Modal
   - [x] Date picker
   - [x] Large content editor
   - [x] Real-time word count display
   - [x] Dream diary toggle
   - [x] Smooth transitions for dream section

2. Dream Entry Modal
   - [x] Title input
   - [x] Large content editor
   - [x] Real-time word count display
   - [x] Metrics input sliders (0-5 scale)
   - [x] Visual feedback for metric values

### Settings
- [x] Date format preferences
- [ ] Template customization
- [ ] Image attachment handling
- [ ] Link generation options

## Development Phases

### Phase 1: Basic Implementation ✓
- [x] Project setup with TypeScript
- [x] Basic plugin structure
- [x] Command registration
- [x] Simple modal implementation

### Phase 2: Core Features ✓
- [x] Journal entry creation
- [x] Dream diary integration
- [x] Metrics tracking
- [x] Word counting
- [x] UI transitions

### Phase 3: Enhanced Features
- [x] Settings panel (basic)
- [ ] Template customization
- [ ] Image attachment handling
- [ ] Link generation

### Phase 4: Polish
- [x] UI/UX improvements
- [x] Error handling
- [x] Performance optimization
- [ ] Documentation

## Current Status
- Basic plugin structure implemented ✓
- Journal entry creation with word counting ✓
- Dream diary section with toggle and transitions ✓
- Metrics system with 0-5 scale sliders ✓
- Real-time word count updates ✓
- Proper callout nesting and formatting ✓
- Title-based link generation ✓

## Next Steps
- Implement image attachment handling
- Add template customization options
- Add link generation to indexes
- Complete documentation

Previous Implementation (QuickAdd-based):
✓ Basic template structure
✓ Dream metrics system
✓ Word counting
✗ Encountered API limitations
✗ Reliability issues

New Implementation (Plugin-based):
1. Current Status:
   - Specification created
   - Development phases defined
   - Template format finalized

2. Next Steps:
   - Set up TypeScript development environment
   - Create basic plugin structure
   - Implement core modal functionality

3. Key Improvements:
   - Native Obsidian API integration
   - Custom UI components
   - Better date handling
   - Improved reliability

Location: C:\Dev\Obsidian\CustomJournalEntry 

### Image Handling
- Image preview is robust, resizable, persistent, and protected against recursion/stack overflow.

### UI/UX
- Image preview is robust, resizable, persistent, and protected against recursion/stack overflow. 