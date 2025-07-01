# Dashboard Statistics Cards - Implementation Document

- **Document Version:** 1.0  
- **Date:** July 1, 2025  
- **Project:** ScribeFlow Plugin for Obsidian  
- **Feature:** Dashboard Statistics Cards Implementation  

## 1. Implementation Overview

This document outlines the technical implementation approach for adding statistics cards to the Scribe Dashboard, based on the requirements specified in `scribe-dashboard-statistics-cards-specs.md`.

## 2. Architecture Integration

### 2.1 Existing Components Integration
- **DashboardView.ts**: Extend to include statistics cards section
- **DashboardParser.ts**: Reuse existing parsing logic for calculations
- **dashboard.ts**: Extend state interface to include statistics data
- **styles.css**: Add statistics cards styling

### 2.2 Data Flow
```
Parsed Entries → Time Filter → Search Filter → Statistics Calculator → Statistics Cards UI
```

### 2.3 Dashboard Layout Structure
**Revised Layout Order:**
1. **Dashboard Header** (title, subtitle, collapse/refresh controls)
2. **Statistics Cards** (with layout toggle button)
3. **Filter Controls** (date filter, search) - positioned directly above table
4. **Main Journal Entries Table**

This positioning places the statistics cards as a high-level overview section, while keeping the filter controls closely associated with the table content they directly affect.

## 3. Technical Implementation Plan

### 3.1 Data Structure Extensions

**src/types/dashboard.ts**
```typescript
interface DashboardStatistics {
  // Group 1: Overall Progress / Summary
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  
  // Group 2: Consistency
  currentJournalingStreak: number;
  longestJournalingStreak: number;
  daysJournaled: number;
  journalingFrequencyPercent: number;
  
  // Group 3: Content Insights
  medianWordCount: number;
  entriesWithImagesPercent: number;
  entriesWithDreamDiaryPercent: number;
  
  // Group 4: Pattern Recognition
  mostActiveDayOfWeek: string;
  
  // Supporting data for calculations
  totalDaysInPeriod: number;
}

interface DashboardState {
  // existing properties...
  statistics: DashboardStatistics;
  statisticsGroupedView: boolean; // Toggle between grouped and flat grid layout
}

// Add to plugin settings
interface DashboardSettings {
  // existing properties...
  statisticsGroupedView: boolean; // User preference for statistics layout (default: false)
}
```

### 3.2 Statistics Calculation Service

**src/services/DashboardStatisticsCalculator.ts** (new file)
```typescript
export class DashboardStatisticsCalculator {
  static calculateStatistics(
    entries: DashboardEntry[], 
    dateFilter: DateFilter,
    searchQuery?: string
  ): DashboardStatistics;
  
  // Group 1: Overall Progress / Summary
  private static calculateTotalEntries(entries: DashboardEntry[]): number;
  private static calculateTotalWords(entries: DashboardEntry[]): number;
  private static calculateAverageWordsPerEntry(totalWords: number, totalEntries: number): number;
  
  // Group 2: Consistency
  private static calculateCurrentJournalingStreak(entries: DashboardEntry[], dateFilter: DateFilter): number;
  private static calculateLongestJournalingStreak(entries: DashboardEntry[]): number;
  private static calculateDaysJournaled(entries: DashboardEntry[]): number;
  private static calculateJournalingFrequency(daysJournaled: number, totalDaysInPeriod: number): number;
  
  // Group 3: Content Insights
  private static calculateMedianWordCount(entries: DashboardEntry[]): number;
  private static calculateEntriesWithImagesPercent(entries: DashboardEntry[]): number;
  private static calculateEntriesWithDreamDiaryPercent(entries: DashboardEntry[]): number;
  
  // Group 4: Pattern Recognition
  private static calculateMostActiveDayOfWeek(entries: DashboardEntry[]): string;
  
  // Helper methods
  private static getTotalDaysInPeriod(dateFilter: DateFilter, entries: DashboardEntry[]): number;
  private static countEntriesWithImages(entries: DashboardEntry[]): number;
  private static countEntriesWithDreamDiary(entries: DashboardEntry[]): number;
  private static getUniqueDates(entries: DashboardEntry[]): string[];
  private static sortWordCounts(entries: DashboardEntry[]): number[];
}
```

