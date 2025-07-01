import { FormState, JournalTemplate, MetricDefinition } from '../types';

export class TemplateProcessingService {
    
    /**
     * Process a template by replacing all placeholders with actual content
     */
    processTemplate(template: JournalTemplate, formState: FormState, selectedMetrics: MetricDefinition[]): string {
        let processedContent = template.content;
        
        // Replace date placeholders
        processedContent = this.replaceDatePlaceholders(processedContent, formState.date);
        
        // Replace content placeholders
        processedContent = this.replaceContentPlaceholders(processedContent, formState);
        
        // Replace metrics placeholders
        processedContent = this.replaceMetricsPlaceholders(processedContent, formState, selectedMetrics);
        
        return processedContent;
    }
    
    /**
     * Replace date-related placeholders
     */
    private replaceDatePlaceholders(content: string, dateString: string): string {
        // Parse date string maintaining local timezone
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        // Use current time for time placeholders
        const now = new Date();
        
        // Generate different date formats
        const formats = {
            '{{date}}': this.formatDate(date, 'YYYY-MM-DD'),
            '{{date-long}}': this.formatDate(date, 'MMMM DD, YYYY'),
            '{{date-month-day}}': this.formatDate(date, 'MMMM DD'),
            '{{date-compact}}': this.formatDate(date, 'YYYYMMDD'),
            '{{time}}': this.formatTime(now, '24'),
            '{{time-12}}': this.formatTime(now, '12'),
            '{{time-12-lower}}': this.formatTime(now, '12-lower'),
        };
        
        let processed = content;
        Object.entries(formats).forEach(([placeholder, value]) => {
            processed = processed.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        });
        
        return processed;
    }
    
    /**
     * Replace content placeholders with form data
     */
    private replaceContentPlaceholders(content: string, formState: FormState): string {
        let processed = content;
        
        // Replace main content placeholder
        const journalContent = this.buildJournalContent(formState);
        processed = processed.replace(/\{\{content\}\}/g, journalContent);
        
        // Replace specific content fields
        processed = processed.replace(/\{\{journal-content\}\}/g, formState.journalContent || '');
        processed = processed.replace(/\{\{dream-content\}\}/g, formState.dreamContent || '');
        processed = processed.replace(/\{\{title\}\}/g, formState.dreamTitle || '');
        processed = processed.replace(/\{\{dream-title\}\}/g, formState.dreamTitle || '');
        processed = processed.replace(/\{\{dream-title-kebab\}\}/g, this.toKebabCase(formState.dreamTitle || ''));
        
        // Replace image placeholders
        processed = processed.replace(/\{\{dream-image\}\}/g, this.formatDreamImage(formState));
        processed = processed.replace(/\{\{journal-image\}\}/g, this.formatJournalImage(formState));
        
        return processed;
    }
    
    /**
     * Replace metrics placeholders
     */
    private replaceMetricsPlaceholders(content: string, formState: FormState, selectedMetrics: MetricDefinition[]): string {
        let processed = content;
        
        // Replace multi-line {{metrics}} placeholder
        const metricsMultiLine = this.buildMetricsContent(formState, selectedMetrics, 'multi-line');
        processed = processed.replace(/\{\{metrics\}\}/g, metricsMultiLine);
        
        // Replace inline {{metrics-inline}} placeholder
        const metricsInline = this.buildMetricsContent(formState, selectedMetrics, 'inline');
        processed = processed.replace(/\{\{metrics-inline\}\}/g, metricsInline);
        
        // Replace individual metric placeholders
        selectedMetrics.forEach(metric => {
            const placeholder = new RegExp(`\\{\\{${metric.name}\\}\\}`, 'g');
            const value = formState.metrics[metric.id];
            const formattedValue = this.formatMetricValue(metric, value);
            processed = processed.replace(placeholder, formattedValue);
        });
        
        return processed;
    }
    
    /**
     * Build journal content from form state
     */
    private buildJournalContent(formState: FormState): string {
        const parts: string[] = [];
        
        if (formState.journalContent?.trim()) {
            parts.push(formState.journalContent.trim());
        }
        
        if (formState.dreamTitle?.trim() || formState.dreamContent?.trim()) {
            if (formState.dreamTitle?.trim()) {
                parts.push(`**Dream: ${formState.dreamTitle.trim()}**`);
            }
            if (formState.dreamContent?.trim()) {
                parts.push(formState.dreamContent.trim());
            }
        }
        
        return parts.join('\n\n');
    }
    
