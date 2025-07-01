### **ScribeFlow Plugin: Scribe Dashboard - Statistics Cards Feature Specification**

**Document Version:** 1.0
**Date:** July 1, 2025
**Author:** AI Assistant / [Your Name]
**Project:** ScribeFlow Plugin for Obsidian
**Feature:** Scribe Dashboard - Statistics Cards

#### **1. High-Level Overview**

This document specifies the "Statistics Cards" component of the Scribe Dashboard. This feature will display key aggregated journaling metrics in a set of visually distinct cards or blocks at the top of the Scribe Dashboard view, above the main journal entry table. These statistics will dynamically update based on the currently active time filter (e.g., "All Time", "This Month", "This Week", "Last 7 Days").

The goal is to provide users with an at-a-glance summary of their journaling habits, focusing on consistency, volume, and content engagement, complementing the detailed entry-level data in the main table.

#### **2. Scope**

**In Scope:**
* Implementation of a dedicated section at the top of the Scribe Dashboard view for displaying summary statistics.
* Organization of statistics into logical groupings (e.g., "Overall Progress," "Consistency," "Content Insights").
* Calculation and display of the specified metrics, dynamically updating based on the selected time filter in the main Scribe Dashboard.
* Basic styling for each "card" to visually separate and highlight the statistics.

**Out of Scope (for Version 1.0):**
* Any form of visualization (e.g., mini-charts within cards).
* User customization of which statistics appear or their order.
* Advanced analytics beyond simple aggregations (e.g., trend analysis, forecasting).

#### **3. User Interface (UI) & Interaction**

**3.1. Placement:**
The Statistics Cards will occupy the top portion of the Scribe Dashboard view, directly below the time filter control and above the main journal entries table.

**3.2. Layout:**
Statistics will be displayed in individual "cards" or "blocks," grouped logically. The layout should be responsive, allowing cards to wrap or stack on smaller viewports while maintaining a clean, scannable layout on larger screens. Each card will typically display a label and its corresponding numerical or percentage value.

**3.3. Dynamic Updates:**
All displayed statistics will automatically update when the user changes the time filter applied to the Scribe Dashboard (e.g., switching from "All Time" to "This Month").

**3.4. Proposed Card Groupings & Statistics:**

**Group 1: Overall Progress / Summary**
* **Total Entries:** The total number of journal entries found *within the currently selected time filter*.
* **Total Words:** The sum of word counts from all journal entries *within the currently selected time filter*.
* **Average Words per Entry:** `Total Words / Total Entries` *within the currently selected time filter*.

**Group 2: Consistency**
* **Current Journaling Streak:** The number of consecutive days with at least one journal entry, active as of the latest entry *within the selected time filter*. This streak should reset if a day within the filtered period is missed.
* **Longest Journaling Streak:** The maximum number of consecutive days with entries *recorded at any point within the selected time filter*.
* **Days Journaled:** The count of unique days (within the selected time filter's duration) on which at least one journal entry was created.
* **Journaling Frequency (%):** Calculated as `(Days Journaled / Total Days in Period) * 100%` *within the selected time filter's duration*. For instance, if "This Month" is selected and it's the 15th day of a 30-day month, and 10 days have entries, it would be `(10 / 15) * 100%`.

**Group 3: Content Insights**
* **Median Word Count:** The median word count of all journal entries *within the currently selected time filter*.
* **Entries with Images (%):** `(Count of entries with ≥1 image / Total Entries) * 100%` *within the currently selected time filter*.
* **Entries with Dream Diary (%):** `(Count of entries with a dream diary section / Total Entries) * 100%` *within the currently selected time filter*.

**Group 4: Pattern Recognition**
* **Most Active Day of Week:** The day of the week (e.g., Monday, Tuesday) that has the highest number of journal entries *within the currently selected time filter*.

#### **4. Data Logic & Calculation**

All calculations for the statistics cards must adhere to the data filtering applied by the main Scribe Dashboard's time filter. The parsing and data extraction logic will reuse the methods defined in the primary Scribe Dashboard specification (Doc Version 1.1), specifically ensuring that dream diary content and metrics are *excluded* from general journal entry calculations (e.g., `Word Count`).

**4.1. Core Data Source:**
The calculations will be performed on the same dataset of parsed journal entries that populates the main table, filtered by the active time period.

**4.2. Specific Calculation Notes:**

* **Streaks:** Requires iterating through daily entries within the filtered period, identifying gaps.
* **Percentages:** Calculated based on the `Total Entries` or `Total Days in Period` *after* applying the time filter.
* **Median Word Count:** Requires collecting all word counts for the filtered entries, sorting them, and finding the middle value.
* **Most Active Day of Week:** Requires counting entries per day of the week (e.g., Monday, Tuesday...) within the filtered set and identifying the day with the highest count.

#### **5. Technical Considerations**

* **Performance:** Calculations for these statistics must be