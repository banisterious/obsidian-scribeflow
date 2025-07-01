import { App, TFile, TFolder } from 'obsidian';
import { ScribeFlowPluginSettings } from '../types';
import { DashboardEntry, ParsedTemplate } from '../types/dashboard';
import { TemplateAnalyzer } from './TemplateAnalyzer';

export class DashboardParser {
    private app: App;
    private settings: ScribeFlowPluginSettings;
    private templateAnalyzer: TemplateAnalyzer;
    private parsedTemplates: Map<string, ParsedTemplate>;

    constructor(app: App, settings: ScribeFlowPluginSettings) {
        this.app = app;
        this.settings = settings;
        this.templateAnalyzer = new TemplateAnalyzer();
        this.parsedTemplates = new Map();
    }

    /**
     * Parse all journal entries from configured folders and templates
     */
    async parseAllEntries(): Promise<DashboardEntry[]> {
        // Analyze selected templates first
        await this.analyzeSelectedTemplates();
        
        // Get all markdown files from selected folders
        const files = await this.getFilesFromFolders();
        
        // Parse each file
        const entries: DashboardEntry[] = [];
        
        for (const file of files) {
            try {
                const fileEntries = await this.parseJournalFile(file);
                if (fileEntries.length > 0) {
                    entries.push(...fileEntries);
                }
            } catch (error) {
                console.warn(`Failed to parse journal file ${file.path}:`, error);
            }
        }
        
        return entries;
    }

    /**
     * Analyze all selected templates to understand their structure
     */
    private async analyzeSelectedTemplates(): Promise<void> {
        this.parsedTemplates.clear();
        
        for (const templateId of this.settings.dashboardSettings.parseTemplates) {
            const template = this.settings.templates.find(t => t.id === templateId);
            if (template && this.templateAnalyzer.hasRequiredPlaceholders(template)) {
                const parsedTemplate = this.templateAnalyzer.analyzeTemplate(template);
                this.parsedTemplates.set(templateId, parsedTemplate);
            }
        }
    }

    /**
     * Get all markdown files from configured scan folders
     */
    private async getFilesFromFolders(): Promise<TFile[]> {
        const files: TFile[] = [];
        
        for (const folderPath of this.settings.dashboardSettings.scanFolders) {
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (folder instanceof TFolder) {
                const folderFiles = this.getMarkdownFilesFromFolder(folder);
                files.push(...folderFiles);
            }
        }
        
        return files;
    }

    /**
     * Recursively get all markdown files from a folder
     */
    private getMarkdownFilesFromFolder(folder: TFolder): TFile[] {
        const files: TFile[] = [];
        
        for (const child of folder.children) {
            if (child instanceof TFile && child.extension === 'md') {
                files.push(child);
            } else if (child instanceof TFolder) {
                // Recursively scan subfolders
                const subFiles = this.getMarkdownFilesFromFolder(child);
                files.push(...subFiles);
            }
        }
        
        return files;
    }

    /**
     * Parse a single journal file to extract dashboard entry data
     */
    private async parseJournalFile(file: TFile): Promise<DashboardEntry[]> {
        const content = await this.app.vault.read(file);
        
        // Check if this file contains a journal entry callout
        if (!this.containsJournalEntry(content)) {
            return [];
        }
        
        // Extract all journal callout blocks from the file
        const calloutBlocks = this.extractAllJournalCalloutBlocks(content);
        const entries: DashboardEntry[] = [];
        
        // Process each callout block
        for (const calloutBlock of calloutBlocks) {
            // Try to match against each parsed template
            for (const [templateId, parsedTemplate] of this.parsedTemplates) {
                const entry = this.tryParseCalloutBlock(file, calloutBlock, parsedTemplate);
                if (entry) {
                    entries.push(entry);
                    break; // Found a match for this callout, move to next
                }
            }
        }
        
        return entries;
    }

    /**
     * Check if content contains a journal entry callout
     */
    private containsJournalEntry(content: string): boolean {
        const calloutPattern = new RegExp(`> \\[!${this.settings.calloutNames.journalEntry}\\]`, 'i');
        return calloutPattern.test(content);
    }