    /**
     * Build metrics content in different formats
     */
    private buildMetricsContent(formState: FormState, selectedMetrics: MetricDefinition[], format: 'multi-line' | 'inline' = 'multi-line'): string {
        const metricPairs: string[] = [];
        
        // Add word count first
        const wordCount = this.calculateWordCount(formState.dreamContent);
        metricPairs.push(`Words: ${wordCount}`);
        
        // Add regular metrics
        selectedMetrics.forEach(metric => {
            const value = formState.metrics[metric.id];
            const formattedValue = this.formatMetricValue(metric, value);
            metricPairs.push(`${metric.name}: ${formattedValue}`);
        });
        
        if (format === 'inline') {
            return metricPairs.join(', ');
        } else {
            return metricPairs.join('\n');
        }
    }
    
    /**
     * Calculate word count from text content
     */
    private calculateWordCount(text: string): number {
        if (!text || typeof text !== 'string') {
            return 0;
        }
        
        // Remove extra whitespace and split by whitespace
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    }
    
    /**
     * Format metric value based on type
     */
    private formatMetricValue(metric: MetricDefinition, value: any): string {
        if (value === undefined || value === null) {
            return metric.type === 'score' || metric.type === 'number' ? '0' : '';
        }
        
        switch (metric.type) {
            case 'score':
                return String(value); // Just the numeric value for OneiroMetrics compatibility
            case 'number':
                return String(value);
            case 'text':
                return String(value);
            default:
                return String(value);
        }
    }
    
    /**
     * Format date with simple patterns
     */
    private formatDate(date: Date, pattern: string): string {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        switch (pattern) {
            case 'YYYY-MM-DD':
                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            case 'MMMM DD, YYYY':
                return `${months[month - 1]} ${day}, ${year}`;
            case 'MMMM DD':
                return `${months[month - 1]} ${day}`;
            case 'YYYYMMDD':
                return `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
            default:
                return date.toISOString().split('T')[0];
        }
    }
    
    /**
     * Format current time in various formats
     */
    private formatTime(date: Date, format: '24' | '12' | '12-lower' = '24'): string {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        
        if (format === '24') {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        
        const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const ampmLower = hours >= 12 ? 'pm' : 'am';
        const timeString = `${hours12}:${minutes.toString().padStart(2, '0')}`;
        
        if (format === '12') {
            return `${timeString} ${ampm}`;
        } else { // '12-lower'
            return `${timeString}${ampmLower}`;
        }
    }
    
    /**
     * Convert string to kebab-case
     */
    private toKebabCase(str: string): string {
        return str
            .trim()
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }
    
    /**
     * Format dream image as markdown embed
     */
    private formatDreamImage(formState: FormState): string {
        if (!formState.dreamImagePath) {
            return '';
        }
        
        const imagePath = formState.dreamImagePath;
        const width = formState.dreamImageWidth;
        
        if (width && width > 0) {
            return `![[${imagePath}|${width}]]`;
        } else {
            return `![[${imagePath}]]`;
        }
    }
    
    /**
     * Format journal image as markdown embed
     */
    private formatJournalImage(formState: FormState): string {
        if (!formState.journalImagePath) {
            return '';
        }
        
        const imagePath = formState.journalImagePath;
        const width = formState.journalImageWidth;
        
        if (width && width > 0) {
            return `![[${imagePath}|${width}]]`;
        } else {
            return `![[${imagePath}]]`;
        }
    }
    
    /**
     * Validate template placeholders
     */
    validateTemplate(templateContent: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const placeholderPattern = /\{\{([^}]+)\}\}/g;
        const validPlaceholders = [
            'date', 'date-long', 'date-month-day', 'date-compact', 'time', 'time-12', 'time-12-lower',
            'content', 'journal-content', 'dream-content', 'title', 'dream-title', 'dream-title-kebab',
            'dream-image', 'journal-image', 'metrics', 'metrics-inline'
        ];
        
        let match;
        while ((match = placeholderPattern.exec(templateContent)) !== null) {
            const placeholder = match[1];
            if (!validPlaceholders.includes(placeholder)) {
                // Check if it's a metric name placeholder (will be validated against actual metrics later)
                if (!placeholder.match(/^[A-Za-z\s]+$/)) {
                    errors.push(`Invalid placeholder: {{${placeholder}}}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}