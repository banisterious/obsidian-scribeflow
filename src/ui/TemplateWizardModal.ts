import { App, Modal, Setting, ButtonComponent, setIcon } from 'obsidian';
import ScribeFlowPlugin from '../main';
import { JournalTemplate } from '../types';
import { TemplateIntegrationService, TemplateFile } from '../services/TemplateIntegrationService';

export class TemplateWizardModal extends Modal {
    private plugin: ScribeFlowPlugin;
    private onSuccess: () => void;
    private templateIntegrationService: TemplateIntegrationService;
    
    // Wizard state
    private currentStep: number = 1;
    private totalSteps: number = 3;
    private selectedCreationMethod: 'direct' | 'template' | 'predefined' | null = null;
    private templatePluginSource: 'templater' | 'core' | null = null;
    private selectedTemplateFile: TemplateFile | null = null;
    
    // Template data
    private templateName: string = '';
    private templateDescription: string = '';
    private templateContent: string = '';
    
    // UI elements
    private headerEl: HTMLElement;
    private stepContentEl: HTMLElement;
    private navigationEl: HTMLElement;

    constructor(app: App, plugin: ScribeFlowPlugin, onSuccess: () => void) {
        super(app);
        this.plugin = plugin;
        this.onSuccess = onSuccess;
        this.templateIntegrationService = new TemplateIntegrationService(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('sfp-template-wizard-modal');

        this.buildModal();
        this.renderCurrentStep();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private buildModal(): void {
        const { contentEl } = this;

        // Main container
        const container = contentEl.createDiv('sfp-wizard-container');

        // Header
        this.headerEl = container.createDiv('sfp-wizard-header');
        
        // Content
        this.stepContentEl = container.createDiv('sfp-wizard-content');
        
        // Navigation
        this.navigationEl = container.createDiv('sfp-wizard-navigation');
    }

    private renderCurrentStep(): void {
        this.renderHeader();
        this.renderStepContent();
        this.renderNavigation();
    }

    private renderHeader(): void {
        this.headerEl.empty();

        // Title and subtitle
        const titleContainer = this.headerEl.createDiv('sfp-wizard-title-container');
        titleContainer.createEl('h1', { text: 'Template Creation Wizard', cls: 'sfp-wizard-title' });
        titleContainer.createEl('p', { text: 'Create a new journal template for ScribeFlow', cls: 'sfp-wizard-subtitle' });

        // Progress indicator
        const progressContainer = this.headerEl.createDiv('sfp-progress-container');
        
        const steps = [
            { label: 'Creation Method', icon: 'method' },
            { label: 'Template Info', icon: 'info' },
            { label: 'Content', icon: 'content' }
        ];

        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            const stepEl = progressContainer.createDiv('sfp-progress-step');
            
            // Circle
            const circle = stepEl.createDiv('sfp-progress-circle');
            if (stepNumber < this.currentStep) {
                circle.addClass('sfp-progress-completed');
                circle.innerHTML = '<span class="sfp-progress-check">✓</span>';
            } else if (stepNumber === this.currentStep) {
                circle.addClass('sfp-progress-current');
                circle.textContent = stepNumber.toString();
            } else {
                circle.addClass('sfp-progress-pending');
                circle.textContent = stepNumber.toString();
            }
            
            // Label
            stepEl.createDiv({ text: step.label, cls: 'sfp-progress-label' });
            
            // Line (except for last step)
            if (index < steps.length - 1) {
                const line = progressContainer.createDiv('sfp-progress-line');
                if (stepNumber < this.currentStep) {
                    line.addClass('sfp-progress-line-completed');
                }
            }
        });
    }

    private renderStepContent(): void {
        this.stepContentEl.empty();

        const stepContainer = this.stepContentEl.createDiv('sfp-step-content');

        switch (this.currentStep) {
            case 1:
                this.renderStep1_CreationMethod(stepContainer);
                break;
            case 2:
                this.renderStep2_TemplateInfo(stepContainer);
                break;
            case 3:
                this.renderStep3_Content(stepContainer);
                break;
        }
    }

