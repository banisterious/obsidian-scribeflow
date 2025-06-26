
import { App, PluginSettingTab, Setting } from 'obsidian';
import { ChroniclePluginSettings } from './types';
import ChroniclePlugin from './main';

export const DEFAULT_SETTINGS: ChroniclePluginSettings = {
    journalPath: 'Journal.md',
    templateA_ImagePath: '',
    templateA_ImageWidth: 400,
    templateB_ImagePath: '',
    templateB_ImageWidth: 400,
};

export class ChronicleSettingTab extends PluginSettingTab {
    plugin: ChroniclePlugin;

    constructor(app: App, plugin: ChroniclePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Chronicle Plugin Settings' });

        new Setting(containerEl)
            .setName('Journal File Path')
            .setDesc('The path to your main journal file.')
            .addText(text => text
                .setPlaceholder('Journal.md')
                .setValue(this.plugin.settings.journalPath)
                .onChange(async (value) => {
                    this.plugin.settings.journalPath = value;
                    await this.plugin.saveSettings();
                }));
    }
}
