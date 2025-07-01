import { App, TFile, Notice } from 'obsidian';
import { DashboardEntry } from '../../types/dashboard';
import { EntryExportFormat, EntryExportData, ExportOptions, ExportResult } from './types';
// @ts-ignore - html2pdf.js doesn't have official TypeScript types
import html2pdf from 'html2pdf.js';
// @ts-ignore - html2canvas doesn't have official TypeScript types  
import html2canvas from 'html2canvas';
import { logger } from '../LoggingService';

export class EntryExporter {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    async exportEntry(
        entry: DashboardEntry,
        format: EntryExportFormat,
        options: ExportOptions
    ): Promise<ExportResult> {
        try {
            // Use the journal entry content from the DashboardEntry, not the entire file
            const exportData: EntryExportData = {
                entry,
                fullContent: entry.fullContent,
                metadata: {
                    sourceFile: entry.filePath,
                    exportDate: new Date().toISOString(),
                    wordCount: entry.wordCount,
                    imageCount: entry.imageCount
                }
            };

            switch (format) {
                case EntryExportFormat.MARKDOWN:
                    return await this.exportAsMarkdown(exportData, options);
                case EntryExportFormat.PLAIN_TEXT:
                    return await this.exportAsPlainText(exportData, options);
                case EntryExportFormat.PDF:
                    return await this.exportAsPDF(exportData, options);
                case EntryExportFormat.IMAGE:
                    return await this.exportAsImage(exportData, options);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            logger.error('EntryExporter', 'exportEntry', 'Entry export failed', {
                format,
                error: error.message,
                entryPath: entry.filePath,
                entryDate: entry.date
            });
            return {
                success: false,
                message: `Export failed: ${error.message}`
            };
        }
    }

    async exportMultipleEntries(
        entries: DashboardEntry[],
        format: EntryExportFormat,
        options: ExportOptions
    ): Promise<ExportResult[]> {
        const results: ExportResult[] = [];
        
        for (const entry of entries) {
            const result = await this.exportEntry(entry, format, options);
            results.push(result);
        }

        // Show summary notification
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        if (successCount === totalCount) {
            new Notice(`Successfully exported ${successCount} entries`);
        } else {
            new Notice(`Exported ${successCount}/${totalCount} entries (${totalCount - successCount} failed)`);
        }

        return results;
    }

    private async exportAsMarkdown(
        data: EntryExportData, 
        options: ExportOptions
    ): Promise<ExportResult> {
        const filename = options.filename || this.generateFilename(data.entry, 'md');
        await this.saveToFile(data.fullContent, filename);
        new Notice(`Entry exported to ${filename}`);
        
        return {
            success: true,
            message: `Exported to ${filename}`,
            filePath: filename,
            data: data.fullContent
        };
    }

    private async exportAsPlainText(
        data: EntryExportData, 
        options: ExportOptions
    ): Promise<ExportResult> {
        const plainText = this.convertToPlainText(data.fullContent);
        const filename = options.filename || this.generateFilename(data.entry, 'txt');
        
        await this.saveToFile(plainText, filename);
        new Notice(`Entry exported to ${filename}`);
        
        return {
            success: true,
            message: `Exported to ${filename}`,
            filePath: filename,
            data: plainText
        };
    }

    private async exportAsPDF(
        data: EntryExportData, 
        options: ExportOptions
    ): Promise<ExportResult> {
        // Convert markdown to HTML first
        const html = this.convertToHTML(data.fullContent, data.entry);
        const filename = options.filename || this.generateFilename(data.entry, 'pdf');
        
        // Use simple HTML-to-PDF conversion
        await this.convertHTMLToPDF(html, filename);
        new Notice(`Entry exported to ${filename}`);
        
        return {
            success: true,
            message: `Exported to ${filename}`,
            filePath: filename
        };
    }

    private async exportAsImage(
        data: EntryExportData, 
        options: ExportOptions
    ): Promise<ExportResult> {
        // Convert markdown to HTML first
        const html = this.convertToHTML(data.fullContent, data.entry);
        const filename = options.filename || this.generateFilename(data.entry, 'png');
        
        // Convert HTML to image
        await this.convertHTMLToImage(html, filename);
        new Notice(`Entry exported to ${filename}`);
        
        return {
            success: true,
            message: `Exported to ${filename}`,
            filePath: filename
        };
    }

    private convertToPlainText(markdown: string): string {
        let text = markdown;
        
        // Remove callout syntax
        text = text.replace(/>\s*\[![^\]]*\][^\n]*/g, '');
        text = text.replace(/^>\s*/gm, '');
        
        // Remove markdown formatting
        text = text.replace(/#{1,6}\s*/g, ''); // Headers
        text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
        text = text.replace(/\*(.*?)\*/g, '$1'); // Italic
        text = text.replace(/~~(.*?)~~/g, '$1'); // Strikethrough
        text = text.replace(/\[\[([^\]]+)\]\]/g, '$1'); // Wikilinks
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Regular links
        text = text.replace(/!\[\[[^\]]+\]\]/g, '[Image]'); // Images
        text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]'); // Markdown images
        text = text.replace(/`([^`]+)`/g, '$1'); // Inline code
        text = text.replace(/```[\s\S]*?```/g, '[Code Block]'); // Code blocks
        
        // Clean up extra whitespace
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
        text = text.replace(/[ \t]+/g, ' ');
        
        return text.trim();
    }

    private convertToHTML(markdown: string, entry: DashboardEntry): string {
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${entry.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .metadata {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        .callout {
            border-left: 4px solid #007acc;
            background: #f8f9fa;
            padding: 10px 15px;
            margin: 15px 0;
        }
        .callout-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
        }
        p {
            margin-bottom: 16px;
        }
        blockquote {
            border-left: 4px solid #dfe2e5;
            padding: 0 16px;
            color: #6a737d;
        }
        code {
            background: #f6f8fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
        }
        pre {
            background: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${entry.title}</h1>
        <div class="metadata">
            Date: ${entry.date} | Words: ${entry.wordCount} | Images: ${entry.imageCount}
        </div>
    </div>
    <div class="content">
        ${this.markdownToHTML(markdown)}
    </div>
</body>
</html>`;
        return html;
    }

    private markdownToHTML(markdown: string): string {
        let html = markdown;
        
        // Convert callouts
        html = html.replace(/>\s*\[!([^\]]+)\]\s*([^\n]*)/g, 
            '<div class="callout"><div class="callout-title">$1</div>$2</div>');
        html = html.replace(/^>\s*/gm, '');
        
        // Convert headers
        html = html.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');
        
        // Convert formatting
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert links
        html = html.replace(/\[\[([^\]]+)\]\]/g, '<span style="color: #007acc;">$1</span>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Convert images
        html = html.replace(/!\[\[([^\]]+)\]\]/g, '<em>[Image: $1]</em>');
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">');
        
        // Convert paragraphs
        html = html.replace(/\n\s*\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs
        html = html.replace(/<p>\s*<\/p>/g, '');
        
        return html;
    }

    private async convertHTMLToPDF(html: string, filename: string): Promise<void> {
        try {
            const options = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: 'white'
                },
                jsPDF: { 
                    unit: 'in', 
                    format: 'letter', 
                    orientation: 'portrait' 
                }
            };

            await html2pdf().set(options).from(html).save();
            
        } catch (error) {
            logger.error('EntryExporter', 'convertHTMLToPDF', 'PDF generation failed', {
                error: error.message,
                filename
            });
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
    }

    private async convertHTMLToImage(html: string, filename: string): Promise<void> {
        try {
            // Create a temporary container for the HTML content
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = html;
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = '800px'; // Fixed width for consistent layout
            tempContainer.style.padding = '20px';
            tempContainer.style.backgroundColor = 'white';
            document.body.appendChild(tempContainer);

            // Configure html2canvas options
            const canvas = await html2canvas(tempContainer, {
                scale: 2, // Higher resolution
                useCORS: true,
                backgroundColor: 'white',
                width: 840, // 800 + 40 padding
                height: undefined, // Auto height
                scrollX: 0,
                scrollY: 0
            });

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.style.display = 'none';
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    URL.revokeObjectURL(url);
                }
            }, 'image/png', 0.95);
            
            // Clean up temporary container
            document.body.removeChild(tempContainer);
            
        } catch (error) {
            logger.error('EntryExporter', 'convertHTMLToImage', 'Image generation failed', {
                error: error.message,
                filename
            });
            throw new Error(`Failed to generate image: ${error.message}`);
        }
    }

    private async saveToFile(content: string, filename: string): Promise<void> {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            logger.error('EntryExporter', 'saveToFile', 'File save failed', {
                error: error.message,
                filename
            });
            throw new Error(`Failed to save file: ${error.message}`);
        }
    }

    private generateFilename(entry: DashboardEntry, extension: string): string {
        // Format entry date as YYYYMMDD
        const entryDate = entry.date.replace(/[-:/]/g, '').substring(0, 8);
        
        // Format current date as YYYYMMDD
        const now = new Date();
        const exportDate = now.getFullYear().toString() + 
                          (now.getMonth() + 1).toString().padStart(2, '0') + 
                          now.getDate().toString().padStart(2, '0');
        
        // Format current time as HHMMSS
        const exportTime = now.getHours().toString().padStart(2, '0') + 
                          now.getMinutes().toString().padStart(2, '0') + 
                          now.getSeconds().toString().padStart(2, '0');
        
        return `${entryDate}-exported-${exportDate}-${exportTime}.${extension}`;
    }
}