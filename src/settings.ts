
import { App, PluginSettingTab, Setting } from 'obsidian';
import { ScribeFlowPluginSettings, AVAILABLE_METRICS, AVAILABLE_IMAGE_TYPES } from './types';
import ScribeFlowPlugin from './main';
import { FolderSuggest } from './ui/FolderSuggest';

export const DEFAULT_SETTINGS: ScribeFlowPluginSettings = {
    calloutNames: {
        journalEntry: 'journal-entry',
        dreamDiary: 'dream-diary'
    },
    imageFolderPath: '',
    allowedImageTypes: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'], // Default common image types
    selectedMetrics: AVAILABLE_METRICS.slice(0, 5) // Default selection, users can add more
};

export class ScribeFlowSettingTab extends PluginSettingTab {
    plugin: ScribeFlowPlugin;
    private imageTypesContainer: HTMLElement;

    constructor(app: App, plugin: ScribeFlowPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        
        this.createCalloutNamesSettings(containerEl);
        this.createImageFolderSettings(containerEl);
        this.createMetricsSettings(containerEl);
    }

    private createCalloutNamesSettings(containerEl: HTMLElement): void {
        const heading = containerEl.createDiv('setting-item setting-item-heading');
        const info = heading.createDiv('setting-item-info');
        info.createDiv({ text: 'Callout names', cls: 'setting-item-name' });
        info.createDiv({ text: '', cls: 'setting-item-description' });
        heading.createDiv('setting-item-control');
        
        new Setting(containerEl)
            .setName('Journal entry callout')
            .setDesc('The name used for journal entry callouts in the markdown output')
            .addText(text => text
                .setPlaceholder('journal-entry')
                .setValue(this.plugin.settings.calloutNames.journalEntry)
                .onChange(async (value) => {
                    this.plugin.settings.calloutNames.journalEntry = value || 'journal-entry';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Dream diary callout')
            .setDesc('The name used for dream diary callouts in the markdown output')
            .addText(text => text
                .setPlaceholder('dream-diary')
                .setValue(this.plugin.settings.calloutNames.dreamDiary)
                .onChange(async (value) => {
                    this.plugin.settings.calloutNames.dreamDiary = value || 'dream-diary';
                    await this.plugin.saveSettings();
                }));
    }

    private createImageFolderSettings(containerEl: HTMLElement): void {
        const heading = containerEl.createDiv('setting-item setting-item-heading');
        const info = heading.createDiv('setting-item-info');
        info.createDiv({ text: 'Image settings', cls: 'setting-item-name' });
        info.createDiv({ text: '', cls: 'setting-item-description' });
        heading.createDiv('setting-item-control');
        
        new Setting(containerEl)
            .setName('Default image folder')
            .setDesc('Default folder to show when selecting images (leave empty for vault root)')
            .addText(text => {
                text
                    .setPlaceholder('attachments/images')
                    .setValue(this.plugin.settings.imageFolderPath)
                    .onChange(async (value) => {
                        this.plugin.settings.imageFolderPath = value;
                        await this.plugin.saveSettings();
                    });

                new FolderSuggest(this.app, text.inputEl);
            });

        new Setting(containerEl)
            .setName('Allowed image file types')
            .setDesc('Select which image file types to show in the image picker')
            .addDropdown(dropdown => {
                // Create a multi-select like interface using a description area
                dropdown.addOption('', 'Click to manage file types...');
                dropdown.onChange(() => {
                    // This will open the management interface
                    this.showImageTypesManager();
                });
            });

        // Create a dedicated container for the image types manager within this section
        this.imageTypesContainer = containerEl.createDiv('sfp-image-types-container');
        this.renderImageTypesSelection();
    }

    private showImageTypesManager(): void {
        // Remove any existing manager
        const existing = this.imageTypesContainer.querySelector('.sfp-image-types-manager');
        if (existing) {
            existing.remove();
            return;
        }

        this.renderImageTypesSelection();
    }

    private renderImageTypesSelection(): void {
        // Remove existing selection if any
        const existingManager = this.imageTypesContainer.querySelector('.sfp-image-types-manager');
        if (existingManager) {
            existingManager.remove();
        }

        const manager = this.imageTypesContainer.createDiv('sfp-image-types-manager');
        
        const selectedSection = manager.createDiv();
        selectedSection.createEl('h6', { text: 'Selected file types', cls: 'sfp-section-header-first' });
        
        const selectedList = selectedSection.createDiv('sfp-selected-types');
        this.plugin.settings.allowedImageTypes.forEach((type, index) => {
            const typeInfo = AVAILABLE_IMAGE_TYPES.find(t => t.extension === type);
            if (typeInfo) {
                const item = selectedList.createDiv('sfp-type-item');
                
                const name = item.createDiv('sfp-type-name');
                name.textContent = typeInfo.label;
                
                const removeBtn = item.createEl('button', { text: '×', cls: 'sfp-remove-btn' });
                removeBtn.addEventListener('click', async () => {
                    this.plugin.settings.allowedImageTypes.splice(index, 1);
                    await this.plugin.saveSettings();
                    this.renderImageTypesSelection();
                });
            }
        });

        // Available types section
        const selectedTypes = new Set(this.plugin.settings.allowedImageTypes);
        const availableTypes = AVAILABLE_IMAGE_TYPES.filter(t => !selectedTypes.has(t.extension));
        
        if (availableTypes.length > 0) {
            const availableSection = manager.createDiv();
            availableSection.createEl('h6', { text: 'Available file types', cls: 'sfp-section-header' });
            
            const availableList = availableSection.createDiv('sfp-available-types');
            availableTypes.forEach(type => {
                const item = availableList.createDiv('sfp-type-item');
                
                const name = item.createDiv('sfp-type-name');
                name.textContent = type.label;
                
                item.createEl('button', { text: '+', cls: 'sfp-add-btn' });
                
                item.addEventListener('click', async () => {
                    this.plugin.settings.allowedImageTypes.push(type.extension);
                    await this.plugin.saveSettings();
                    this.renderImageTypesSelection();
                });
            });
        }
    }

    private createMetricsSettings(containerEl: HTMLElement): void {
        const heading = containerEl.createDiv('setting-item setting-item-heading');
        const info = heading.createDiv('setting-item-info');
        info.createDiv({ text: 'Dream metrics', cls: 'setting-item-name' });
        info.createDiv({ text: '', cls: 'setting-item-description' });
        heading.createDiv('setting-item-control');
        
        const desc = containerEl.createDiv();
        desc.createEl('p', { text: 'Select metrics to include in your dream entries. Drag to reorder.' });
        
        const metricsContainer = containerEl.createDiv('sfp-metrics-container');
        
        this.renderMetricsSelection(metricsContainer);
    }

    private renderMetricsSelection(container: HTMLElement): void {
        container.empty();
        
        // Selected metrics section
        const selectedSection = container.createDiv();
        selectedSection.createEl('h4', { text: 'Selected metrics' });
        
        const selectedList = selectedSection.createDiv('sfp-selected-metrics');
        this.plugin.settings.selectedMetrics.forEach((metric, index) => {
            const item = selectedList.createDiv('sfp-metric-item');
            
            const handle = item.createDiv('sfp-drag-handle');
            handle.textContent = '⋮⋮';
            
            const name = item.createDiv('sfp-metric-name');
            name.textContent = metric.name;
            
            const desc = item.createDiv('sfp-metric-desc');
            desc.textContent = metric.description;
            
            const removeBtn = item.createEl('button', { text: '×', cls: 'sfp-remove-btn' });
            removeBtn.addEventListener('click', async () => {
                this.plugin.settings.selectedMetrics.splice(index, 1);
                await this.plugin.saveSettings();
                this.renderMetricsSelection(container);
            });
        });
        
        // Available metrics section
        const selectedIds = new Set(this.plugin.settings.selectedMetrics.map(m => m.id));
        const availableMetrics = AVAILABLE_METRICS.filter(m => !selectedIds.has(m.id));
        
        if (availableMetrics.length > 0) {
            const availableSection = container.createDiv();
            availableSection.createEl('h4', { text: 'Available metrics' });
            
            
            const availableList = availableSection.createDiv('sfp-available-metrics');
            availableMetrics.forEach(metric => {
                const item = availableList.createDiv('sfp-metric-item');
                
                
                const name = item.createDiv('sfp-metric-name');
                name.textContent = metric.name;
                
                const desc = item.createDiv('sfp-metric-desc');
                desc.textContent = metric.description;
                
                item.createEl('button', { text: '+', cls: 'sfp-add-btn' });
                
                item.addEventListener('click', async () => {
                    this.plugin.settings.selectedMetrics.push(metric);
                    await this.plugin.saveSettings();
                    this.renderMetricsSelection(container);
                });
            });
        }
    }
}
