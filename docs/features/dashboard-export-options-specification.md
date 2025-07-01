### **ScribeFlow Plugin: Export Options Feature Specification**

- **Document Version:** 1.0
- **Date:** July 1, 2025
- **Author:** John Banister
- **Project:** ScribeFlow Plugin for Obsidian
- **Feature:** Export Options (Scribe Dashboard Data & Individual Entries)

#### **1. High-Level Overview**

This document details the export functionalities for the ScribeFlow plugin, specifically within the Scribe Dashboard. It will allow users to:
1.  Export the aggregated data displayed in the Scribe Dashboard's main table.
2.  Export the full content of individual or multiple selected journal entries.

The primary goal is to enhance data portability, enabling users to analyze their journaling habits externally, archive specific entries, or share content outside of the Obsidian environment.

#### **2. Scope**

**In Scope:**
* Implementation of export functionalities for both the Scribe Dashboard's filtered table data and for selected individual journal entries.
* Support for the specified export formats (Markdown Table, CSV, JSON for dashboard data; Markdown, Plain Text, PDF for individual entries).
* User interface elements for triggering exports (buttons, context menus).
* Proper handling of data formatting for each export type.

**Out of Scope (for Version 1.0):**
* Batch export of *all* journal entries in the vault (only filtered dashboard data or selected individual entries).
* Advanced report generation with custom layouts beyond direct data dumps.
* Integration with external APIs for direct upload to other services.

#### **3. Feature 1: Scribe Dashboard Data Export**

**3.1. Purpose:**
To allow users to export the aggregated journaling data presented in the Scribe Dashboard's main table, including summary statistics, for external analysis or record-keeping.

**3.2. User Interface (UI) & Access:**
* A prominent "Export" button will be located on the Scribe Dashboard interface, preferably near the time filter controls.
* Clicking the "Export" button will reveal a dropdown menu listing the available export formats.

**3.3. Export Formats & Content:**

* **A. Markdown Table (.md)**
    * **Content:** The data from the Scribe Dashboard's main table (Date, Journal Entry (First X Words), Words, Images, Filename), formatted as a standard Markdown table. The "First X Words" will be truncated as displayed.
    * **Destination:** Copied to clipboard, allowing direct pasting into any Obsidian note or Markdown file.

* **B. CSV (Comma Separated Values) (.csv)**
    * **Content:** The raw data from the Scribe Dashboard's main table (Date, Journal Entry (First X Words), Words, Images, Filename). Each field will be properly quoted to handle commas or special characters.
    * **Destination:** Saved as a `.csv` file via a standard "Save As..." dialog.

* **C. JSON (JavaScript Object Notation) (.json)**
    * **Content:** An array of JSON objects, where each object represents a row from the Scribe Dashboard's main table. Keys will correspond to column headers.
    * **Example Structure:** `[{"Date": "2025-06-30", "JournalEntryPreview": "Lorem ipsum...", "Words": 420, "Images": 2, "Filename": "June 30 Journal.md"}, ...]`
    * **Destination:** Saved as a `.json` file via a standard "Save As..." dialog.

**3.4. Summary Statistics Inclusion:**
* The summary statistics displayed in the "Statistics Cards" (Total Entries, Total Words, Average Words per Entry, Consistency metrics, etc.) will be included as a separate section in the JSON export, or a commented section in the Markdown table export, or optionally presented as a separate small data file (e.g., `summary_stats.json`) if saved alongside the main data.

#### **4. Feature 2: Individual Journal Entry Export**

**4.1. Purpose:**
To allow users to export the full content of one or more specific journal entries directly from the Scribe Dashboard table view.

**4.2. User Interface (UI) & Access:**
* **Right-Click Context Menu:** When a user right-clicks on any row in the main Scribe Dashboard table, a context menu will appear with an "Export Entry" option, and a sub-menu for export formats.
* **Multi-Selection (Optional, for future refinement):** If multiple rows are selected (e.g., via checkboxes), the right-click menu could offer "Export Selected Entries," or a dedicated "Export Selected" button could appear at the top/bottom of the table.

**4.3. Export Formats & Content:**

* **A. Markdown (.md)**
    * **Content:** The entire raw Markdown content of the selected journal entry's `.md` file, including all callouts (journal content, dream diary, etc.), links, and embedded images.
    * **Destination:** Saved as a `.md` file via a standard "Save As..." dialog. For multiple entries, each will be a separate `.md` file.

* **B. Plain Text (.txt)**
    * **Content:** The raw text content of the selected journal entry, stripped of all Markdown formatting (e.g., `## Heading`, `*italic*`, `[[link]]`, callout syntax, image links will be removed or replaced with a placeholder like `[Image: filename.png]`).
    * **Destination:** Saved as a `.txt` file via a standard "Save As..." dialog. For multiple entries, each will be a separate `.txt` file.

* **C. PDF (.pdf)**
    * **Content:** A rendered, non-editable PDF document of the selected journal entry. The rendering should strive to match Obsidian's reading view as closely as possible, preserving formatting, images, and links (if the PDF viewer supports them).
    * **Destination:** Saved as a `.pdf` file via a standard "Save As..." dialog. For multiple entries, each will be a separate `.pdf` file.
    * **Technical Note:** PDF export will likely require a robust markdown rendering engine or leveraging Obsidian's internal PDF export capabilities if exposed via API.

#### **5. General Technical Considerations**

* **Performance:** All export operations, especially for large datasets or multiple individual entries, must be optimized to prevent UI freezing. Asynchronous processing should be utilized where possible.
* **File Handling:** Securely read file contents and write to user-specified locations, respecting Obsidian's environment.
* **Error Handling:** Provide clear feedback to the user if an export fails (e.g., file not found, permission denied, conversion error).
* **API Utilization:** Leverage Obsidian's Plugin API for file system access, clipboard operations, and UI elements.

#### **6. Future Enhancements (Roadmap)**

* **Batch Export all filtered entries into a single merged document/archive.**
* **Customizable Delimiters/Quoting for CSV.**
* **User-defined templates for Plain Text/PDF exports.**
* **In-plugin notification for export completion.**
