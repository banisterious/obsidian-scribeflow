
import { Plugin } from 'obsidian';
import { JournalEntryModal } from './ui/JournalEntryModal';
import { ScribeFlowPluginSettings, FormState } from './types';
import { DEFAULT_SETTINGS, ScribeFlowSettingTab } from './settings';
import { loadDraft, saveDraft } from './logic/draft-manager';

export default class ScribeFlowPlugin extends Plugin {
    settings: ScribeFlowPluginSettings;
    draft: FormState | null = null;

    async onload() {
        await this.loadSettings();
        this.draft = await loadDraft(this);

        this.addCommand({
            id: 'open-scribeflow-entry-modal',
            name: 'Create ScribeFlow Entry',
            callback: () => {
                new JournalEntryModal(this.app, this).open();
            },
        });

        this.addSettingTab(new ScribeFlowSettingTab(this.app, this));

        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu, editor, view) => {
                menu.addItem((item) => {
                    item
                        .setTitle('ScribeFlow: insert journal entry')
                        .setIcon('calendar-plus')
                        .onClick(() => {
                            new JournalEntryModal(this.app, this).open();
                        });
                });
            })
        );
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
