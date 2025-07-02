# Implementation Plan: Dashboard Enhancements
**Based on:** dashboard-new-metrics-specifications.md v1.3  
**Date:** July 2, 2025  
**Project:** ScribeFlow Plugin for Obsidian

## Overview
This implementation plan covers adding new metrics and table columns to the Scribe Dashboard feature in multiple phases, providing enhanced insights into journaling patterns and content analysis.

## Phased Implementation Approach

### Phase 1: Core Table Enhancements
**Priority:** Essential data additions to the main dashboard table

#### 1.1 Unique Words Column
- **Type:** Integer, sortable
- **Description:** Count of unique word tokens in journal content
- **Process:**
  1. Tokenization: Extract word-like sequences
  2. Normalization: Lowercase, remove punctuation
  3. Counting: Count distinct words
- **Caching:** Implement result caching for performance
- **Implementation Tasks:**
  - [ ] Extend `DashboardEntry` interface with `uniqueWordCount` property
  - [ ] Add unique word counting algorithm with caching
  - [ ] Update table structure to include Unique Words column
  - [ ] Implement sorting functionality

#### 1.2 Tags Column  
- **Type:** String array/text, non-sortable initially
- **Description:** Tags associated with the entry
- **Sources:**
  - Inline tags: `#tagname` in content
  - YAML frontmatter: `tags: [tag1, tag2]`
- **Display:** Comma-separated list (e.g., "reflection, daily, mood")
- **Implementation Tasks:**
  - [ ] Extend `DashboardEntry` interface with `tags` property
  - [ ] Build inline tag extraction (`#tagname` patterns)
  - [ ] Add YAML frontmatter tag parsing
  - [ ] Update table structure to include Tags column
  - [ ] **Consider:** Make tags clickable for navigation (TBD based on complexity)

### Phase 2: Advanced Statistics
**Priority:** Enhanced metrics for deeper insights

#### 2.1 Average Words per Day of Week
- **Display:** "Mon: 550 avg, Fri: 200 avg" or similar compact format
- **Calculation:** Group entries by day of week, calculate average word count per day
- **Implementation Tasks:**
  - [ ] Add day-of-week analysis to `DashboardStatisticsCalculator`
  - [ ] Create new stat card for day-of-week averages
  - [ ] Design compact display format for the metric

#### 2.2 Content Balance (Journal vs Dream Ratio)
- **Display:** "Dream content: 25% of total words this month"
- **Calculation:** `(Dream Words) / (Total Words) * 100`
- **Implementation Tasks:**
  - [ ] Extend word counting to separate journal vs dream content
  - [ ] Update statistics calculator for content balance
  - [ ] Add new stat card for content balance display

#### 2.3 Goal Tracking & Progress
- **Features:**
  - Daily Word Goal: "350 words (75% complete today)"
  - Weekly Consistency Goal: "5/7 days (4 days achieved)"
- **Implementation Tasks:**
  - [ ] Add goal settings to plugin configuration
  - [ ] Create goal progress calculation logic
  - [ ] Build goal tracking stat cards
  - [ ] Design settings interface for goal configuration

### Phase 3: Readability & Structure Analysis
**Priority:** Writing quality and style insights

#### 3.1 Readability Score
- **Metrics:** Flesch-Kincaid, Gunning-Fog Index, or similar
- **Description:** Numerical score indicating writing difficulty/accessibility
- **Value:** Understand writing style and accessibility (even to future self)
- **Implementation Tasks:**
  - [ ] Research and implement readability algorithms
  - [ ] Add syllable counting functionality
  - [ ] Create readability score calculation
  - [ ] Add readability stat card to dashboard
  - [ ] Consider per-entry readability in table (optional)

#### 3.2 Average Sentence Length
- **Metric:** Average number of words per sentence
- **Description:** Indicator of sentence structure complexity
- **Value:** Simple measure of writing complexity and style
- **Implementation Tasks:**
  - [ ] Implement sentence tokenization
  - [ ] Calculate average sentence length per entry
  - [ ] Add sentence length statistics
  - [ ] Handle edge cases (abbreviations, etc.)

### Phase 4: Sentiment Analysis
**Priority:** Emotional insights and mood tracking

#### 4.1 Sentiment Score
- **Metric:** Score from -1 to +1 or "positive/negative/neutral" categorization
- **Description:** Overall emotional tone of journal entries
- **Value:** Track emotional patterns and mood over time
- **Implementation Tasks:**
  - [ ] Research sentiment analysis libraries/approaches
  - [ ] Implement basic sentiment scoring algorithm
  - [ ] Add sentiment statistics to dashboard
  - [ ] Consider sentiment trends over time
  - [ ] Optional: Per-entry sentiment in table

## Technical Infrastructure

### Caching System
- **Purpose:** Performance optimization for expensive calculations
- **Scope:** Unique words, readability scores, sentiment analysis
- **Implementation:**
  - [ ] Design cache invalidation strategy
  - [ ] Implement cache storage (memory/file-based)
  - [ ] Add cache management to parser
  - [ ] Monitor cache performance impact

### Data Structure Updates
- **DashboardEntry Interface Extensions:**
```typescript
interface DashboardEntry {
  // Existing fields...
  uniqueWordCount: number;           // Phase 1
  tags: string[];                    // Phase 1
  readabilityScore?: number;         // Phase 3
  averageSentenceLength?: number;    // Phase 3
  sentimentScore?: number;           // Phase 4
}
```

### Settings Extensions
- **Goal Configuration:** Daily/weekly targets
- **Analysis Preferences:** Enable/disable specific metrics
- **Cache Settings:** Cache size limits, refresh intervals

## Success Criteria by Phase

### Phase 1
- [ ] Unique Words column displays and sorts correctly
- [ ] Tags column shows extracted tags properly
- [ ] Caching system improves performance
- [ ] No significant performance degradation

### Phase 2  
- [ ] Day-of-week averages provide meaningful insights
- [ ] Content balance accurately reflects journal vs dream ratio
- [ ] Goal tracking motivates consistent journaling
- [ ] All new statistics integrate smoothly with existing layout

### Phase 3
- [ ] Readability scores align with writing complexity
- [ ] Sentence length analysis provides style insights
- [ ] Metrics help users understand their writing patterns

### Phase 4
- [ ] Sentiment analysis reflects emotional tone accurately
- [ ] Mood tracking provides valuable long-term insights
- [ ] Sentiment trends help identify patterns

## Dependencies & Considerations

### Performance
- Implement progressive loading for large datasets
- Cache expensive calculations (unique words, readability, sentiment)
- Monitor memory usage with new metrics

### User Experience  
- Maintain dashboard responsiveness
- Provide clear explanations for new metrics
- Allow users to disable resource-intensive features

### Extensibility
- Design metrics system to easily add new calculations
- Maintain backward compatibility
- Consider export functionality for enhanced data

## Timeline Approach
- **Phase 1:** Core functionality - highest impact, moderate complexity
- **Phase 2:** Advanced insights - high value, moderate complexity  
- **Phase 3:** Writing analysis - specialized value, moderate complexity
- **Phase 4:** Sentiment tracking - experimental value, higher complexity

Each phase can be implemented and released independently, providing incremental value to users while building toward a comprehensive journaling analytics platform.