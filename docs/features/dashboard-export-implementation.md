# Dashboard Export Options - Implementation Document

**Document Version:** 1.0  
**Date:** July 1, 2025  
**Project:** ScribeFlow Plugin for Obsidian  
**Feature:** Dashboard Export Options Implementation  
**Based on:** dashboard-export-options-specification.md  

## 1. Implementation Overview

This document outlines the technical implementation plan for export functionality in the ScribeFlow Dashboard. The feature encompasses two main export types:

1. **Dashboard Data Export** - Export filtered table data and statistics
2. **Individual Entry Export** - Export complete journal entries in various formats

## 2. Architecture & File Structure

### 2.1 New Files to Create

```
src/services/
├── export/
│   ├── DashboardExporter.ts         # Main export orchestrator
│   ├── ExportFormatters.ts          # Format-specific exporters
│   ├── EntryExporter.ts             # Individual entry export logic
│   └── types.ts                     # Export-related type definitions

src/ui/
├── components/
│   ├── ExportButton.ts              # Dashboard export button component
│   └── ExportContextMenu.ts         # Right-click context menu for entries
```

### 2.2 Files to Modify

```
src/views/DashboardView.ts           # Add export UI elements
src/types/dashboard.ts               # Add export-related types
styles.css                           # Export UI styling
```

## 3. Type Definitions

### 3.1 Export Types Interface

```typescript
// src/services/export/types.ts

export enum DashboardExportFormat {
    MARKDOWN_TABLE = 'markdown-table',
    CSV = 'csv',
    JSON = 'json'
}

export enum EntryExportFormat {
    MARKDOWN = 'markdown',
    PLAIN_TEXT = 'plain-text',
    PDF = 'pdf'
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
```

## 4. Core Export Services

### 4.1 DashboardExporter Service

```typescript
// src/services/export/DashboardExporter.ts

import { App } from 'obsidian';
import { DashboardEntry, DashboardStatistics } from '../../types/dashboard';
import { ExportFormatters } from './ExportFormatters';
import { DashboardExportFormat, DashboardExportData, ExportOptions } from './types';

export class DashboardExporter {
    private app: App;
    private formatters: ExportFormatters;

    constructor(app: App) {
        this.app = app;
        this.formatters = new ExportFormatters();
    }

    async exportDashboardData(
        entries: DashboardEntry[],
        statistics: DashboardStatistics,
        options: ExportOptions
    ): Promise<void> {
        const exportData: DashboardExportData = this.prepareExportData(entries, statistics);
        
        switch (options.format) {
            case DashboardExportFormat.MARKDOWN_TABLE:
                await this.exportAsMarkdownTable(exportData, options);
                break;
            case DashboardExportFormat.CSV:
                await this.exportAsCSV(exportData, options);
                break;
            case DashboardExportFormat.JSON:
                await this.exportAsJSON(exportData, options);
                break;
        }
    }

    private prepareExportData(
        entries: DashboardEntry[],
        statistics: DashboardStatistics
    ): DashboardExportData {
        return {
            entries,
            statistics,
            metadata: {
                exportDate: new Date().toISOString(),
                filter: this.getCurrentFilter(),
                searchQuery: this.getCurrentSearchQuery(),
                totalEntries: entries.length
            }
        };
    }

    private async exportAsMarkdownTable(data: DashboardExportData, options: ExportOptions): Promise<void> {
        const content = this.formatters.formatAsMarkdownTable(data);
        await this.handleExportDestination(content, options, 'md');
    }

    private async exportAsCSV(data: DashboardExportData, options: ExportOptions): Promise<void> {
        const content = this.formatters.formatAsCSV(data);
        await this.handleExportDestination(content, options, 'csv');
    }

    private async exportAsJSON(data: DashboardExportData, options: ExportOptions): Promise<void> {
        const content = this.formatters.formatAsJSON(data);
        await this.handleExportDestination(content, options, 'json');
    }

    private async handleExportDestination(
        content: string,
        options: ExportOptions,
        extension: string
    ): Promise<void> {
        if (options.destination === 'clipboard') {
            await navigator.clipboard.writeText(content);
            this.showNotification('Exported to clipboard');
        } else {
            await this.saveToFile(content, options.filename || `dashboard-export.${extension}`);
        }
    }
}
```

### 4.2 ExportFormatters Service

