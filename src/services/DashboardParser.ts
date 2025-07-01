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
                const entry = await this.parseJournalFile(file);
                if (entry) {
                    entries.push(entry);
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
    private async parseJournalFile(file: TFile): Promise<DashboardEntry | null> {
        const content = await this.app.vault.read(file);
        
        // Check if this file contains a journal entry callout
        if (!this.containsJournalEntry(content)) {
            return null;
        }
        
        // Try to match against each parsed template
        for (const [templateId, parsedTemplate] of this.parsedTemplates) {
            const entry = this.tryParseWithTemplate(file, content, parsedTemplate);
            if (entry) {
                return entry;
            }
        }
        
        return null;
    }

    /**
     * Check if content contains a journal entry callout
     */
    private containsJournalEntry(content: string): boolean {
        const calloutPattern = new RegExp(`> \\[!${this.settings.calloutNames.journalEntry}\\]`, 'i');
        return calloutPattern.test(content);
    }

    /**
     * Try to parse file content using a specific template structure
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

            // Extract date from the callout header
            const date = this.extractDateFromCallout(journalBlock);
            if (!date) {
                return null;
            }

            // Extract journal content (text between callout start and dream diary callout)
            const journalContent = this.extractJournalContent(journalBlock);
            
            // Calculate metrics
            const wordCount = this.calculateWordCount(journalContent);
            const imageCount = this.countImages(journalBlock);
            const preview = this.generatePreview(journalContent);

            return {
                date,
                title: this.generateTitle(file),
                preview,
                fullContent: journalContent,
                wordCount,
                imageCount,
                filePath: file.path
            };
        } catch (error) {
            console.warn(`Failed to parse ${file.path} with template ${template.name}:`, error);
            return null;
        }
    }

    /**
     * Extract the journal entry callout block from file content
     */
    private extractJournalCalloutBlock(content: string): string | null {
        const calloutName = this.settings.calloutNames.journalEntry;
        const startPattern = new RegExp(`> \\[!${calloutName}\\].*`, 'i');
        const lines = content.split('\n');
        
        let startIndex = -1;
        let endIndex = lines.length;
        
        // Find start of journal callout
        for (let i = 0; i < lines.length; i++) {
            if (startPattern.test(lines[i])) {
                startIndex = i;
                break;
            }
        }
        
        if (startIndex === -1) {
            return null;
        }
        
        // Find end of callout (first line not starting with '>')
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (!lines[i].startsWith('>')) {
                endIndex = i;
                break;
            }
        }
        
        return lines.slice(startIndex, endIndex).join('\n');
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
     * Extract journal content (excluding dream diary section)
     */
    private extractJournalContent(calloutBlock: string): string {
        const lines = calloutBlock.split('\n');
        const journalLines: string[] = [];
        
        let inDreamSection = false;
        const dreamCalloutPattern = new RegExp(`\\[!${this.settings.calloutNames.dreamDiary}\\]`, 'i');
        
        for (const line of lines) {
            // Skip the header line and block ID line
            if (line.includes('[!journal-entry]') || line.match(/>\s*\^[\w\d-]+\s*$/)) {
                continue;
            }
            
            // Check if we're entering dream diary section
            if (dreamCalloutPattern.test(line)) {
                inDreamSection = true;
                continue;
            }
            
            // If we're not in dream section and line starts with '>', it's journal content
            if (!inDreamSection && line.startsWith('>')) {
                // Remove the '> ' prefix and any image callouts
                let cleanLine = line.substring(1).trim();
                
                // Skip image callout lines
                if (cleanLine.startsWith('[!journal-page') || cleanLine.startsWith('![[')) {
                    continue;
                }
                
                if (cleanLine) {
                    journalLines.push(cleanLine);
                }
            }
        }
        
        return journalLines.join(' ').trim();
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

    /**
     * Update settings reference
     */
    updateSettings(settings: ScribeFlowPluginSettings): void {
        this.settings = settings;
    }
}