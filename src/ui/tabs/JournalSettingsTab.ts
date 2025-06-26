
import ChroniclePlugin from '../../main';

export class JournalSettingsTab {
    containerEl: HTMLElement;
    plugin: ChroniclePlugin;

    constructor(containerEl: HTMLElement, plugin: ChroniclePlugin) {
        this.containerEl = containerEl;
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.createEl('h3', { text: 'Journal Settings' });
        // Settings elements will go here
    }

    hide(): void {
        this.containerEl.empty();
    }
}
