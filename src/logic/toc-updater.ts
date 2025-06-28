import { App, Notice, TFile } from 'obsidian';
import { FormState, ScribeFlowPluginSettings } from '../types';
import { formatDisplayDate, formatShortDate } from '../utils/date-formatter';
import { findSpecificCalloutListEnd } from '../utils/callout-parser';

export async function updateTableOfContents(
    app: App, 
    settings: ScribeFlowPluginSettings, 
    state: FormState, 
    dateBlockID: string
): Promise<void> {
    const promises: Promise<void>[] = [];
    
    if (settings.tocSettings.updateYearNote) {
        promises.push(updateYearNoteTOC(app, settings, state, dateBlockID));
    }
    
    if (settings.tocSettings.updateMasterJournals && settings.tocSettings.masterJournalsNotePath) {
        promises.push(updateMasterJournalsTOC(app, settings, state, dateBlockID));
    }
    
    try {
        await Promise.all(promises);
    } catch (error) {
        console.error('One or more TOC updates failed:', error);
    }
}

async function updateYearNoteTOC(
    app: App, 
    settings: ScribeFlowPluginSettings, 
    state: FormState, 
    dateBlockID: string
): Promise<void> {
    try {
        const activeFile = app.workspace.getActiveFile();
        if (!activeFile) {
            throw new Error('No active file found');
        }
        
        const content = await app.vault.read(activeFile);
        const insertionPoint = findSpecificCalloutListEnd(content, settings.tocSettings.yearNoteCalloutName);
        
        if (insertionPoint === null) {
            throw new Error('Could not find table of contents in current note');
        }
        
        const links = generateYearNoteLinks(state, dateBlockID);
        await insertLinksAtPosition(app, activeFile, content, insertionPoint, links);
        
    } catch (error) {
        console.error('Error updating year note TOC:', error);
        new Notice(`Failed to update year note TOC: ${error.message}`);
    }
}

async function updateMasterJournalsTOC(
    app: App, 
    settings: ScribeFlowPluginSettings, 
    state: FormState, 
    dateBlockID: string
): Promise<void> {
    try {
        const masterFile = app.vault.getAbstractFileByPath(settings.tocSettings.masterJournalsNotePath);
        if (!masterFile || !(masterFile instanceof TFile)) {
            throw new Error('Master journals note not found or inaccessible');
        }
        
        const content = await app.vault.read(masterFile);
        const insertionPoint = findSpecificCalloutListEnd(content, settings.tocSettings.masterJournalsCalloutName);
        
        if (insertionPoint === null) {
            throw new Error('Could not find table of contents in master journals note');
        }
        
        const link = generateMasterJournalsLink(state, dateBlockID);
        await insertLinksAtPosition(app, masterFile, content, insertionPoint, [link]);
        
    } catch (error) {
        console.error('Error updating master journals TOC:', error);
        new Notice(`Failed to update master journals TOC: ${error.message}`);
    }
}

function generateYearNoteLinks(state: FormState, dateBlockID: string): string[] {
    const links: string[] = [];
    const year = state.date.split('-')[0];
    const displayDate = formatDisplayDate(state.date);
    
    const mainLink = `>> - [[${year}#${dateBlockID}|${displayDate}]]`;
    links.push(mainLink);
    
    if (state.dreamTitle && state.dreamContent.trim()) {
        const dreamSlug = state.dreamTitle.replace(/\s+/g, '-').toLowerCase();
        const dreamId = state.date.replace(/-/g, '');
        const dreamLink = `>>     - (Dream: [[Journals/Dream Diary/Dream Diary#^${dreamId}-${dreamSlug}|${state.dreamTitle}]])`;
        links.push(dreamLink);
    }
    
    return links;
}

function generateMasterJournalsLink(state: FormState, dateBlockID: string): string {
    const year = state.date.split('-')[0];
    const shortDate = formatShortDate(state.date);
    
    return `>> - [[${year}#${dateBlockID}|${shortDate}]]`;
}

async function insertLinksAtPosition(
    app: App, 
    file: TFile, 
    content: string, 
    insertionPoint: number, 
    links: string[]
): Promise<void> {
    const lines = content.split('\n');
    
    for (let i = links.length - 1; i >= 0; i--) {
        lines.splice(insertionPoint, 0, links[i]);
    }
    
    const newContent = lines.join('\n');
    await app.vault.modify(file, newContent);
}