    private renderStep1_CreationMethod(container: HTMLElement): void {
        container.createEl('h2', { text: 'Choose Creation Method', cls: 'sfp-step-title' });
        container.createEl('p', { text: 'Select how you would like to create your template:', cls: 'sfp-step-description' });

        const methodsGrid = container.createDiv('sfp-method-grid');

        // Direct Input method
        const directCard = this.createMethodCard(
            'edit-3',
            'Direct Input',
            'Create template content manually with helper tools and placeholders',
            'direct'
        );
        methodsGrid.appendChild(directCard);

        // Template Integration method
        const templateCard = this.createMethodCard(
            'zap',
            'Template Integration',
            'Import from Templater or Core Templates plugin',
            'template'
        );
        methodsGrid.appendChild(templateCard);

        // Predefined Structures method
        const predefinedCard = this.createMethodCard(
            'building-2',
            'Predefined Structures',
            'Generate from common journal entry patterns and layouts',
            'predefined'
        );
        methodsGrid.appendChild(predefinedCard);
    }

    private createMethodCard(iconName: string, title: string, description: string, method: string): HTMLElement {
        const card = document.createElement('div');
        card.className = 'sfp-method-card';
        
        if (this.selectedCreationMethod === method) {
            card.addClass('sfp-method-selected');
        }

        // Create icon container
        const iconContainer = card.createDiv('sfp-method-icon');
        setIcon(iconContainer, iconName);

        // Create title
        card.createEl('h3', { text: title, cls: 'sfp-method-title' });

        // Create description
        card.createEl('p', { text: description, cls: 'sfp-method-description' });

        card.addEventListener('click', () => {
            // Remove selection from all cards
            card.parentElement?.querySelectorAll('.sfp-method-card').forEach(c => {
                c.removeClass('sfp-method-selected');
            });
            
            // Select this card
            card.addClass('sfp-method-selected');
            this.selectedCreationMethod = method as 'direct' | 'template' | 'predefined';
            
            // Re-render navigation to update button state
            this.renderNavigation();
        });

        return card;
    }

    private renderStep2_TemplateInfo(container: HTMLElement): void {
        container.createEl('h2', { text: 'Template Information', cls: 'sfp-step-title' });
        container.createEl('p', { text: 'Enter basic information about your template:', cls: 'sfp-step-description' });

        new Setting(container)
            .setName('Template Name')
            .setDesc('A descriptive name for this template')
            .addText(text => text
                .setPlaceholder('My Journal Template')
                .setValue(this.templateName)
                .onChange(value => {
                    this.templateName = value;
                    this.renderNavigation(); // Update button state
                }));

        new Setting(container)
            .setName('Description (Optional)')
            .setDesc('Brief description of what this template is for')
            .addText(text => text
                .setPlaceholder('Template for daily journal entries')
                .setValue(this.templateDescription)
                .onChange(value => this.templateDescription = value));

        // Show method-specific options
        if (this.selectedCreationMethod === 'template') {
            this.renderTemplatePluginSelection(container);
        }
    }

