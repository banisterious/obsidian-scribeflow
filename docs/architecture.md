# Journal Plugin Architecture

This document outlines the modular architecture for the overhauled Journal plugin. The primary goal of this architecture is to ensure a clean separation of concerns, making the codebase more maintainable, scalable, and easier to debug.

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
    *   **`JournalEntryModal.ts`**: The core of the new UI. This class creates the main modal window and implements the two-pane layout with the vertical navigation tabs. It manages the lifecycle of the tabs.
    *   **`tabs/`**: Each file in this subdirectory represents a single vertical tab in the modal, ensuring the UI is modular and easy to expand.
        *   **`JournalEntryTab.ts`**: Will contain the primary form for writing a journal entry, including the horizontal tabs for template selection.
        *   **`JournalSettingsTab.ts`**: Will contain the in-modal settings for fine-tuning entry creation on the fly.

*   **`styles.css`**: All CSS rules are now located in this file, completely separate from the TypeScript code. It contains styling for the modal, tabs, and all other UI elements.

## Data Flow

1.  The user triggers the `Create Journal Entry` command.
2.  `main.ts` instantiates and opens the `JournalEntryModal`.
3.  `JournalEntryModal` creates the main layout and initializes the active tab (`JournalEntryTab`).
4.  The user fills out the form. The state is periodically saved as a draft by the `draft-manager.ts`.
5.  When the user clicks "Create Entry", the modal gathers the final `FormState`.
6.  The state is passed to the `entry-writer.ts` module.
7.  `entry-writer.ts` generates the appropriate Markdown string based on the selected template.
8.  The Markdown is inserted into the active note at the cursor position or appended to the journal file.
9.  The draft is cleared by `draft-manager.ts`.
