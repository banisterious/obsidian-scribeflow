
import { Plugin } from 'obsidian';
import { JournalEntryModal } from './ui/JournalEntryModal';
import { ChroniclePluginSettings, FormState } from './types';
import { DEFAULT_SETTINGS, ChronicleSettingTab } from './settings';
import { loadDraft, saveDraft } from './logic/draft-manager';

export default class ChroniclePlugin extends Plugin {
    settings: ChroniclePluginSettings;
    draft: FormState | null = null;

    async onload() {
        await this.loadSettings();
        this.draft = await loadDraft(this);

        this.addCommand({
            id: 'open-chronicle-entry-modal',
            name: 'Create Chronicle Entry',
            callback: () => {
                new JournalEntryModal(this.app, this).open();
            },
        });

        this.addSettingTab(new ChronicleSettingTab(this.app, this));
    }

    async onunload() {
        if (this.draft) {
            await saveDraft(this, this.draft);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