    /**
     * Try to parse file content using a specific template structure (legacy method)
     */
    private tryParseWithTemplate(
        file: TFile, 
        content: string, 
        template: ParsedTemplate
    ): DashboardEntry | null {
        try {
            // Extract journal entry callout block
            const journalBlock = this.extractJournalCalloutBlock(content);
            if (!journalBlock) {
                return null;
            }

            return this.tryParseCalloutBlock(file, journalBlock, template);
        } catch (error) {
            console.warn(`Failed to parse ${file.path} with template ${template.name}:`, error);
            return null;
        }
    }

    /**
     * Try to parse a specific callout block using a template structure
     */
    private tryParseCalloutBlock(
        file: TFile,
        calloutBlock: string,
        template: ParsedTemplate
    ): DashboardEntry | null {
        try {
            // Extract date from the callout header
            const date = this.extractDateFromCallout(calloutBlock);
            if (!date) {
                return null;
            }

            // Extract journal content (text between callout start and dream diary callout)
            const journalContent = this.extractJournalContent(calloutBlock);
            
            // Calculate metrics
            const wordCount = this.calculateWordCount(journalContent);
            const imageCount = this.countImages(calloutBlock);
            const preview = this.generatePreview(journalContent);

            // Generate title with date for multiple entries per file
            const title = this.generateTitleWithDate(file, date);

            return {
                date,
                title,
                preview,
                fullContent: journalContent,
                wordCount,
                imageCount,
                filePath: file.path
            };
        } catch (error) {
            console.warn(`Failed to parse callout block from ${file.path}:`, error);
            return null;
        }
    }

    /**
     * Extract all journal entry callout blocks from file content
     */
    private extractAllJournalCalloutBlocks(content: string): string[] {
        const calloutName = this.settings.calloutNames.journalEntry;
        const startPattern = new RegExp(`> \\[!${calloutName}\\].*`, 'i');
        const lines = content.split('\n');
        const calloutBlocks: string[] = [];
        
        let i = 0;
        while (i < lines.length) {
            // Find start of a journal callout
            if (startPattern.test(lines[i])) {
                const startIndex = i;
                let endIndex = lines.length;
                
                // Find end of this callout (first line not starting with '>')
                for (let j = startIndex + 1; j < lines.length; j++) {
                    if (!lines[j].startsWith('>')) {
                        endIndex = j;
                        break;
                    }
                }
                
                const calloutBlock = lines.slice(startIndex, endIndex).join('\n');
                calloutBlocks.push(calloutBlock);
                
                // Continue searching after this callout
                i = endIndex;
            } else {
                i++;
            }
        }
        
        return calloutBlocks;
    }

    /**
     * Extract the journal entry callout block from file content (legacy method for single callout)
     */
    private extractJournalCalloutBlock(content: string): string | null {
        const blocks = this.extractAllJournalCalloutBlocks(content);
        return blocks.length > 0 ? blocks[0] : null;
    }

    /**
     * Extract date from journal callout header
     */
    private extractDateFromCallout(calloutBlock: string): string | null {
        // Look for date pattern in the callout header
        const headerLine = calloutBlock.split('\n')[0];
        
        // Try YYYY-MM-DD format first
        const isoPattern = /(\d{4}-\d{2}-\d{2})/;
        const isoMatch = headerLine.match(isoPattern);
        if (isoMatch) {
            return isoMatch[1];
        }
        
        // Try to extract from compact date in the second line (^20250114)
        const lines = calloutBlock.split('\n');
        if (lines.length > 1) {
            const compactPattern = /\^(\d{8})/;
            const compactMatch = lines[1].match(compactPattern);
            if (compactMatch) {
                const compactDate = compactMatch[1];
                // Convert YYYYMMDD to YYYY-MM-DD
                return `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`;
            }
        }
        
        // Try to parse natural language dates like "Tuesday, January 14"
        const textDatePattern = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i;
        const textMatch = headerLine.match(textDatePattern);
        if (textMatch) {
            try {
                // Try to parse the date and convert to YYYY-MM-DD
                const dateStr = textMatch[0];
                const currentYear = new Date().getFullYear();
                const parsedDate = new Date(`${dateStr} ${currentYear}`);
                if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.toISOString().split('T')[0];
                }
            } catch (e) {
                // Fall through to null
            }
        }
        
