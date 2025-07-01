import { JournalTemplate } from '../types';
import { ParsedTemplate, TemplateStructure, PlaceholderPosition } from '../types/dashboard';

export class TemplateAnalyzer {
    
    /**
     * Analyze template structure to identify placeholder positions
     */
    analyzeTemplate(template: JournalTemplate): ParsedTemplate {
        const placeholders = this.extractPlaceholders(template.content);
        const structure = this.buildTemplateStructure(template.content, placeholders);
        
        return {
            id: template.id,
            name: template.name,
            contentStructure: structure
        };
    }
    
    /**
     * Extract all placeholders from template content
     */
    private extractPlaceholders(content: string): PlaceholderPosition[] {
        const placeholderPattern = /\{\{([^}]+)\}\}/g;
        const placeholders: PlaceholderPosition[] = [];
        let match;
        
        while ((match = placeholderPattern.exec(content)) !== null) {
            const placeholderName = match[1].trim();
            const type = this.classifyPlaceholder(placeholderName);
            
            placeholders.push({
                type,
                name: placeholderName,
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        }
        
        return placeholders;
    }
    
    /**
     * Classify placeholder by its name
     */
    private classifyPlaceholder(name: string): 'journal-content' | 'dream-content' | 'date' | 'other' {
        switch (name) {
            case 'journal-content':
                return 'journal-content';
            case 'dream-content':
                return 'dream-content';
            case 'date':
            case 'date-long':
            case 'date-month-day':
            case 'date-compact':
                return 'date';
            default:
                return 'other';
        }
    }
    
    /**
     * Build template structure based on placeholders
     */
    private buildTemplateStructure(content: string, placeholders: PlaceholderPosition[]): TemplateStructure {
        const structure: TemplateStructure = {
            placeholders
        };
        
        // Find journal content boundaries
        const journalContentPlaceholder = placeholders.find(p => p.type === 'journal-content');
        if (journalContentPlaceholder) {
            structure.journalContentStart = journalContentPlaceholder.startIndex;
            structure.journalContentEnd = journalContentPlaceholder.endIndex;
        }
        
        // Find dream content boundaries
        const dreamContentPlaceholder = placeholders.find(p => p.type === 'dream-content');
        if (dreamContentPlaceholder) {
            structure.dreamContentStart = dreamContentPlaceholder.startIndex;
            structure.dreamContentEnd = dreamContentPlaceholder.endIndex;
        }
        
        // Find date position
        const datePlaceholder = placeholders.find(p => p.type === 'date');
        if (datePlaceholder) {
            structure.datePosition = datePlaceholder.startIndex;
        }
        
        return structure;
    }
    
    /**
     * Check if template has required placeholders for dashboard parsing
     */
    hasRequiredPlaceholders(template: JournalTemplate): boolean {
        const content = template.content;
        
        // Must have at least journal-content placeholder
        const hasJournalContent = content.includes('{{journal-content}}');
        
        // Should have date placeholder for date extraction
        const hasDate = content.includes('{{date}}') || 
                       content.includes('{{date-long}}') || 
                       content.includes('{{date-month-day}}') || 
                       content.includes('{{date-compact}}');
        
        return hasJournalContent && hasDate;
    }
    
    /**
     * Get content boundaries for parsing journal entries
     */
    getContentBoundaries(templateStructure: TemplateStructure, processedContent: string): {
        journalStart?: number;
        journalEnd?: number;
        dreamStart?: number;
        dreamEnd?: number;
    } {
        const boundaries: any = {};
        
        // For now, we'll use simple placeholder detection
        // In a real implementation, we'd need more sophisticated parsing
        // based on the template structure and how it was processed
        
        if (templateStructure.journalContentStart !== undefined) {
            // Find where journal content actually appears in processed content
            // This is a simplified approach - in practice we'd need to track
            // how placeholders were replaced during template processing
            boundaries.journalStart = 0; // Placeholder logic
            boundaries.journalEnd = -1; // Placeholder logic
        }
        
        return boundaries;
    }
}