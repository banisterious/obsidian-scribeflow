import { DashboardEntry, DashboardStatistics, DateFilter, ParsedTemplate } from '../types/dashboard';

export class DashboardStatisticsCalculator {
	static calculateStatistics(
		entries: DashboardEntry[],
		dateFilter: DateFilter,
		searchQuery?: string,
		templates?: ParsedTemplate[]
	): DashboardStatistics {
		if (entries.length === 0) {
			return this.getEmptyStatistics();
		}

		const totalDaysInPeriod = this.getTotalDaysInPeriod(dateFilter, entries);

		return {
			// Group 1: Overall Progress / Summary
			totalEntries: this.calculateTotalEntries(entries),
			totalWords: this.calculateTotalWords(entries),
			averageWordsPerEntry: this.calculateAverageWordsPerEntry(entries),

			// Group 2: Consistency
			currentJournalingStreak: this.calculateCurrentJournalingStreak(entries, dateFilter),
			longestJournalingStreak: this.calculateLongestJournalingStreak(entries),
			longestJournalingStreakDateRange: this.calculateLongestJournalingStreakDateRange(entries),
			daysJournaled: this.calculateDaysJournaled(entries),
			journalingFrequencyPercent: this.calculateJournalingFrequency(entries, totalDaysInPeriod),

			// Group 3: Content Insights
			medianWordCount: this.calculateMedianWordCount(entries),
			entriesWithImagesPercent: this.calculateEntriesWithImagesPercent(entries),
			entriesWithDreamDiaryPercent: this.calculateEntriesWithDreamDiaryPercent(entries, templates),

			// Group 4: Pattern Recognition
			mostActiveDayOfWeek: this.calculateMostActiveDayOfWeek(entries),

			// Supporting data
			totalDaysInPeriod: totalDaysInPeriod,
		};
	}

	private static getEmptyStatistics(): DashboardStatistics {
		return {
			totalEntries: 0,
			totalWords: 0,
			averageWordsPerEntry: 0,
			currentJournalingStreak: 0,
			longestJournalingStreak: 0,
			longestJournalingStreakDateRange: '',
			daysJournaled: 0,
			journalingFrequencyPercent: 0,
			medianWordCount: 0,
			entriesWithImagesPercent: 0,
			entriesWithDreamDiaryPercent: 0,
			mostActiveDayOfWeek: 'None',
			totalDaysInPeriod: 0,
		};
	}

	// Group 1: Overall Progress / Summary
	private static calculateTotalEntries(entries: DashboardEntry[]): number {
		return entries.length;
	}

	private static calculateTotalWords(entries: DashboardEntry[]): number {
		return entries.reduce((total, entry) => total + entry.wordCount, 0);
	}

	private static calculateAverageWordsPerEntry(entries: DashboardEntry[]): number {
		if (entries.length === 0) return 0;
		const totalWords = this.calculateTotalWords(entries);
		return Math.round(totalWords / entries.length);
	}

	// Group 2: Consistency
	private static calculateCurrentJournalingStreak(entries: DashboardEntry[], dateFilter: DateFilter): number {
		const uniqueDates = this.getUniqueDates(entries).sort();
		if (uniqueDates.length === 0) return 0;

		let currentStreak = 0;
		const today = new Date();
		let checkDate = new Date(today);
		let skippedToday = false;

		// Work backwards from today to find consecutive days
		while (checkDate >= new Date(uniqueDates[0])) {
			const dateKey = checkDate.toISOString().split('T')[0];
			if (uniqueDates.includes(dateKey)) {
				currentStreak++;
			} else {
				// Allow skipping today only, but break on any other gap
				if (!skippedToday && dateKey === today.toISOString().split('T')[0]) {
					skippedToday = true;
				} else {
					break;
				}
			}
			checkDate.setDate(checkDate.getDate() - 1);
		}

		return currentStreak;
	}

