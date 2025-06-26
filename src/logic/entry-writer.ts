
import { FormState, ChroniclePluginSettings } from '../types';
import { TFile, App } from 'obsidian';

export async function writeJournalEntry(app: App, settings: ChroniclePluginSettings, state: FormState, editor?: any): Promise<void> {
    const content = generateMarkdown(settings, state);
    
    if (editor) {
        editor.replaceRange(content, editor.getCursor());
    } else {
        const filePath = settings.journalPath;
        let file = app.vault.getAbstractFileByPath(filePath);
        if (!file || !(file instanceof TFile)) {
            file = await app.vault.create(filePath, '');
        }
        await app.vault.append(file as TFile, content);
    }
}

function generateMarkdown(settings: ChroniclePluginSettings, state: FormState): string {
    if (state.activeTemplate === 'A') {
        return generateTemplateA(settings, state);
    } else {
        return generateTemplateB(settings, state);
    }
}

function generateTemplateA(settings: ChroniclePluginSettings, state: FormState): string {
    // ... logic to generate markdown for template A
    return `> [!journal-entry] ${state.date}\n> \n> ${state.journalContent}`;
}

function generateTemplateB(settings: ChroniclePluginSettings, state: FormState): string {
    // ... logic to generate markdown for template B
    return `> [!journal-entry] ${state.date}\n> \n> ### ${state.time}`;
}