        return null;
    }

    /**
     * Extract all content (journal + dream content) from callout block
     */
    private extractJournalContent(calloutBlock: string): string {
        const lines = calloutBlock.split('\n');
        const contentLines: string[] = [];
        let inMetricsSection = false;
        
        for (const line of lines) {
            // Skip the header line and block ID line
            if (line.includes('[!journal-entry]') || line.match(/>\s*\^[\w\d-]+\s*$/)) {
                continue;
            }
            
            // Check if we're entering a dream-metrics section
            if (line.includes('[!dream-metrics]')) {
                inMetricsSection = true;
                continue;
            }
            
            // Check if we're exiting the metrics section (new callout or non-callout line)
            if (inMetricsSection) {
                // If we hit another callout or non-callout line, exit metrics section
                if (line.includes('[!') && !line.includes('[!dream-metrics]')) {
                    inMetricsSection = false;
                } else if (!line.startsWith('>')) {
                    inMetricsSection = false;
                } else {
                    // Still in metrics section, skip this line
                    continue;
                }
            }
            
            // Process any line that starts with '>' (callout content)
            if (line.startsWith('>') && !inMetricsSection) {
                // Remove all '> ' prefixes to handle nested callouts
                let cleanLine = line.replace(/^>+\s*/, '');
                
                // Skip callout headers (including nested ones like [!dream-diary], [!journal-page])
                if (cleanLine.startsWith('[!')) {
                    continue;
                }
                
                // Skip empty lines
                if (!cleanLine) {
                    continue;
                }
                
                // Clean the line content
                cleanLine = this.cleanLineContent(cleanLine);
                
                if (cleanLine) {
                    contentLines.push(cleanLine);
                }
            }
        }
        
        return contentLines.join(' ').trim();
    }

    /**
     * Clean line content by removing embeds and converting links to plain text
     */
    private cleanLineContent(line: string): string {
        let cleaned = line;
        
        // Remove embeds: ![[image]] → (removed entirely)
        cleaned = cleaned.replace(/!\[\[[^\]]+\]\]/g, '');
        
        // Convert wikilinks: [[link|text]] → text, [[link]] → link
        cleaned = cleaned.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_match, link, _pipe, text) => {
            return text || link;
        });
        
        // Convert markdown links: [text](url) → text
        cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        
        // Strip markdown headings: ### text → text
        cleaned = cleaned.replace(/^#{1,6}\s+/, '');
        
        // Convert HTML line breaks to actual line breaks
        cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
        
        // Strip underline tags: <u>text</u> → text
        cleaned = cleaned.replace(/<\/?u>/gi, '');
        
        // Strip span tags but keep content: <span class="...">text</span> → text
        cleaned = cleaned.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
        
        // Strip any remaining callout syntax that might have slipped through
        cleaned = cleaned.replace(/>\s*\[![^\]]*\]\s*/g, '');
        
        // Clean up multiple spaces but preserve line breaks
        cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();
        
        return cleaned;
    }

    /**
     * Count images in the callout block
     */
    private countImages(calloutBlock: string): number {
        const imagePattern = /!\[\[[^\]]+\]\]/g;
        const matches = calloutBlock.match(imagePattern);
        return matches ? matches.length : 0;
    }

    /**
     * Calculate word count from text
     */
    private calculateWordCount(text: string): number {
        if (!text || typeof text !== 'string') {
            return 0;
        }
        
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    }

    /**
     * Generate preview text
     */
    private generatePreview(content: string): string {
        if (!content) {
            return '';
        }
        
        const words = content.trim().split(/\s+/);
        const limit = this.settings.dashboardSettings.previewWordLimit;
        
        if (words.length <= limit) {
            return content;
        }
        
        return words.slice(0, limit).join(' ') + '...';
    }

    /**
     * Generate title from filename
     */
    private generateTitle(file: TFile): string {
        return file.basename;
    }

    private generateTitleWithDate(file: TFile, date: string): string {
        // Format: "filename - YYYY-MM-DD" for multiple entries per file
        return `${file.basename} - ${date}`;
    }

    /**
     * Update settings reference
     */
    updateSettings(settings: ScribeFlowPluginSettings): void {
        this.settings = settings;
    }
}