import { Setting, ButtonComponent } from 'obsidian';
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
            
            new ButtonComponent(templateActions)
                .setButtonText('Edit')
                .onClick(() => this.editTemplate(template));
                
            new ButtonComponent(templateActions)
                .setButtonText('Delete')
                .setWarning()
                .onClick(() => this.deleteTemplate(template));
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
        // TODO: Implement edit functionality
        console.log('Edit template:', template.name);
    }
    
    private deleteTemplate(template: JournalTemplate): void {
        const index = this.plugin.settings.templates.findIndex(t => t.id === template.id);
        if (index >= 0) {
            this.plugin.settings.templates.splice(index, 1);
            this.plugin.saveSettings().then(() => {
                this.updateTemplatesList();
            });
        }
    }

    display(): void {
        this.contentEl.style.display = 'block';
    }

    hide(): void {
        this.contentEl.style.display = 'none';
    }
}