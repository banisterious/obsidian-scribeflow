
import ChroniclePlugin from '../../main';

export class JournalEntryTab {
    containerEl: HTMLElement;
    plugin: ChroniclePlugin;

    constructor(containerEl: HTMLElement, plugin: ChroniclePlugin) {
        this.containerEl = containerEl;
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.createEl('h3', { text: 'Journal Entry' });
        // Form elements will go here
    }

    hide(): void {
        this.containerEl.empty();
    }
}