	private static calculateLongestJournalingStreak(entries: DashboardEntry[]): number {
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

	private static calculateLongestJournalingStreakDateRange(entries: DashboardEntry[]): string {
		const uniqueDates = this.getUniqueDates(entries).sort();
		if (uniqueDates.length === 0) return '';

		let maxStreak = 1;
		let currentStreak = 1;
		let maxStreakStartIndex = 0;
		let currentStreakStartIndex = 0;

		for (let i = 1; i < uniqueDates.length; i++) {
			const prevDate = new Date(uniqueDates[i - 1]);
			const currDate = new Date(uniqueDates[i]);
			const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

			if (dayDiff === 1) {
				currentStreak++;
				if (currentStreak > maxStreak) {
					maxStreak = currentStreak;
					maxStreakStartIndex = currentStreakStartIndex;
				}
			} else {
				currentStreak = 1;
				currentStreakStartIndex = i;
			}
		}

		if (maxStreak === 1) {
			// Single day streak
			const date = new Date(uniqueDates[maxStreakStartIndex]);
			return this.formatDate(date);
		} else {
			// Multi-day streak
			const startDate = new Date(uniqueDates[maxStreakStartIndex]);
			const endDate = new Date(uniqueDates[maxStreakStartIndex + maxStreak - 1]);
			return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
		}
	}

	private static calculateDaysJournaled(entries: DashboardEntry[]): number {
		return this.getUniqueDates(entries).length;
	}

	private static calculateJournalingFrequency(entries: DashboardEntry[], totalDaysInPeriod: number): number {
		if (totalDaysInPeriod === 0) return 0;
		const daysJournaled = this.calculateDaysJournaled(entries);
		return Math.round((daysJournaled / totalDaysInPeriod) * 100 * 10) / 10; // Round to 1 decimal
	}

	// Group 3: Content Insights
	private static calculateMedianWordCount(entries: DashboardEntry[]): number {
		if (entries.length === 0) return 0;

		const wordCounts = entries.map(entry => entry.wordCount).sort((a, b) => a - b);
		const mid = Math.floor(wordCounts.length / 2);

		if (wordCounts.length % 2 === 0) {
			return Math.round((wordCounts[mid - 1] + wordCounts[mid]) / 2);
		} else {
			return wordCounts[mid];
		}
	}

	private static calculateEntriesWithImagesPercent(entries: DashboardEntry[]): number {
		if (entries.length === 0) return 0;

		const entriesWithImages = entries.filter(entry => entry.imageCount > 0).length;
		return Math.round((entriesWithImages / entries.length) * 100 * 10) / 10; // Round to 1 decimal
	}

	private static calculateEntriesWithDreamDiaryPercent(entries: DashboardEntry[], templates?: ParsedTemplate[]): number {
		if (entries.length === 0) return 0;

		const entriesWithDreams = entries.filter(entry => {
			return this.entryHasDreamContent(entry, templates);
		}).length;

		return Math.round((entriesWithDreams / entries.length) * 100 * 10) / 10; // Round to 1 decimal
	}

	private static entryHasDreamContent(entry: DashboardEntry, templates?: ParsedTemplate[]): boolean {
		if (!templates || templates.length === 0) {
			// Fallback to simple pattern matching if no templates available
			const content = entry.fullContent.toLowerCase();
			return content.includes('dream') && (content.includes('[!') || content.includes('diary'));
		}

		// Template-based detection
		for (const template of templates) {
			if (this.entryMatchesTemplateWithDreams(entry, template)) {
				return true;
			}
		}

		return false;
	}

	private static entryMatchesTemplateWithDreams(entry: DashboardEntry, template: ParsedTemplate): boolean {
		const structure = template.contentStructure;
		
		// Check if template has dream content placeholders
		const hasDreamPlaceholders = structure.placeholders.some(
			placeholder => placeholder.type === 'dream-content'
		);

		if (!hasDreamPlaceholders) {
			return false;
		}

		// Check if the entry has content in dream sections
		// Look for dream-related content by checking for dream-specific markers
		const content = entry.fullContent;
		
		// Check for dream diary callouts (flexible pattern)
		const dreamCalloutPattern = /\[!\s*dream[-\s]?diary?\s*\]/i;
		if (dreamCalloutPattern.test(content)) {
			return true;
		}

		// Check for dream content placeholders that have been filled
		// This looks for areas where dream content would be placed based on template structure
		if (structure.dreamContentStart !== undefined && structure.dreamContentEnd !== undefined) {
			// If we have dream content boundaries, check if there's substantive content there
			const dreamSection = content.substring(structure.dreamContentStart, structure.dreamContentEnd);
			// Dream content exists if section has more than just whitespace and placeholder text
			return dreamSection.trim().length > 0 && !dreamSection.includes('{{dream-content}}');
		}

		// Final check: look for dream-related keywords in context of the template
		const dreamKeywords = ['dream', 'nightmare', 'lucid', 'rem', 'sleep'];
		const lowerContent = content.toLowerCase();
		
		return dreamKeywords.some(keyword => lowerContent.includes(keyword)) && 
		       (lowerContent.includes('diary') || lowerContent.includes('[!'));
	}

	// Group 4: Pattern Recognition
	private static calculateMostActiveDayOfWeek(entries: DashboardEntry[]): string {
		if (entries.length === 0) return 'None';

		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const dayCounts = new Array(7).fill(0);

		entries.forEach(entry => {
			const date = new Date(entry.date);
			const dayOfWeek = date.getDay();
			dayCounts[dayOfWeek]++;
		});

		const maxCount = Math.max(...dayCounts);
		const mostActiveDay = dayCounts.indexOf(maxCount);

		return dayNames[mostActiveDay];
	}

	// Helper methods
	private static getTotalDaysInPeriod(dateFilter: DateFilter, entries: DashboardEntry[]): number {
		const now = new Date();

		switch (dateFilter) {
			case DateFilter.TODAY:
				return 1;
			case DateFilter.THIS_WEEK:
				return 7;
			case DateFilter.THIS_MONTH:
				return now.getDate(); // Days elapsed in current month
			case DateFilter.LAST_30_DAYS:
				return 30;
			case DateFilter.THIS_YEAR:
				const startOfYear = new Date(now.getFullYear(), 0, 1);
				return Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
			case DateFilter.ALL_TIME:
				if (entries.length === 0) return 0;
				const firstEntryDate = new Date(Math.min(...entries.map(e => new Date(e.date).getTime())));
				return Math.ceil((now.getTime() - firstEntryDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
			default:
				return 0;
		}
	}

	private static getUniqueDates(entries: DashboardEntry[]): string[] {
		const dates = new Set<string>();
		entries.forEach(entry => {
			const dateKey = entry.date.split('T')[0]; // ISO date only (YYYY-MM-DD)
			dates.add(dateKey);
		});
		return Array.from(dates);
	}

	private static formatDate(date: Date): string {
		const options: Intl.DateTimeFormatOptions = { 
			month: 'short', 
			day: 'numeric',
			year: 'numeric'
		};
		return date.toLocaleDateString('en-US', options);
	}
}
