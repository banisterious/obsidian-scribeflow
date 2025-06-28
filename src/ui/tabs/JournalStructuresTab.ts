import { Setting, ButtonComponent, setIcon } from 'obsidian';
import ScribeFlowPlugin from '../../main';
import { JournalTemplate } from '../../types';
import { TemplateWizardModal } from '../TemplateWizardModal';

export class JournalStructuresTab {
    private containerEl: HTMLElement;
    private plugin: ScribeFlowPlugin;
    private contentEl: HTMLElement;
    private templatesListContainer: HTMLElement;

    constructor(containerEl: HTMLElement, plugin: ScribeFlowPlugin) {
        this.containerEl = containerEl;
        this.plugin = plugin;
        this.contentEl = containerEl.createDiv('sfp-tab-content sfp-journal-structures-tab');
        this.contentEl.style.display = 'none';
        this.render();
    }

    private render(): void {
        this.contentEl.empty();
        
        const title = this.contentEl.createEl('h3', { text: 'Journal Structures & Templates' });
        title.addClass('sfp-tab-title');
        
        // Create main sections
        this.renderTemplatesList();
        this.renderCreateTemplateSection();
    }
    
    private renderTemplatesList(): void {
        const listSection = this.contentEl.createDiv('sfp-templates-list-section');
        listSection.createEl('h4', { text: 'Existing Templates' });
        
        this.templatesListContainer = listSection.createDiv('sfp-templates-list');
        this.updateTemplatesList();
    }
    
    private renderCreateTemplateSection(): void {
        const createSection = this.contentEl.createDiv('sfp-create-template-section');
        createSection.createEl('h4', { text: 'Create New Template' });
        
        // Create Template button
        new Setting(createSection)
            .setName('Create Template')
            .setDesc('Create a new journal template')
            .addButton(button => button
                .setButtonText('Start Template Wizard')
                .setCta()
                .onClick(() => this.openTemplateWizard()));
    }
    
    private updateTemplatesList(): void {
        this.templatesListContainer.empty();
        
        const templates = this.plugin.settings.templates;
        
        if (templates.length === 0) {
            const emptyState = this.templatesListContainer.createDiv('sfp-empty-state');
            emptyState.createEl('p', { text: 'No templates created yet.' });
            emptyState.createEl('p', { text: 'Create your first template using the wizard below.' });
            return;
        }
        
        templates.forEach(template => {
            const templateItem = this.templatesListContainer.createDiv('sfp-template-item');
            
            const templateInfo = templateItem.createDiv('sfp-template-info');
            templateInfo.createEl('h5', { text: template.name });
            if (template.description) {
                templateInfo.createEl('p', { text: template.description, cls: 'sfp-template-description' });
            }
            
            const templateActions = templateItem.createDiv('sfp-template-actions');
            
            // Edit button with icon
            const editButton = new ButtonComponent(templateActions)
                .setTooltip('Edit template')
                .onClick(() => this.editTemplate(template));
            setIcon(editButton.buttonEl, 'edit');
            editButton.buttonEl.addClass('sfp-icon-button');
            
            // Copy button with icon
            const copyButton = new ButtonComponent(templateActions)
                .setTooltip('Copy template')
                .onClick(() => this.copyTemplate(template));
            setIcon(copyButton.buttonEl, 'copy');
            copyButton.buttonEl.addClass('sfp-icon-button');
                
            // Delete button with icon
            const deleteButton = new ButtonComponent(templateActions)
                .setTooltip('Delete template')
                .setWarning()
                .onClick(() => this.deleteTemplate(template));
            setIcon(deleteButton.buttonEl, 'trash-2');
            deleteButton.buttonEl.addClass('sfp-icon-button');
        });
    }
    
    private openTemplateWizard(): void {
        const modal = new TemplateWizardModal(this.plugin.app, this.plugin, () => {
            // Callback to refresh templates list when wizard completes
            this.updateTemplatesList();
        });
        modal.open();
    }
    
    // Template management methods
    private editTemplate(template: JournalTemplate): void {
        const modal = new TemplateWizardModal(this.plugin.app, this.plugin, () => {
            // Callback to refresh templates list when wizard completes
            this.updateTemplatesList();
        });
        
        // Pre-populate the wizard with template data for editing
        modal.setEditMode(template);
        modal.open();
    }
    
    private copyTemplate(template: JournalTemplate): void {
        // Create a copy of the template with a new ID and modified name
        const copiedTemplate: JournalTemplate = {
            id: `template-${Date.now()}`,
            name: `${template.name} (Copy)`,
            content: template.content,
            description: template.description ? `${template.description} (Copy)` : undefined
        };
        
        // Add the copied template to settings
        this.plugin.settings.templates.push(copiedTemplate);
        
        // Save settings and refresh the list
        this.plugin.saveSettings().then(() => {
            this.updateTemplatesList();
        });
    }
    
    private deleteTemplate(template: JournalTemplate): void {
        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete the template "${template.name}"?\n\nThis action cannot be undone.`);
        
        if (confirmed) {
            const index = this.plugin.settings.templates.findIndex(t => t.id === template.id);
            if (index >= 0) {
                this.plugin.settings.templates.splice(index, 1);
                this.plugin.saveSettings().then(() => {
                    this.updateTemplatesList();
                });
            }
        }
    }

    display(): void {
        this.contentEl.style.display = 'block';
    }

    hide(): void {
        this.contentEl.style.display = 'none';
    }
}