import { DashboardEntry, DashboardStatistics, DateFilter } from '../types/dashboard';

export class DashboardStatisticsCalculator {
	static calculateStatistics(
		entries: DashboardEntry[],
		dateFilter: DateFilter,
		searchQuery?: string
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
			daysJournaled: this.calculateDaysJournaled(entries),
			journalingFrequencyPercent: this.calculateJournalingFrequency(entries, totalDaysInPeriod),

			// Group 3: Content Insights
			medianWordCount: this.calculateMedianWordCount(entries),
			entriesWithImagesPercent: this.calculateEntriesWithImagesPercent(entries),
			entriesWithDreamDiaryPercent: this.calculateEntriesWithDreamDiaryPercent(entries),

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

	private static calculateEntriesWithDreamDiaryPercent(entries: DashboardEntry[]): number {
		if (entries.length === 0) return 0;

		const entriesWithDreams = entries.filter(
			entry => entry.fullContent.includes('[!dream-diary]') || entry.preview.includes('[!dream-diary]')
		).length;

		return Math.round((entriesWithDreams / entries.length) * 100 * 10) / 10; // Round to 1 decimal
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
}