    private renderTemplatePluginSelection(container: HTMLElement): void {
        const sourceSection = container.createDiv('sfp-template-source');
        sourceSection.createEl('h3', { text: 'Template Source', cls: 'sfp-template-source-title' });

        // Check if any template plugins are available
        const availablePlugins = this.templateIntegrationService.getAvailablePlugins();
        const hasAvailablePlugins = availablePlugins.some(plugin => plugin.available);
        
        if (!hasAvailablePlugins) {
            const noPluginsMessage = sourceSection.createDiv('sfp-no-plugins-message');
            noPluginsMessage.createEl('p', { 
                text: 'No template plugins detected. Please install and enable either:', 
                cls: 'sfp-no-plugins-text' 
            });
            const pluginList = noPluginsMessage.createEl('ul', { cls: 'sfp-plugin-list' });
            pluginList.createEl('li', { text: 'Templater plugin for advanced templating' });
            pluginList.createEl('li', { text: 'Core Templates plugin (built into Obsidian)' });
            
            noPluginsMessage.createEl('p', { 
                text: 'After enabling a template plugin, restart this wizard to import templates.', 
                cls: 'sfp-no-plugins-text' 
            });
            return;
        }

        new Setting(sourceSection)
            .setName('Template Plugin')
            .setDesc('Select which plugin to import templates from')
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Select template source...');
                
                // Check for available plugins and add options
                const availablePlugins = this.templateIntegrationService.getAvailablePlugins();
                const hasAvailablePlugins = availablePlugins.some(plugin => plugin.available);
                
                if (this.isTemplaterAvailable()) {
                    dropdown.addOption('templater', 'Templater Plugin');
                }
                if (this.isCoreTemplatesAvailable()) {
                    dropdown.addOption('core', 'Core Templates Plugin');
                }
                
                // Show warning if no plugins are available
                if (!hasAvailablePlugins) {
                    dropdown.addOption('no-plugins', 'No template plugins detected');
                    dropdown.setDisabled(true);
                }
                
                if (this.templatePluginSource) {
                    dropdown.setValue(this.templatePluginSource);
                }
                
                dropdown.onChange(value => {
                    this.templatePluginSource = value as 'templater' | 'core' | null;
                    this.renderCurrentStep(); // Re-render to show plugin-specific options
                });
            });

        // Show plugin-specific template selection
        if (this.templatePluginSource) {
            this.renderTemplateSelection(sourceSection);
        }
    }

    private renderTemplateSelection(container: HTMLElement): void {
        if (!this.templatePluginSource) return;

        const templateSection = container.createDiv('sfp-template-file-selection');
        
        // Dynamic label based on selected plugin
        const pluginDisplayName = this.templatePluginSource === 'templater' ? 'Templater Plugin' : 'Core Templates Plugin';
        
        new Setting(templateSection)
            .setName(`${pluginDisplayName} Template`)
            .setDesc(`Select a template to import from ${pluginDisplayName}`)
            .addDropdown(dropdown => {
                dropdown.addOption('', `Select ${this.templatePluginSource === 'templater' ? 'Templater' : 'Core Templates'} template...`);
                
                // Load templates asynchronously
                this.loadTemplateOptions(dropdown);
                
                dropdown.onChange(async (value) => {
                    if (value) {
                        await this.handleTemplateFileSelection(value);
                    }
                });
            });
    }

    private async loadTemplateOptions(dropdown: any): Promise<void> {
        if (!this.templatePluginSource) return;

        try {
            const templates = await this.templateIntegrationService.getTemplatesFromPlugin(this.templatePluginSource);
            
            // Clear existing options except the first one
            while (dropdown.selectEl.options.length > 1) {
                dropdown.selectEl.remove(1);
            }
            
            if (templates.length === 0) {
                const pluginName = this.templatePluginSource === 'templater' ? 'Templater' : 'Core Templates';
                dropdown.addOption('no-templates', `No ${pluginName} templates found`);
                dropdown.setDisabled(true);
            } else {
                dropdown.setDisabled(false);
                templates.forEach(template => {
                    dropdown.addOption(template.path, template.name);
                });
            }
        } catch (error) {
            console.error('Error loading template options:', error);
            dropdown.addOption('error', 'Error loading templates');
            dropdown.setDisabled(true);
        }
    }

    private async handleTemplateFileSelection(templatePath: string): Promise<void> {
        if (!this.templatePluginSource) return;

        try {
            const templates = await this.templateIntegrationService.getTemplatesFromPlugin(this.templatePluginSource);
            const selectedTemplate = templates.find(t => t.path === templatePath);
            
            if (selectedTemplate) {
                this.selectedTemplateFile = selectedTemplate;
                
                // Set template name if not already set
                if (!this.templateName.trim()) {
                    this.templateName = selectedTemplate.name;
                }
                
                // Store original content for conversion summary
                const originalContent = selectedTemplate.content;
                
                // Process template content based on plugin type
                if (this.templatePluginSource === 'templater') {
                    // Convert Templater syntax to static placeholders
                    this.templateContent = this.templateIntegrationService.processTemplaterToStatic(originalContent);
                } else {
                    // Core Templates use simpler syntax
                    this.templateContent = originalContent;
                }
                
                // Re-render navigation to update button state
                this.renderNavigation();
            }
        } catch (error) {
            console.error('Error handling template selection:', error);
        }
    }

    private renderStep3_Content(container: HTMLElement): void {
        container.createEl('h2', { text: 'Template Content', cls: 'sfp-step-title' });

        if (this.selectedCreationMethod === 'direct') {
            this.renderDirectInputContent(container);
        } else if (this.selectedCreationMethod === 'template') {
            this.renderTemplateImportContent(container);
        } else if (this.selectedCreationMethod === 'predefined') {
            this.renderPredefinedStructureContent(container);
        }
    }

    private renderDirectInputContent(container: HTMLElement): void {
        container.createEl('p', { text: 'Create your template content manually:', cls: 'sfp-step-description' });

        // Helper tools
        const helpersContainer = container.createDiv('sfp-helper-tools');
        helpersContainer.createEl('h3', { text: 'Helper Tools', cls: 'sfp-helper-title' });

        const buttonsContainer = helpersContainer.createDiv('sfp-helper-buttons');

        new ButtonComponent(buttonsContainer)
            .setButtonText('Insert Sample Entry')
            .onClick(() => this.insertSampleContent());

        new ButtonComponent(buttonsContainer)
            .setButtonText('Insert Callout')
            .onClick(() => this.insertCallout());

        new ButtonComponent(buttonsContainer)
            .setButtonText('Insert Placeholder')
            .onClick(() => this.insertPlaceholder());

        // Content textarea
        new Setting(container)
            .setName('Template Content')
            .setDesc('Enter your template content using Markdown and callouts')
            .addTextArea(textarea => {
                textarea
                    .setPlaceholder('# {{date}} Journal Entry\n\n> [!journal-entry]\n> {{content}}\n\n> [!dream-diary]\n> {{dream-content}}')
                    .setValue(this.templateContent)
                    .onChange(value => {
                        this.templateContent = value;
                        this.renderNavigation(); // Update button state
                    });

                // Make textarea larger
                textarea.inputEl.rows = 12;
                textarea.inputEl.addClass('sfp-template-content-area');
            });
    }

    private renderTemplateImportContent(container: HTMLElement): void {
        if (!this.templateContent) {
            container.createEl('p', { 
                text: 'Please select a template from the previous step to import content.', 
                cls: 'sfp-step-description' 
            });
            return;
        }

        container.createEl('p', { 
            text: 'Review and customize the imported template content:', 
            cls: 'sfp-step-description' 
        });

        // Show imported template info
        if (this.selectedTemplateFile) {
            const infoContainer = container.createDiv('sfp-template-info');
            infoContainer.createEl('h3', { text: 'Imported Template', cls: 'sfp-preview-title' });
            infoContainer.createEl('p', { 
                text: `Source: ${this.selectedTemplateFile.name} (${this.templatePluginSource})`, 
                cls: 'sfp-template-source-info' 
            });
        }

        // Editable content area
        new Setting(container)
            .setName('Template Content')
            .setDesc('You can edit the imported content or use it as-is')
            .addTextArea(textarea => {
                textarea
                    .setValue(this.templateContent)
                    .onChange(value => {
                        this.templateContent = value;
                        this.renderNavigation(); // Update button state
                    });

                // Make textarea larger and more suitable for editing
                textarea.inputEl.rows = 15;
                textarea.inputEl.addClass('sfp-template-content-area');
            });

        // Show conversion info if from Templater and there was original content
        if (this.templatePluginSource === 'templater' && this.selectedTemplateFile) {
            const originalContent = this.selectedTemplateFile.content;
            const conversions = this.templateIntegrationService.getTemplaterConversionSummary(originalContent);
            
            if (conversions.length > 0) {
                const conversionInfo = container.createDiv('sfp-conversion-info');
                conversionInfo.createEl('h4', { text: 'Templater Conversion', cls: 'sfp-conversion-title' });
                conversionInfo.createEl('p', { 
                    text: 'The following Templater syntax was converted to ScribeFlow placeholders:', 
                    cls: 'sfp-conversion-description' 
                });
                
                const conversionList = conversionInfo.createEl('ul', { cls: 'sfp-conversion-list' });
                conversions.forEach(conversion => {
                    conversionList.createEl('li', { text: conversion });
                });
                
                // Add note about editing
                conversionInfo.createEl('p', { 
                    text: 'You can edit the content above to customize placeholders or add ScribeFlow-specific features like callouts.', 
                    cls: 'sfp-conversion-description' 
                });
            }
        }
    }

    private renderPredefinedStructureContent(container: HTMLElement): void {
        container.createEl('p', { text: 'Select a predefined structure to generate template content:', cls: 'sfp-step-description' });

        // Placeholder for now
        const placeholder = container.createDiv('sfp-predefined-placeholder');
        placeholder.createEl('p', { 
            text: 'Predefined structure selection will be implemented next.',
            cls: 'sfp-placeholder-text'
        });
    }

    private renderNavigation(): void {
        this.navigationEl.empty();

        const leftButtons = this.navigationEl.createDiv('sfp-nav-left');
        const stepIndicator = this.navigationEl.createDiv('sfp-step-indicator');
        const rightButtons = this.navigationEl.createDiv('sfp-nav-right');

        // Back button
        if (this.currentStep > 1) {
            new ButtonComponent(leftButtons)
                .setButtonText('Back')
                .onClick(() => {
                    this.currentStep--;
                    this.renderCurrentStep();
                });
        }

        // Cancel button
        new ButtonComponent(leftButtons)
            .setButtonText('Cancel')
            .onClick(() => this.close());

        // Step indicator
        stepIndicator.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;

        // Next/Finish button
        const isLastStep = this.currentStep === this.totalSteps;
        const canProceed = this.validateCurrentStep();
        
        const nextButton = new ButtonComponent(rightButtons)
            .setButtonText(isLastStep ? 'Create Template' : 'Next')
            .setCta()
            .setDisabled(!canProceed);

        nextButton.onClick(() => {
            if (isLastStep) {
                this.finishWizard();
            } else {
                this.currentStep++;
                this.renderCurrentStep();
            }
        });
    }

    private validateCurrentStep(): boolean {
        switch (this.currentStep) {
            case 1:
                return this.selectedCreationMethod !== null;
            case 2:
                return this.templateName.trim() !== '';
            case 3:
                return this.templateContent.trim() !== '';
            default:
                return false;
        }
    }

    private finishWizard(): void {
        if (!this.validateCurrentStep()) {
            return;
        }

        const template: JournalTemplate = {
            id: `template-${Date.now()}`,
            name: this.templateName,
            content: this.templateContent,
            description: this.templateDescription || undefined
        };

        // Add to settings
        this.plugin.settings.templates.push(template);

        // Save settings
        this.plugin.saveSettings().then(() => {
            this.close();
            this.onSuccess(); // Refresh the templates list in the tab
        });
    }

    // Helper methods for template integration
    private isTemplaterAvailable(): boolean {
        return this.templateIntegrationService.isTemplaterAvailable();
    }

    private isCoreTemplatesAvailable(): boolean {
        return this.templateIntegrationService.isCoreTemplatesAvailable();
    }

    // Helper methods for content insertion
    private insertSampleContent(): void {
        const sample = `# {{date}} Journal Entry

> [!journal-entry]
> {{content}}

> [!dream-diary]
> {{dream-content}}`;

        this.templateContent = sample;
        this.renderCurrentStep();
    }

    private insertCallout(): void {
        const callout = '\n\n> [!callout-name]\n> Callout content here';
        this.templateContent += callout;
        this.renderCurrentStep();
    }

    private insertPlaceholder(): void {
        const placeholder = '{{placeholder}}';
        this.templateContent += placeholder;
        this.renderCurrentStep();
    }
}