```typescript
// src/services/export/ExportFormatters.ts

import { DashboardExportData, EntryExportData } from './types';

export class ExportFormatters {
    
    formatAsMarkdownTable(data: DashboardExportData): string {
        let content = `# ScribeFlow Dashboard Export\n\n`;
        content += `**Export Date:** ${new Date(data.metadata.exportDate).toLocaleString()}\n`;
        content += `**Total Entries:** ${data.metadata.totalEntries}\n\n`;

        // Statistics section
        if (data.statistics) {
            content += `## Summary Statistics\n\n`;
            content += this.formatStatisticsAsMarkdown(data.statistics);
            content += `\n`;
        }

        // Main table
        content += `## Journal Entries\n\n`;
        content += `| Date | Content Preview | Words | Images | File |\n`;
        content += `|------|----------------|--------|--------|------|\n`;

        data.entries.forEach(entry => {
            const preview = this.escapeMarkdown(entry.preview);
            const filename = this.getFileName(entry.filePath);
            content += `| ${entry.date} | ${preview} | ${entry.wordCount} | ${entry.imageCount} | ${filename} |\n`;
        });

        return content;
    }

    formatAsCSV(data: DashboardExportData): string {
        let content = '';
        
        // CSV Header
        content += '"Date","Content Preview","Word Count","Image Count","Filename"\n';
        
        // Data rows
        data.entries.forEach(entry => {
            const preview = this.escapeCSV(entry.preview);
            const filename = this.escapeCSV(this.getFileName(entry.filePath));
            content += `"${entry.date}","${preview}","${entry.wordCount}","${entry.imageCount}","${filename}"\n`;
        });

        return content;
    }

    formatAsJSON(data: DashboardExportData): string {
        const exportObject = {
            metadata: data.metadata,
            statistics: data.statistics,
            entries: data.entries.map(entry => ({
                date: entry.date,
                title: entry.title,
                preview: entry.preview,
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
- **Total Entries:** ${stats.totalEntries}
- **Total Words:** ${stats.totalWords.toLocaleString()}
- **Average Words per Entry:** ${Math.round(stats.averageWordsPerEntry)}
- **Current Streak:** ${stats.currentJournalingStreak} days
- **Longest Streak:** ${stats.longestJournalingStreak} days
- **Days Journaled:** ${stats.daysJournaled}
- **Journaling Frequency:** ${stats.journalingFrequencyPercent.toFixed(1)}%
- **Median Word Count:** ${stats.medianWordCount}
- **Entries with Images:** ${stats.entriesWithImagesPercent.toFixed(1)}%
- **Entries with Dreams:** ${stats.entriesWithDreamDiaryPercent.toFixed(1)}%
- **Most Active Day:** ${stats.mostActiveDayOfWeek}
        `;
    }

    private escapeMarkdown(text: string): string {
        return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    }

    private escapeCSV(text: string): string {
        return text.replace(/"/g, '""').replace(/\n/g, ' ');
    }

    private getFileName(filePath: string): string {
        return filePath.split('/').pop() || filePath;
    }
}
```

### 4.3 EntryExporter Service

```typescript
// src/services/export/EntryExporter.ts

import { App, TFile } from 'obsidian';
import { DashboardEntry } from '../../types/dashboard';
import { EntryExportFormat, EntryExportData, ExportOptions } from './types';

export class EntryExporter {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    async exportEntry(
        entry: DashboardEntry,
        format: EntryExportFormat,
        options: ExportOptions
    ): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(entry.filePath);
        if (!file || !(file instanceof TFile)) {
            throw new Error(`File not found: ${entry.filePath}`);
        }

        const fullContent = await this.app.vault.read(file);
        const exportData: EntryExportData = {
            entry,
            fullContent,
            metadata: {
                sourceFile: entry.filePath,
                exportDate: new Date().toISOString(),
                wordCount: entry.wordCount,
                imageCount: entry.imageCount
            }
        };

        switch (format) {
            case EntryExportFormat.MARKDOWN:
                await this.exportAsMarkdown(exportData, options);
                break;
            case EntryExportFormat.PLAIN_TEXT:
                await this.exportAsPlainText(exportData, options);
                break;
            case EntryExportFormat.PDF:
                await this.exportAsPDF(exportData, options);
                break;
        }
    }

    private async exportAsMarkdown(data: EntryExportData, options: ExportOptions): Promise<void> {
        const filename = options.filename || this.generateFilename(data.entry, 'md');
        await this.saveToFile(data.fullContent, filename);
    }

    private async exportAsPlainText(data: EntryExportData, options: ExportOptions): Promise<void> {
        const plainText = this.convertToPlainText(data.fullContent);
        const filename = options.filename || this.generateFilename(data.entry, 'txt');
        await this.saveToFile(plainText, filename);
    }

    private async exportAsPDF(data: EntryExportData, options: ExportOptions): Promise<void> {
        // PDF export implementation - may require additional libraries
        // For v1.0, could show "PDF export coming soon" message
        throw new Error('PDF export not yet implemented');
    }

    private convertToPlainText(markdown: string): string {
        let text = markdown;
        
        // Remove callout syntax
        text = text.replace(/>\s*\[![^\]]*\][^\n]*/g, '');
        text = text.replace(/^>\s*/gm, '');
        
        // Remove markdown formatting
        text = text.replace(/#{1,6}\s*/g, ''); // Headers
        text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
        text = text.replace/\*(.*?)\*/g, '$1'); // Italic
        text = text.replace(/\[\[([^\]]+)\]\]/g, '$1'); // Wikilinks
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Regular links
        text = text.replace(/!\[\[[^\]]+\]\]/g, '[Image]'); // Images
        
        // Clean up extra whitespace
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return text.trim();
    }

    private generateFilename(entry: DashboardEntry, extension: string): string {
        const date = entry.date.replace(/[:/]/g, '-');
        const title = entry.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
        return `${date}-${title}.${extension}`;
    }
}
```

## 5. UI Components

### 5.1 Export Button Component

```typescript
// src/ui/components/ExportButton.ts

import { Component } from 'obsidian';
import { DashboardExportFormat } from '../../services/export/types';

export class ExportButton extends Component {
    private containerEl: HTMLElement;
    private onExport: (format: DashboardExportFormat) => void;

    constructor(containerEl: HTMLElement, onExport: (format: DashboardExportFormat) => void) {
        super();
        this.containerEl = containerEl;
        this.onExport = onExport;
    }

    onload(): void {
        this.render();
    }

    private render(): void {
        const exportContainer = this.containerEl.createDiv('sfp-export-container');
        
        const exportButton = exportContainer.createEl('button', {
            text: 'Export',
            cls: 'sfp-export-button'
        });

        const dropdown = exportContainer.createDiv('sfp-export-dropdown');
        dropdown.style.display = 'none';

        // Dropdown options
        this.createDropdownOption(dropdown, 'Markdown Table', DashboardExportFormat.MARKDOWN_TABLE);
        this.createDropdownOption(dropdown, 'CSV File', DashboardExportFormat.CSV);
        this.createDropdownOption(dropdown, 'JSON File', DashboardExportFormat.JSON);

        // Toggle dropdown
        exportButton.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!exportContainer.contains(e.target as Node)) {
                dropdown.style.display = 'none';
            }
        });
    }

    private createDropdownOption(
        dropdown: HTMLElement,
        label: string,
        format: DashboardExportFormat
    ): void {
        const option = dropdown.createDiv('sfp-export-option');
        option.textContent = label;
        option.addEventListener('click', () => {
            this.onExport(format);
            dropdown.style.display = 'none';
        });
    }
}
```

### 5.2 Context Menu Component

```typescript
// src/ui/components/ExportContextMenu.ts

import { Menu } from 'obsidian';
import { DashboardEntry } from '../../types/dashboard';
import { EntryExportFormat } from '../../services/export/types';

export class ExportContextMenu {
    
    static create(
        entry: DashboardEntry,
        onExport: (entry: DashboardEntry, format: EntryExportFormat) => void
    ): Menu {
        const menu = new Menu();

        menu.addItem((item) => {
            item.setTitle('Export Entry')
                .setIcon('download')
                .onClick(() => {
                    // Show submenu for format selection
                    const submenu = new Menu();
                    
                    submenu.addItem((subitem) => {
                        subitem.setTitle('Markdown (.md)')
                            .onClick(() => onExport(entry, EntryExportFormat.MARKDOWN));
                    });
                    
                    submenu.addItem((subitem) => {
                        subitem.setTitle('Plain Text (.txt)')
                            .onClick(() => onExport(entry, EntryExportFormat.PLAIN_TEXT));
                    });
                    
                    submenu.addItem((subitem) => {
                        subitem.setTitle('PDF (.pdf)')
                            .onClick(() => onExport(entry, EntryExportFormat.PDF));
                    });
                    
                    submenu.showAtMouseEvent(event);
                });
        });

        return menu;
    }
}
```

## 6. Dashboard View Integration

### 6.1 DashboardView Modifications

```typescript
// Additions to src/views/DashboardView.ts

import { DashboardExporter } from '../services/export/DashboardExporter';
import { EntryExporter } from '../services/export/EntryExporter';
import { ExportButton } from '../ui/components/ExportButton';
import { ExportContextMenu } from '../ui/components/ExportContextMenu';

// Add to DashboardView class:
private dashboardExporter: DashboardExporter;
private entryExporter: EntryExporter;
private exportButton: ExportButton;

// In constructor:
this.dashboardExporter = new DashboardExporter(this.app);
this.entryExporter = new EntryExporter(this.app);

// Add to renderControls method:
private renderControls(container: HTMLElement): void {
    const controls = container.createDiv('sfp-dashboard-controls');
    
    // ... existing filter code ...
    
    // Add export button
    this.exportButton = new ExportButton(
        controls,
        (format) => this.handleDashboardExport(format)
    );
    this.exportButton.load();
    
    // ... rest of existing code ...
}

// Add to renderTableRow method:
private renderTableRow(tbody: HTMLTableSectionElement, entry: DashboardEntry): void {
    const row = tbody.createEl('tr');
    
    // ... existing row rendering code ...
    
    // Add right-click context menu
    row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const menu = ExportContextMenu.create(
            entry,
            (entry, format) => this.handleEntryExport(entry, format)
        );
        menu.showAtMouseEvent(e);
    });
}

// Export handlers:
private async handleDashboardExport(format: DashboardExportFormat): Promise<void> {
    try {
        await this.dashboardExporter.exportDashboardData(
            this.state.filteredEntries,
            this.state.statistics,
            {
                format,
                destination: format === DashboardExportFormat.MARKDOWN_TABLE ? 'clipboard' : 'file',
                includeStatistics: true
            }
        );
    } catch (error) {
        console.error('Export failed:', error);
        // Show error notification
    }
}

private async handleEntryExport(entry: DashboardEntry, format: EntryExportFormat): Promise<void> {
    try {
        await this.entryExporter.exportEntry(entry, format, {
            format,
            destination: 'file'
        });
    } catch (error) {
        console.error('Entry export failed:', error);
        // Show error notification
    }
}
```

## 7. CSS Styling

### 7.1 Export UI Styles

```css
/* Export Button Styling */
.sfp-export-container {
    position: relative;
    display: inline-block;
}

.sfp-export-button {
    background: var(--interactive-normal);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    padding: 6px 12px;
    color: var(--text-normal);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
}

.sfp-export-button:hover {
    background: var(--interactive-hover);
}

.sfp-export-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 150px;
}

.sfp-export-option {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-normal);
    transition: background-color 0.2s ease;
}

.sfp-export-option:hover {
    background: var(--background-modifier-hover);
}

.sfp-export-option:first-child {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
}

.sfp-export-option:last-child {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
}

/* Context Menu Styling */
.sfp-context-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sfp-context-menu-icon {
    width: 16px;
    height: 16px;
    opacity: 0.7;
}
```

## 8. Implementation Tasks Breakdown

### 8.1 Phase 1: Core Infrastructure (Priority 1)
1. **Create export type definitions** (`types.ts`)
2. **Implement DashboardExporter service** with basic structure
3. **Implement ExportFormatters** for Markdown Table and CSV
4. **Create ExportButton component**
5. **Integrate export button into DashboardView**

### 8.2 Phase 2: Entry Export (Priority 2)
1. **Implement EntryExporter service** for Markdown and Plain Text
2. **Create ExportContextMenu component**
3. **Add right-click context menu to table rows**
4. **Implement file save dialogs**

### 8.3 Phase 3: Advanced Features (Priority 3)
1. **Add JSON export format**
2. **Implement statistics inclusion in exports**
3. **Add notification system for export completion**
4. **Error handling and user feedback**

### 8.4 Phase 4: Polish & Testing (Priority 4)
1. **Add comprehensive CSS styling**
2. **Implement PDF export (future enhancement)**
3. **Performance optimization for large datasets**
4. **Multi-selection export (future enhancement)**

## 9. Technical Considerations

### 9.1 Performance
- **Async Processing**: All export operations must be asynchronous
- **Progress Indicators**: For large exports, show progress feedback
- **Memory Management**: Stream large datasets instead of loading entirely in memory

### 9.2 Error Handling
- **File Access Errors**: Handle permissions and missing files gracefully
- **Format Errors**: Validate data before export
- **User Feedback**: Clear error messages and recovery suggestions

### 9.3 Security
- **Path Validation**: Ensure export paths are safe
- **Data Sanitization**: Clean user data before export
- **Permission Checks**: Verify file system access before operations

### 9.4 Compatibility
- **Cross-Platform**: Ensure file operations work on Windows, Mac, Linux
- **Obsidian API**: Use only stable API methods
- **Browser Compatibility**: Ensure clipboard operations work across browsers

## 10. Testing Strategy

### 10.1 Unit Tests
- **Export Formatters**: Test each format conversion
- **Data Validation**: Test edge cases and invalid data
- **File Operations**: Mock file system interactions

### 10.2 Integration Tests
- **Dashboard Integration**: Test export button functionality
- **Context Menu**: Test right-click export flow
- **Error Scenarios**: Test failure handling

### 10.3 User Acceptance Tests
- **Workflow Testing**: Complete export workflows
- **Format Validation**: Verify exported content quality
- **Performance Testing**: Large dataset export testing

This implementation document provides a comprehensive roadmap for developing the dashboard export functionality while maintaining code quality, performance, and user experience standards.