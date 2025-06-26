
import { App, Modal } from 'obsidian';
import ChroniclePlugin from '../main';
import { JournalEntryTab } from './tabs/JournalEntryTab';
import { JournalSettingsTab } from './tabs/JournalSettingsTab';

export class JournalEntryModal extends Modal {
    plugin: ChroniclePlugin;
    private activeTab: 'entry' | 'settings' = 'entry';

    constructor(app: App, plugin: ChroniclePlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('journal-modal');

        const headerEl = contentEl.createDiv('modal-header');
        headerEl.createEl('h2', { text: 'Create Chronicle Entry' });

        const mainContentEl = contentEl.createDiv('modal-main-content');

        const navEl = mainContentEl.createDiv('modal-nav');
        const entryTab = navEl.createDiv({ text: 'Journal Entry', cls: 'nav-item active' });
        const settingsTab = navEl.createDiv({ text: 'Journal Settings', cls: 'nav-item' });

        const contentContainerEl = mainContentEl.createDiv('modal-content-container');

        const entryTabContent = new JournalEntryTab(contentContainerEl, this.plugin);
        const settingsTabContent = new JournalSettingsTab(contentContainerEl, this.plugin);

        entryTab.addEventListener('click', () => {
            this.activeTab = 'entry';
            entryTab.addClass('active');
            settingsTab.removeClass('active');
            entryTabContent.display();
            settingsTabContent.hide();
        });

        settingsTab.addEventListener('click', () => {
            this.activeTab = 'settings';
            settingsTab.addClass('active');
            entryTab.removeClass('active');
            settingsTabContent.display();
            entryTabContent.hide();
        });

        // Initial display
        entryTabContent.display();
        settingsTabContent.hide();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
