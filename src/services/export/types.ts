import { DashboardEntry, DashboardStatistics, DateFilter } from '../../types/dashboard';

export enum DashboardExportFormat {
	MARKDOWN_TABLE = 'markdown-table',
	CSV = 'csv',
	JSON = 'json',
}

export enum EntryExportFormat {
	MARKDOWN = 'markdown',
	PLAIN_TEXT = 'plain-text',
	PDF = 'pdf',
	IMAGE = 'image',
}

export interface DashboardExportData {
	entries: DashboardEntry[];
	statistics: DashboardStatistics;
	metadata: {
		exportDate: string;
		filter: DateFilter;
		searchQuery?: string;
		totalEntries: number;
	};
}

export interface ExportOptions {
	format: DashboardExportFormat | EntryExportFormat;
	includeStatistics?: boolean;
	filename?: string;
	destination: 'clipboard' | 'file';
}

export interface EntryExportData {
	entry: DashboardEntry;
	fullContent: string;
	metadata: {
		sourceFile: string;
		exportDate: string;
		wordCount: number;
		imageCount: number;
	};
}

export interface ExportResult {
	success: boolean;
	message: string;
	data?: string;
	filePath?: string;
}
