export interface DashboardEntry {
    date: string;           // From {{date}} placeholder
    title: string;          // From filename
    preview: string;        // First X words from journal content
    fullContent: string;    // Complete journal content for expansion
    wordCount: number;      // Journal content word count only
    imageCount: number;     // Images in entire entry
    filePath: string;       // For navigation link
}

export enum DateFilter {
    ALL_TIME = 'all-time',
    TODAY = 'today',
    THIS_WEEK = 'this-week',
    THIS_MONTH = 'this-month',
    LAST_30_DAYS = 'last-30-days',
    THIS_YEAR = 'this-year'
}

export interface DashboardState {
    entries: DashboardEntry[];
    filteredEntries: DashboardEntry[];
    currentFilter: DateFilter;
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
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