export interface DashboardEntry {
	date: string; // From {{date}} placeholder
	title: string; // From filename
	preview: string; // First X words from journal content
	fullContent: string; // Complete journal content for expansion
	wordCount: number; // Journal content word count only
	imageCount: number; // Images in entire entry
	filePath: string; // For navigation link
	tags: string[]; // Inline tags extracted from content
}

export enum DateFilter {
	ALL_TIME = 'all-time',
	TODAY = 'today',
	THIS_WEEK = 'this-week',
	THIS_MONTH = 'this-month',
	LAST_30_DAYS = 'last-30-days',
	THIS_YEAR = 'this-year',
}

export interface DashboardState {
	entries: DashboardEntry[];
	filteredEntries: DashboardEntry[];
	currentFilter: DateFilter;
	sortColumn: string;
	sortDirection: 'asc' | 'desc';
	searchQuery: string;
	searchResults: SearchResult[];
	searchFields: SearchField[];
	headerCollapsed: boolean;
	statistics: DashboardStatistics;
	statisticsGroupedView: boolean;
}

export interface DashboardStatistics {
	// Group 1: Overall Progress / Summary
	totalEntries: number;
	totalWords: number;
	averageWordsPerEntry: number;

	// Group 2: Consistency
	currentJournalingStreak: number;
	longestJournalingStreak: number;
	longestJournalingStreakDateRange: string;
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

export interface StatCard {
	label: string;
	value: string | number;
	suffix?: string;
	category?: 'progress' | 'consistency' | 'content' | 'pattern';
}

export interface SearchResult {
	entry: DashboardEntry;
	matches: SearchMatch[];
	score: number;
}

export interface SearchMatch {
	field: 'title' | 'content' | 'file';
	text: string;
	indices: [number, number][];
}

export interface SearchField {
	name: 'title' | 'content' | 'file';
	label: string;
	enabled: boolean;
}

export interface ParsedTemplate {
	id: string;
	name: string;
	contentStructure: TemplateStructure;
}

export interface TemplateStructure {
	journalContentStart?: number;
	journalContentEnd?: number;
	datePosition?: number;
	dreamContentStart?: number;
	dreamContentEnd?: number;
	placeholders: PlaceholderPosition[];
}

export interface PlaceholderPosition {
	type: 'journal-content' | 'dream-content' | 'date' | 'other';
	name: string;
	startIndex: number;
	endIndex: number;
}
