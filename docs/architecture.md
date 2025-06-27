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
│   │   └── entry-writer.ts
│   ├── ui/
│   │   ├── tabs/
│   │   │   ├── JournalEntryTab.ts
│   │   │   └── JournalSettingsTab.ts
│   │   └── JournalEntryModal.ts
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

*   **`src/ui/`**: This directory contains all the code related to the user interface.
    *   **`JournalEntryModal.ts`**: The core of the new UI. This class creates the main modal window with Material Design styling, implements the two-pane layout with vertical navigation tabs, and manages action buttons in the header region. It handles the lifecycle of the tabs and passes button references to active tabs.
    *   **`tabs/`**: Each file in this subdirectory represents a single vertical tab in the modal, ensuring the UI is modular and easy to expand.
        *   **`JournalEntryTab.ts`**: Contains the primary form for writing a journal entry with modern Material Design elements including horizontal date/time fields, side-by-side content/preview sections with resizable image previews, and interactive grid-based metrics with visual sliders. Handles image selection from vault files and real-time preview updates.
        *   **`JournalSettingsTab.ts`**: Contains the in-modal settings for fine-tuning entry creation on the fly.

*   **`styles.css`**: All CSS rules are now located in this file, completely separate from the TypeScript code. It contains comprehensive Material Design styling for the modal, tabs, form elements, interactive components, and responsive layouts. The styling uses Obsidian's CSS custom properties for theme compatibility.

## Data Flow

1.  The user triggers the `Create Journal Entry` command.
2.  `main.ts` instantiates and opens the `JournalEntryModal`.
3.  `JournalEntryModal` creates the main layout with header containing title and action buttons, initializes the active tab (`JournalEntryTab`), and passes button references to the tab.
4.  The user interacts with the modern form interface including date/time inputs, content areas with resizable image preview containers (supporting click-to-select from vault files with width controls), and interactive metric sliders. The state is periodically saved as a draft by the `draft-manager.ts`.
5.  When the user clicks "Insert Entry" (now located in the header), the modal gathers the final `FormState`.
6.  The state is passed to the `entry-writer.ts` module.
7.  `entry-writer.ts` generates the appropriate Markdown string based on the selected template.
8.  The Markdown is inserted into the active note at the cursor position or appended to the journal file.
9.  The draft is cleared by `draft-manager.ts`.

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

## Example callout structure

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