import { DashboardExportData, EntryExportData } from './types';
import { DashboardStatistics } from '../../types/dashboard';

export class ExportFormatters {
    
    formatAsMarkdownTable(data: DashboardExportData): string {
        let content = `# ScribeFlow Dashboard Export\n\n`;
        content += `**Export Date:** ${new Date(data.metadata.exportDate).toLocaleString()}\n`;
        content += `**Filter:** ${this.formatFilterName(data.metadata.filter)}\n`;
        if (data.metadata.searchQuery) {
            content += `**Search Query:** "${data.metadata.searchQuery}"\n`;
        }
        content += `**Total Entries:** ${data.metadata.totalEntries}\n\n`;

        // Statistics section
        if (data.statistics) {
            content += `## Summary Statistics\n\n`;
            content += this.formatStatisticsAsMarkdown(data.statistics);
            content += `\n`;
        }

        // Main table
        content += `## Journal Entries\n\n`;
        content += `| Date | Content | Words | Images | File |\n`;
        content += `|------|---------|--------|--------|------|\n`;

        data.entries.forEach(entry => {
            const entryContent = this.escapeMarkdown(entry.fullContent);
            const filename = this.getFileName(entry.filePath);
            content += `| ${entry.date} | ${entryContent} | ${entry.wordCount} | ${entry.imageCount} | ${filename} |\n`;
        });

        return content;
    }

    formatAsCSV(data: DashboardExportData): string {
        let content = '';
        
        // CSV Header
        content += '"Date","Content","Word Count","Image Count","Filename"\n';
        
        // Data rows
        data.entries.forEach(entry => {
            const entryContent = this.escapeCSV(entry.fullContent);
            const filename = this.escapeCSV(this.getFileName(entry.filePath));
            content += `"${entry.date}","${entryContent}","${entry.wordCount}","${entry.imageCount}","${filename}"\n`;
        });

        return content;
    }

    formatAsJSON(data: DashboardExportData): string {
        const exportObject = {
            metadata: {
                exportDate: data.metadata.exportDate,
                filter: data.metadata.filter,
                searchQuery: data.metadata.searchQuery || null,
                totalEntries: data.metadata.totalEntries,
                exportedAt: new Date().toISOString()
            },
            statistics: data.statistics,
            entries: data.entries.map(entry => ({
                date: entry.date,
                title: entry.title,
                fullContent: entry.fullContent,
                wordCount: entry.wordCount,
                imageCount: entry.imageCount,
                filename: this.getFileName(entry.filePath),
                filePath: entry.filePath
            }))
        };

        return JSON.stringify(exportObject, null, 2);
    }

    private formatStatisticsAsMarkdown(stats: DashboardStatistics): string {
        return `
### Overall Progress
- **Total Entries:** ${stats.totalEntries}
- **Total Words:** ${stats.totalWords.toLocaleString()}
- **Average Words per Entry:** ${Math.round(stats.averageWordsPerEntry)}

### Consistency
- **Current Streak:** ${stats.currentJournalingStreak} days
- **Longest Streak:** ${stats.longestJournalingStreak} days
- **Days Journaled:** ${stats.daysJournaled}
- **Journaling Frequency:** ${stats.journalingFrequencyPercent.toFixed(1)}%

### Content Insights
- **Median Word Count:** ${stats.medianWordCount}
- **Entries with Images:** ${stats.entriesWithImagesPercent.toFixed(1)}%
- **Entries with Dreams:** ${stats.entriesWithDreamDiaryPercent.toFixed(1)}%

### Patterns
- **Most Active Day:** ${stats.mostActiveDayOfWeek}
        `.trim();
    }

    private formatFilterName(filter: string): string {
        const filterNames: Record<string, string> = {
            'all-time': 'All Time',
            'today': 'Today',
            'this-week': 'This Week',
            'this-month': 'This Month',
            'last-30-days': 'Last 30 Days',
            'this-year': 'This Year'
        };
        return filterNames[filter] || filter;
    }

    private escapeMarkdown(text: string): string {
        if (!text) return '';
        return text
            .replace(/\|/g, '\\|')
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ');
    }

    private escapeCSV(text: string): string {
        if (!text) return '';
        return text
            .replace(/"/g, '""')
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ');
    }

    private getFileName(filePath: string): string {
        return filePath.split('/').pop() || filePath;
    }
}