### 3.3 UI Components

**Statistics Cards Rendering in DashboardView.ts**
```typescript
private renderStatisticsCards(): HTMLElement {
  const container = this.containerEl.createDiv('sfp-dashboard-statistics-container');
  
  // Render layout toggle and statistics cards
  this.renderStatisticsHeader(container);
  
  if (this.state.statisticsGroupedView) {
    // Layout A: Grouped with Headers
    this.renderGroupedStatistics(container);
  } else {
    // Layout B: Flat Grid (default)
    this.renderFlatGridStatistics(container);
  }
  
  return container;
}

private renderStatisticsHeader(container: HTMLElement): void {
  const header = container.createDiv('sfp-dashboard-statistics-header');
  
  // Layout toggle button
  const toggleButton = header.createEl('button', {
    cls: 'sfp-dashboard-statistics-toggle',
    text: 'Group by Category'
  });
  
  toggleButton.setAttribute('aria-pressed', this.state.statisticsGroupedView.toString());
  toggleButton.addEventListener('click', () => this.toggleStatisticsLayout());
}

private toggleStatisticsLayout(): void {
  this.state.statisticsGroupedView = !this.state.statisticsGroupedView;
  
  // Save preference to settings
  this.plugin.settings.dashboardSettings.statisticsGroupedView = this.state.statisticsGroupedView;
  this.plugin.saveSettings();
  
  // Re-render statistics section
  this.refreshStatisticsCards();
}

private renderGroupedStatistics(container: HTMLElement): void {
  // Group 1: Overall Progress / Summary
  this.renderStatisticsGroup(container, 'Overall Progress', [
    {label: 'Total Entries', value: this.state.statistics.totalEntries},
    {label: 'Total Words', value: this.state.statistics.totalWords.toLocaleString()},
    {label: 'Avg Words/Entry', value: Math.round(this.state.statistics.averageWordsPerEntry)}
  ]);
  
  // Group 2: Consistency
  this.renderStatisticsGroup(container, 'Consistency', [
    {label: 'Current Streak', value: this.state.statistics.currentJournalingStreak, suffix: 'days'},
    {label: 'Longest Streak', value: this.state.statistics.longestJournalingStreak, suffix: 'days'},
    {label: 'Days Journaled', value: this.state.statistics.daysJournaled},
    {label: 'Frequency', value: this.state.statistics.journalingFrequencyPercent.toFixed(1), suffix: '%'}
  ]);
  
  // Group 3: Content Insights
  this.renderStatisticsGroup(container, 'Content Insights', [
    {label: 'Median Words', value: this.state.statistics.medianWordCount},
    {label: 'With Images', value: this.state.statistics.entriesWithImagesPercent.toFixed(1), suffix: '%'},
    {label: 'With Dreams', value: this.state.statistics.entriesWithDreamDiaryPercent.toFixed(1), suffix: '%'}
  ]);
  
  // Group 4: Pattern Recognition
  this.renderStatisticsGroup(container, 'Patterns', [
    {label: 'Most Active Day', value: this.state.statistics.mostActiveDayOfWeek}
  ]);
}

private renderFlatGridStatistics(container: HTMLElement): void {
  const gridContainer = container.createDiv('sfp-dashboard-statistics-grid');
  this.getAllStatistics().forEach(stat => {
    this.renderStatCard(gridContainer, stat.label, stat.value, stat.suffix, stat.category);
  });
}

private renderStatisticsGroup(container: HTMLElement, title: string, stats: StatCard[]): void;
private renderStatCard(container: HTMLElement, label: string, value: string | number, suffix?: string, category?: string): HTMLElement;
private getAllStatistics(): StatCard[];
private refreshStatisticsCards(): void;
```

