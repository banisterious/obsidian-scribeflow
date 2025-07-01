### **ScribeFlow Plugin: Scribe Dashboard Feature Specification**

**Document Version:** 1.1
**Date:** June 30, 2025
**Author:** John Banister
**Project:** ScribeFlow Plugin for Obsidian
**Feature:** Scribe Dashboard

#### **1. High-Level Overview**

The Scribe Dashboard is a new feature for the ScribeFlow plugin designed to provide users with a dynamic, data-driven overview of their journaling habits. It will present key metrics from journal entries in a sortable, tabular format, allowing users to track consistency, volume, and trends in their writing over time. This feature focuses on the *act of journaling* rather than the content of dreams, distinguishing it from the OneiroMetrics plugin.

#### **2. Scope**

**In Scope:**
* A user-invoked command to open a new view/modal displaying the Scribe Dashboard table.
* Parsing of all markdown files within the user-defined Journal folder(s) to find ScribeFlow journal entry callouts.
* Extraction of specific metrics from each identified journal entry.
* Display of a scrollable, sortable table with columns for each metric.
* A mechanism to limit the displayed content in the **"First X Words"** column to a user-configurable number of words (default: 50).

**Out of Scope (for Version 1.0):**
* Graphing or visualization of data (e.g., bar charts, line graphs).
* Automatic, periodic updates of the dashboard (requires a manual refresh).
* Filtering entries by tags or other metadata beyond the callout structure.

#### **3. User Interface (UI) & Interaction**

**3.1. Access:**
* A new command will be added: `ScribeFlow: Open Scribe Dashboard`.
* Executing this command will open a new, resizable modal or a dedicated view pane within Obsidian.

**3.2. Table Structure:**
The dashboard will be presented as a table with the following columns:

| Column Header | Data Type | Sortable | Description |
| :--- | :--- | :--- | :--- |
| **Date** | `Date` | Yes | The date of the journal entry, extracted from the callout header. |
| **Title** | `String` | Yes | The title of the journal entry (e.g., from the file name). |
| **First 50 Words** | `String` | No | A preview of the first 50 words of the journal content. |
| **Word Count** | `Integer` | Yes | The total word count of the journal content. |
| **Image Count** | `Integer` | Yes | The number of images linked within the entry. |
| **File** | `Link` | Yes | A clickable link to the journal entry markdown file. |

**3.3. User Interaction:**
* **Sorting:** Clicking on the sortable column headers will sort the table data in ascending or descending order.
* **Clicking on a Row:** Clicking on the `File` link will navigate the user to that specific journal entry.

#### **4. Data Extraction & Logic**

The plugin will scan the designated Journal folder(s) for markdown files containing the `> [!journal-entry]` callout. For each entry found, the following data points must be extracted from the **main journal entry content** based on the provided nested callout structure:

`> [!journal-entry] {date} [[Journals|John's Journal]] *Words: {wordCount}*`
`> ^{dateBlockID}`
`>`
`>> [!journal-page|right]`
`>> [[image.png|400]`
`>`
`> Journal content here`
`>`
`>> [!dream-diary] {dreamTitle} [[Journals/Dream Diary/Dream Diary#^{dateId}-{dreamTitle}|Dream Diary]]`
`>>`
`>>> [!journal-page|right]`
`>>> [[image2.png|400]`
`>>`
`>> Dream content here`
`>>`
`>>> [!dream-metrics]`
`>>> Words: {dreamWordCount}, Sensory Detail: {sensory}, Emotional Recall: {emotional}, Lost Segments: {lost}, Descriptiveness: {descriptive}, Confidence Score: {confidence}`

**4.1. Metric Calculation:**

* **Date:** Extracted directly from the `> [!journal-entry] {date} ...` line.
* **Title:** The title can be derived from the file name of the journal entry note.
* **Word Count:** Calculated by counting the words within the `Journal content here` block, which is the text between the `> ^{dateBlockID}` line and the `>> [!dream-diary]` callout. **Crucially, the parser must ignore the `[!dream-diary]` callout and all its nested content when calculating this metric.**
* **Image Count:** Count the number of markdown image links `![[image.png]]` or `![[image.png|400]]` within the entire `> [!journal-entry]` callout block.
* **First 50 Words:** Extract the first 50 words from the `Journal content here` block, excluding any content from the dream diary section.

**4.2. Parsing Logic:**

The code should parse the note line-by-line or use a regex to identify the main `[!journal-entry]` callout. It then needs to isolate the `Journal content here` section to calculate the word count and extract the preview text. A key part of the logic is to ensure the parser recognizes the start of the `[!dream-diary]` callout and stops counting words or extracting preview text from that point onward, effectively separating the two content blocks.

#### **5. Technical Considerations**

* **Performance:** For large vaults with many journal entries, parsing all files can be slow. The implementation should be optimized to use Obsidian's caching mechanisms if available or to parse files asynchronously.
* **Configuration:** The user should be able to specify the folder(s) where journal entries are located in the plugin's settings.
* **Dependency:** This feature relies on the user's journal entries strictly adhering to the nested callout structure defined by the ScribeFlow plugin.

#### **6. Future Enhancements (Roadmap)**

* **Filtering:** Add filtering options (e.g., by date range, word count range).
* **Global Metrics:** Display overall stats at the top of the dashboard, such as **"Total Entries,"** **"Average Word Count per Entry,"** and **"Longest Journaling Streak."**
* **Search Bar:** Implement a search bar to filter entries by title or content preview.
* **Export:** Add an option to export the table data to a CSV or Markdown table.