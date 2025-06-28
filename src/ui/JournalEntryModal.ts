
import { App, Modal } from 'obsidian';
import ScribeFlowPlugin from '../main';
import { JournalEntryTab } from './tabs/JournalEntryTab';
import { JournalSettingsTab } from './tabs/JournalSettingsTab';
import { JournalStructuresTab } from './tabs/JournalStructuresTab';
import { InspirationsTab } from './tabs/InspirationsTab';
import { MetricTab } from './tabs/MetricTab';
import { AVAILABLE_METRICS, JournalTemplate } from '../types';

export class JournalEntryModal extends Modal {
    plugin: ScribeFlowPlugin;
    private activeTab: string = 'entry';
    private tabs: Map<string, any> = new Map();
    private selectedTemplate: JournalTemplate | null = null;

    constructor(app: App, plugin: ScribeFlowPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('sfp-journal-modal');

        const headerEl = contentEl.createDiv('sfp-modal-header');
        const headerContent = headerEl.createDiv('sfp-header-content');
        headerContent.createEl('h2', { text: 'Create ScribeFlow Entry' });
        
        // Templates dropdown
        const templatesContainer = headerEl.createDiv('sfp-templates-container');
        const templatesLabel = templatesContainer.createEl('label', { text: 'Template:' });
        const templatesSelect = templatesContainer.createEl('select', { cls: 'sfp-templates-select' });
        
        // Populate templates dropdown
        this.populateTemplatesDropdown(templatesSelect);
        
        const headerButtons = headerEl.createDiv('sfp-header-buttons');
        const clearButton = headerButtons.createEl('button', {
            text: 'Clear form',
            cls: 'sfp-btn sfp-btn-secondary'
        });
        const insertButton = headerButtons.createEl('button', {
            text: 'Insert entry',
            cls: 'sfp-btn sfp-btn-primary'
        });
        
        // Set initial Insert button state based on templates availability
        this.updateInsertButtonState(insertButton);
        
        // Handle template selection
        templatesSelect.addEventListener('change', () => {
            this.handleTemplateSelection(templatesSelect, insertButton);
        });

        const mainContentEl = contentEl.createDiv('sfp-modal-main-content');

        const navEl = mainContentEl.createDiv('sfp-modal-nav');
        
        // Core tabs
        const entryTab = navEl.createDiv({ text: 'Journal Entry', cls: 'sfp-nav-item sfp-active' });
        const settingsTab = navEl.createDiv({ text: 'Settings', cls: 'sfp-nav-item' });
        const journalStructuresTab = navEl.createDiv({ text: 'Journal Structures', cls: 'sfp-nav-item' });
        
        // Reference section heading
        const referenceHeading = navEl.createDiv({ text: 'Reference', cls: 'sfp-nav-heading' });
        
        // Reference tabs
        const inspirationsTab = navEl.createDiv({ text: 'Inspirations', cls: 'sfp-nav-item' });
        
        // Metric tabs
        const metricTabs: HTMLElement[] = [];
        AVAILABLE_METRICS.forEach(metric => {
            const metricTab = navEl.createDiv({ text: metric.name, cls: 'sfp-nav-item' });
            metricTabs.push(metricTab);
        });

        const contentContainerEl = mainContentEl.createDiv('sfp-modal-content-container');

        const entryTabContent = new JournalEntryTab(contentContainerEl, this.plugin, { clearButton, insertButton }, this);
        const settingsTabContent = new JournalSettingsTab(contentContainerEl, this.plugin);
        const journalStructuresTabContent = new JournalStructuresTab(contentContainerEl, this.plugin);
        const inspirationsTabContent = new InspirationsTab(contentContainerEl, this.plugin);
        
        // Store all tabs
        this.tabs.set('entry', entryTabContent);
        this.tabs.set('settings', settingsTabContent);
        this.tabs.set('journal-structures', journalStructuresTabContent);
        this.tabs.set('inspirations', inspirationsTabContent);
        
        // Create metric tab contents
        AVAILABLE_METRICS.forEach(metric => {
            const metricTabContent = new MetricTab(contentContainerEl, this.plugin, metric.id, metric.name);
            this.tabs.set(metric.id, metricTabContent);
        });

        // Tab click handlers
        const allNavItems = navEl.querySelectorAll('.sfp-nav-item');
        
        entryTab.addEventListener('click', () => this.switchTab('entry', entryTab, allNavItems));
        settingsTab.addEventListener('click', () => this.switchTab('settings', settingsTab, allNavItems));
        journalStructuresTab.addEventListener('click', () => this.switchTab('journal-structures', journalStructuresTab, allNavItems));
        inspirationsTab.addEventListener('click', () => this.switchTab('inspirations', inspirationsTab, allNavItems));
        
        metricTabs.forEach((tab, index) => {
            const metric = AVAILABLE_METRICS[index];
            tab.addEventListener('click', () => this.switchTab(metric.id, tab, allNavItems));
        });

        // Initial display
        entryTabContent.display();
    }
    
    private async switchTab(tabId: string, clickedTab: HTMLElement, allNavItems: NodeListOf<Element>): Promise<void> {
        // Hide all tabs
        this.tabs.forEach(tab => {
            if (tab.hide) tab.hide();
        });
        
        // Remove active class from all nav items
        allNavItems.forEach(item => item.removeClass('sfp-active'));
        
        // Show selected tab and mark nav item as active
        clickedTab.addClass('sfp-active');
        this.activeTab = tabId;
        
        const selectedTab = this.tabs.get(tabId);
        if (selectedTab && selectedTab.display) {
            await selectedTab.display();
        }
    }

    private populateTemplatesDropdown(selectEl: HTMLSelectElement): void {
        selectEl.empty();
        
        const templates = this.plugin.settings.templates;
        
        if (templates.length === 0) {
            const option = selectEl.createEl('option', { text: 'No templates available' });
            option.value = '';
            option.disabled = true;
            option.selected = true;
            return;
        }
        
        // Add first template as default selection
        templates.forEach((template, index) => {
            const option = selectEl.createEl('option', { text: template.name });
            option.value = template.id;
            if (index === 0) {
                option.selected = true;
                this.selectedTemplate = template;
            }
        });
    }

    private updateInsertButtonState(insertButton: HTMLButtonElement): void {
        const hasTemplates = this.plugin.settings.templates.length > 0;
        insertButton.disabled = !hasTemplates;
        
        if (!hasTemplates) {
            insertButton.addClass('sfp-btn-disabled');
            insertButton.title = 'Create templates in Journal Structures tab to enable entry insertion';
        } else {
            insertButton.removeClass('sfp-btn-disabled');
            insertButton.title = '';
        }
    }

    private handleTemplateSelection(selectEl: HTMLSelectElement, insertButton: HTMLButtonElement): void {
        const selectedId = selectEl.value;
        if (selectedId) {
            this.selectedTemplate = this.plugin.settings.templates.find(t => t.id === selectedId) || null;
        } else {
            this.selectedTemplate = null;
        }
        
        this.updateInsertButtonState(insertButton);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