## 4. Calculation Logic Details

### 4.1 Time Period Calculation
```typescript
private static getTotalDaysInPeriod(filter: DateFilter): number {
  const now = new Date();
  
  switch (filter) {
    case 'today': return 1;
    case 'week': return 7;
    case 'month': return now.getDate(); // Days elapsed in current month
    case 'last30': return 30;
    case 'year': return Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
    case 'all': return this.calculateDaysBetween(firstEntryDate, now);
  }
}
```

### 4.2 Streak Calculation Algorithm
```typescript
private static calculateCurrentJournalingStreak(entries: DashboardEntry[], dateFilter: DateFilter): number {
  // Current streak calculation within filtered period
  // Resets if a day within the filtered period is missed
  const uniqueDates = this.getUniqueDates(entries).sort();
  if (uniqueDates.length === 0) return 0;
  
  let currentStreak = 0;
  const today = new Date();
  let checkDate = new Date(today);
  
  // Work backwards from today to find consecutive days
  while (checkDate >= new Date(uniqueDates[0])) {
    const dateKey = checkDate.toISOString().split('T')[0];
    if (uniqueDates.includes(dateKey)) {
      currentStreak++;
    } else {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return currentStreak;
}

private static calculateLongestJournalingStreak(entries: DashboardEntry[]): number {
  // Maximum consecutive days within the filtered time period
  const uniqueDates = this.getUniqueDates(entries).sort();
  if (uniqueDates.length === 0) return 0;
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
}
```

### 4.3 Dream Diary Detection
```typescript
private static countEntriesWithDreamDiary(entries: DashboardEntry[]): number {
  return entries.filter(entry => 
    entry.content.includes('[!dream-diary]') || 
    entry.rawContent?.includes('[!dream-diary]')
  ).length;
}
```

## 5. UI Layout Options

### 5.1 Option A: Grouped Cards with Headers
- Visual separation between statistic groups
- Clear categorization with group titles
- More vertical space required

### 5.2 Option B: Flat Grid Layout
- Compact, uniform card layout
- Better space efficiency
- Relies on card ordering for logical grouping

## 6. CSS Styling Structure

