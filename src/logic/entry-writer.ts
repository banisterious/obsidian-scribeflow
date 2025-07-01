import { FormState, ScribeFlowPluginSettings } from '../types';
import { App, Notice, MarkdownView } from 'obsidian';
import { updateTableOfContents } from './toc-updater';
import { logger } from '../services/LoggingService';

export async function writeJournalEntry(app: App, settings: ScribeFlowPluginSettings, state: FormState): Promise<void> {
    const content = generateMarkdown(settings, state);
    
    const activeLeaf = app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeLeaf || !activeLeaf.editor) {
        new Notice('No active markdown editor found. Please open a note first.');
        return;
    }
    
    const editor = activeLeaf.editor;
    const cursor = editor.getCursor();
    
    editor.replaceRange(content, cursor);
    
    const lines = content.split('\n');
    const newCursor = {
        line: cursor.line + lines.length - 1,
        ch: lines.length === 1 ? cursor.ch + content.length : lines[lines.length - 1].length
    };
    editor.setCursor(newCursor);
    
    const dateBlockID = `^${state.date.replace(/-/g, '')}`;
    
    // Update TOC after a delay to ensure editor changes are committed
    if (settings.tocSettings.updateMasterJournals || settings.tocSettings.updateYearNote) {
        // Wait for editor to commit changes, then update TOCs
        setTimeout(async () => {
            try {
                await updateTableOfContents(app, settings, state, dateBlockID);
            } catch (error) {
                logger.error('EntryWriter', 'TOC update failed', { error: error.message });
            }
        }, 500);
    }
}

function generateMarkdown(settings: ScribeFlowPluginSettings, state: FormState): string {
    const dreamWordCount = state.dreamContent.split(/\s+/).filter(Boolean).length;
    const dateBlockID = `^${state.date.replace(/-/g, '')}`;
    const dreamDateId = state.date.replace(/-/g, '');

    let journalImageBlock = '';
    if (state.journalImagePath) {
        journalImageBlock = `>> [!journal-page|right]\n>> ![[${state.journalImagePath}|${state.journalImageWidth}]]\n> `;
    }

    let dreamImageBlock = '';
    if (state.dreamImagePath) {
        dreamImageBlock = `>>> [!journal-page|right]\n>>> ![[${state.dreamImagePath}|${state.dreamImageWidth}]]\n>>`;
    }

    let dreamDiaryBlock = '';
    if (state.dreamTitle || state.dreamContent) {
        const metricsText = generateMetricsText(settings, state);
        dreamDiaryBlock = `>> [!${settings.calloutNames.dreamDiary}] ${state.dreamTitle} [[Journals/Dream Diary/Dream Diary#^${dreamDateId}-${state.dreamTitle.replace(/\s+/g, '-')}|Dream Diary]]\n>>\n${dreamImageBlock ? dreamImageBlock + '\n' : ''}>> ${state.dreamContent}\n>>\n>>> [!dream-metrics]\n>>> Words: ${dreamWordCount}${metricsText ? ', ' + metricsText : ''}`;
    }

    const journalContent = `> [!${settings.calloutNames.journalEntry}] ${state.date} [[Journals|John's Journal]]\n> ${dateBlockID}\n> \n${journalImageBlock ? journalImageBlock + '\n' : ''}> ${state.journalContent}${dreamDiaryBlock ? '\n> \n' + dreamDiaryBlock : ''}`;

    return journalContent;
}

function generateMetricsText(settings: ScribeFlowPluginSettings, state: FormState): string {
    const metricTexts: string[] = [];
    
    settings.selectedMetrics.forEach(metric => {
        const value = state.metrics[metric.id];
        if (value !== undefined && value !== '') {
            metricTexts.push(`${metric.name}: ${value}`);
        }
    });
    
    return metricTexts.join(', ');
}