```css
.sfp-dashboard-statistics-container {
  /* Main container styling */
}

.sfp-dashboard-statistics-header {
  /* Header with toggle button */
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.sfp-dashboard-statistics-toggle {
  /* Layout toggle button styling */
  padding: 6px 12px;
  background-color: var(--interactive-normal);
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  color: var(--text-normal);
  font-size: 12px;
  cursor: pointer;
}

.sfp-dashboard-statistics-toggle[aria-pressed="true"] {
  /* Active state for toggle button */
  background-color: var(--interactive-accent);
  color: var(--text-on-accent);
}

/* Grouped Layout Styles */
.sfp-dashboard-statistics-group {
  /* Group container */
  margin-bottom: 20px;
}

.sfp-dashboard-statistics-group-title {
  /* Group header styling */
  font-size: 14px;
  font-weight: 600;
  color: var(--text-accent);
  margin-bottom: 8px;
  border-bottom: 1px solid var(--background-modifier-border);
  padding-bottom: 4px;
}

/* Flat Grid Layout Styles */
.sfp-dashboard-statistics-grid {
  /* Card grid layout */
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

/* Common Card Styles */
.sfp-dashboard-stat-card {
  /* Individual card styling */
  background-color: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s ease;
}

.sfp-dashboard-stat-card:hover {
  background-color: var(--background-modifier-hover);
  border-color: var(--interactive-accent);
}

/* Category indicators for flat grid */
.sfp-dashboard-stat-card.category-progress {
  border-left: 3px solid #10b981;
}

.sfp-dashboard-stat-card.category-consistency {
  border-left: 3px solid #3b82f6;
}

.sfp-dashboard-stat-card.category-content {
  border-left: 3px solid #8b5cf6;
}

.sfp-dashboard-stat-card.category-pattern {
  border-left: 3px solid #f59e0b;
}

.sfp-dashboard-stat-card .stat-value {
  /* Primary value styling */
  font-size: 24px;
  font-weight: 700;
  color: var(--text-normal);
  margin-bottom: 4px;
}

.sfp-dashboard-stat-card .stat-label {
  /* Label styling */
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

## 7. Integration Points

### 7.1 DashboardView Integration
- Add statistics section between dashboard header and filter controls
- Include statistics cards in collapsible header functionality
- Position filter controls directly above the table for better UX association
- Update refresh logic to recalculate statistics when data changes

### 7.2 State Management
- Add statistics calculation to `updateFilteredEntries()`
- Ensure statistics update with search and filter changes
- Load `statisticsGroupedView` preference from settings on dashboard initialization
- Save layout toggle preference to plugin settings
- Optimize calculation performance for large datasets

## 8. Performance Considerations

### 8.1 Calculation Optimization
- **Efficient for Large Vaults**: Calculations must be optimized for "All Time" filters on large vaults
- **Caching Strategy**: Cache parsed data to avoid repeated calculations
- **Debounced Updates**: Debounce recalculation during rapid filter/search changes
- **Algorithm Efficiency**: Use efficient algorithms for streak calculation and median computation

### 8.2 Memory Management
- **Reuse Existing Data**: Maximize reuse of existing filtered entry datasets from main table
- **Avoid Intermediate Arrays**: Minimize creation of unnecessary intermediate data structures
- **Clean Resource Management**: Proper cleanup of event listeners and observers

### 8.3 UI Framework Alignment
- **Obsidian UI Consistency**: Implementation should align with Obsidian's UI capabilities
- **Dynamic Data Display**: Clean, efficient rendering of dynamic statistical data
- **Responsive Performance**: Maintain smooth UI performance during updates

## 9. Testing Strategy

### 9.1 Unit Tests
- Statistics calculation accuracy
- Edge cases (empty datasets, single entries)
- Date range boundary conditions

### 9.2 Integration Tests
- Filter interaction with statistics updates
- Search interaction with statistics
- UI responsiveness across different screen sizes

## 10. Future Enhancement Hooks

### 10.1 User Customization (Future)
- **Card Selection**: Allow users to select which statistics cards they want to see
- **Card Ordering**: Enable custom arrangement of statistics cards
- **Personal Preferences**: Save user preferences for card display options

### 10.2 Visual Enhancements (Future)
- **Icon Integration**: Add small icons or visual cues to cards for quick recognition
- **Color Coding**: Implement color coding system for different types of statistics
- **Trend Indicators**: Display "up/down" arrows or percentage change vs. previous period
  - Example: "Average Words: 350 (+5% vs. last month)"
- **Animation Support**: Smooth transitions when statistics update

### 10.3 Goal Tracking (Future)
- **Personal Goals**: Allow users to set goals for word count or consistency
- **Progress Display**: Show progress towards goals on the dashboard
- **Achievement System**: Visual feedback for reaching milestones

### 10.4 Advanced Analytics (Future)
- **Trend Analysis**: Beyond simple aggregations, show patterns over time
- **Forecasting**: Predictive insights based on journaling patterns
- **Comparative Analysis**: Compare current period with previous periods

## 11. Implementation Phases

### Phase 1: Core Statistics Engine
1. Implement `DashboardStatisticsCalculator`
2. Extend `DashboardState` and `DashboardSettings` interfaces
3. Add basic calculation methods

### Phase 2: UI Integration & Layout Toggle
1. Create statistics cards UI components (both layouts)
2. Implement layout toggle functionality with settings persistence
3. Integrate with existing dashboard view and collapsible header
4. Add comprehensive styling for both layout options

### Phase 3: Polish & Optimization
1. Responsive design improvements
2. Performance optimization for large datasets
3. Visual enhancements and accessibility improvements
4. Testing across different filter and search combinations

This implementation approach ensures seamless integration with the existing dashboard architecture while providing a solid foundation for future enhancements.
