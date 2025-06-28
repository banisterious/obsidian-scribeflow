import { Notice, TFile, Modal } from 'obsidian';
import ScribeFlowPlugin from '../../main';
import { FormState, MetricDefinition } from '../../types';

export class JournalEntryTab {
    containerEl: HTMLElement;
    plugin: ScribeFlowPlugin;
    formState: FormState;
    private journalImagePreview: HTMLElement | null = null;
    private dreamImagePreview: HTMLElement | null = null;
    private clearButton?: HTMLButtonElement;
    private insertButton?: HTMLButtonElement;

    constructor(containerEl: HTMLElement, plugin: ScribeFlowPlugin, buttons?: { clearButton: HTMLButtonElement, insertButton: HTMLButtonElement }) {
        this.containerEl = containerEl;
        this.plugin = plugin;
        this.clearButton = buttons?.clearButton;
        this.insertButton = buttons?.insertButton;
        
        // Initialize form state with defaults or load from draft
        const defaultMetrics: Record<string, number | string> = {};
        this.plugin.settings.selectedMetrics.forEach(metric => {
            if (metric.type === 'score' || metric.type === 'number') {
                defaultMetrics[metric.id] = metric.min || 1;
            } else {
                defaultMetrics[metric.id] = '';
            }
        });
        
        // Use draft if available, otherwise use defaults
        const today = new Date();
        // Use local date instead of UTC to avoid timezone issues
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        const timeString = today.toTimeString().slice(0, 5);
        
        if (this.plugin.draft) {
            this.formState = { ...this.plugin.draft };
            // Update metrics in case settings changed
            this.plugin.settings.selectedMetrics.forEach(metric => {
                if (this.formState.metrics[metric.id] === undefined) {
                    if (metric.type === 'score' || metric.type === 'number') {
                        this.formState.metrics[metric.id] = metric.min || 1;
                    } else {
                        this.formState.metrics[metric.id] = '';
                    }
                }
            });
        } else {
            this.formState = {
                date: todayString,
                time: timeString,
                journalContent: '',
                journalImagePath: '',
                journalImageWidth: 400,
                dreamTitle: '',
                dreamContent: '',
                dreamImagePath: '',
                dreamImageWidth: 400,
                metrics: defaultMetrics,
            };
        }
    }

    display(): void {
        this.containerEl.empty();
        this.renderFormElements(this.containerEl);
    }

    private renderFormElements(container: HTMLElement): void {
        // Add modern Material Design styles
        this.addModernStyles();

        // Date and Time - horizontal layout
        const dateTimeRow = container.createDiv('sfp-field-row');
        
        const dateField = dateTimeRow.createDiv('sfp-field sfp-field-half');
        dateField.createEl('label', { text: 'Date', cls: 'sfp-field-label' });
        const dateInput = dateField.createEl('input', {
            type: 'date',
            cls: 'sfp-field-input',
            value: this.formState.date
        });
        dateInput.addEventListener('change', (e) => {
            this.formState.date = (e.target as HTMLInputElement).value;
        });
        
        const timeField = dateTimeRow.createDiv('sfp-field sfp-field-half');
        timeField.createEl('label', { text: 'Time', cls: 'sfp-field-label' });
        const timeInput = timeField.createEl('input', {
            type: 'time',
            cls: 'sfp-field-input',
            value: this.formState.time
        });
        timeInput.addEventListener('change', (e) => {
            this.formState.time = (e.target as HTMLInputElement).value;
        });

        // Journal Content with Preview
        const journalContentSection = container.createDiv('sfp-content-section');
        
        const journalContentContainer = journalContentSection.createDiv('sfp-content-form');
        const journalField = journalContentContainer.createDiv('sfp-field');
        journalField.createEl('label', { text: 'Journal entry', cls: 'sfp-field-label' });
        const journalTextarea = journalField.createEl('textarea', {
            cls: 'sfp-field-input sfp-textarea',
            placeholder: 'Write your journal entry here...'
        });
        journalTextarea.value = this.formState.journalContent;
        journalTextarea.addEventListener('input', (e) => {
            this.formState.journalContent = (e.target as HTMLTextAreaElement).value;
        });
        
        this.journalImagePreview = journalContentSection.createDiv('sfp-preview-container');
        
        
        this.journalImagePreview.addEventListener('click', () => {
            this.openImageSelector('journal');
        });
        
        this.createPreviewContent(this.journalImagePreview, 'journal');
        
        // Add resize observer for journal preview
        this.setupResizeObserver(this.journalImagePreview, journalContentContainer);


        // Dream Section
        const dreamTitleField = container.createDiv('sfp-field');
        dreamTitleField.createEl('label', { text: 'Dream title', cls: 'sfp-field-label' });
        const dreamTitleInput = dreamTitleField.createEl('input', {
            type: 'text',
            cls: 'sfp-field-input',
            placeholder: 'Title for your dream...',
            value: this.formState.dreamTitle
        });
        dreamTitleInput.addEventListener('input', (e) => {
            this.formState.dreamTitle = (e.target as HTMLInputElement).value;
        });

        // Dream Content with Preview
        const dreamContentSection = container.createDiv('sfp-content-section');
        
        const dreamContentContainer = dreamContentSection.createDiv('sfp-content-form');
        const dreamField = dreamContentContainer.createDiv('sfp-field');
        dreamField.createEl('label', { text: 'Dream content', cls: 'sfp-field-label' });
        const dreamTextarea = dreamField.createEl('textarea', {
            cls: 'sfp-field-input sfp-textarea',
            placeholder: 'Describe your dream here...'
        });
        dreamTextarea.style.minHeight = '100px';
        dreamTextarea.value = this.formState.dreamContent;
        dreamTextarea.addEventListener('input', (e) => {
            this.formState.dreamContent = (e.target as HTMLTextAreaElement).value;
        });
        
        this.dreamImagePreview = dreamContentSection.createDiv('sfp-preview-container');
        
        
        this.dreamImagePreview.addEventListener('click', () => {
            this.openImageSelector('dream');
        });
        
        this.createPreviewContent(this.dreamImagePreview, 'dream');
        
        // Add resize observer for dream preview
        this.setupResizeObserver(this.dreamImagePreview, dreamContentContainer);


        // Metrics Section
        container.createEl('h3', { text: 'Dream metrics', cls: 'sfp-section-title' });
        
        const metricsGrid = container.createDiv('sfp-metrics-grid');
        this.plugin.settings.selectedMetrics.forEach(metric => {
            this.createModernMetricField(metricsGrid, metric.name, metric.description, metric);
        });

        // Setup button event listeners if buttons are provided
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.clearForm();
            });
        }
        
        if (this.insertButton) {
            this.insertButton.addEventListener('click', () => {
                this.insertEntry();
            });
        }
        
        // Update previews for any existing image paths
        if (this.formState.journalImagePath) {
            this.updateImagePreview('journal', this.formState.journalImagePath);
        }
        if (this.formState.dreamImagePath) {
            this.updateImagePreview('dream', this.formState.dreamImagePath);
        }
    }

    private addModernStyles(): void {
        if (document.querySelector('#scribeflow-modern-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'scribeflow-modern-styles';
        style.textContent = `
            .sfp-field-row {
                display: flex;
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .sfp-field {
                position: relative;
                flex: 1;
                margin-bottom: 24px;
            }
            
            .sfp-field-half {
                flex: 0.5;
            }
            
            .sfp-field-label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-muted);
                margin-bottom: 8px;
                transition: color 0.2s ease;
            }
            
            .sfp-field-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--background-modifier-border);
                border-radius: 8px;
                font-size: 16px;
                background: var(--background-primary);
                color: var(--text-normal);
                transition: all 0.3s ease;
                outline: none;
                box-sizing: border-box;
            }
            
            .sfp-field-input:focus {
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 3px var(--interactive-accent-hover);
            }
            
            .sfp-field-input::placeholder {
                color: var(--text-faint);
            }
            
            .sfp-textarea {
                min-height: 120px;
                resize: both;
                font-family: inherit;
            }
            
            .sfp-content-section {
                display: flex;
                gap: 20px;
                align-items: flex-start;
                margin-bottom: 24px;
            }
            
            .sfp-content-form {
                flex: 1;
                min-width: 0;
            }
            
            .sfp-preview-container {
                width: 200px;
                flex-shrink: 1;
                border: 2px dashed var(--background-modifier-border);
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                background: var(--background-secondary);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                resize: both;
                overflow: auto;
                min-width: 150px;
                max-width: 800px;
                min-height: 100px;
                max-height: 600px;
            }
            
            .sfp-preview-container:hover {
                border-color: var(--interactive-accent);
                background: var(--background-modifier-hover);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px var(--background-modifier-box-shadow);
            }
            
            .sfp-section-title {
                font-size: 18px;
                font-weight: 500;
                color: var(--text-normal);
                margin: 32px 0 16px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid var(--background-modifier-border);
            }
            
            .sfp-metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 24px;
            }
            
            .sfp-metric-field {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px;
                background: var(--background-secondary);
                border-radius: 8px;
                border: 1px solid var(--background-modifier-border);
            }
            
            .sfp-metric-info {
                flex: 1;
            }
            
            .sfp-metric-label {
                font-weight: 500;
                color: var(--text-normal);
                margin-bottom: 2px;
            }
            
            .sfp-metric-desc {
                font-size: 12px;
                color: var(--text-muted);
            }
            
            .sfp-metric-slider {
                flex: 0 0 120px;
                height: 6px;
                background: var(--background-modifier-border);
                border-radius: 3px;
                position: relative;
                cursor: pointer;
            }
            
            .sfp-metric-slider::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                background: var(--interactive-accent);
                border-radius: 3px;
                transition: width 0.2s ease;
            }
            
            .sfp-metric-value {
                flex: 0 0 30px;
                text-align: center;
                font-weight: 500;
                color: var(--interactive-accent);
            }
            
            .sfp-button-container {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid var(--background-modifier-border);
            }
            
            .sfp-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                outline: none;
            }
            
            .sfp-btn-primary {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
            }
            
            .sfp-btn-primary:hover {
                background: var(--interactive-accent-hover);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px var(--background-modifier-box-shadow);
            }
            
            .sfp-btn-secondary {
                background: var(--background-primary);
                color: var(--text-muted);
                border: 2px solid var(--background-modifier-border);
            }
            
            .sfp-btn-secondary:hover {
                background: var(--background-secondary);
                border-color: var(--background-modifier-border-hover);
            }
        `;
        document.head.appendChild(style);
    }
    
    private createModernMetricField(container: HTMLElement, name: string, desc: string, metric: MetricDefinition): void {
        const metricField = container.createDiv('sfp-metric-field');
        
        const metricInfo = metricField.createDiv('sfp-metric-info');
        metricInfo.createDiv({ text: name, cls: 'sfp-metric-label' });
        metricInfo.createDiv({ text: desc, cls: 'sfp-metric-desc' });
        
        if (metric.type === 'score') {
            // Score metrics use sliders
            const metricSlider = metricField.createDiv('sfp-metric-slider');
            const currentValue = this.formState.metrics[metric.id] as number || metric.min || 1;
            const range = (metric.max || 10) - (metric.min || 1);
            
            const sliderFill = document.createElement('div');
            sliderFill.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                width: ${((currentValue - (metric.min || 1)) / range) * 100}%;
                background: var(--interactive-accent);
                border-radius: 3px;
                transition: width 0.2s ease;
            `;
            metricSlider.appendChild(sliderFill);
            
            const metricValue = metricField.createDiv({ text: currentValue.toString(), cls: 'sfp-metric-value' });
            
            metricSlider.addEventListener('click', (e) => {
                const rect = metricSlider.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, x / rect.width));
                const value = Math.round(percentage * range) + (metric.min || 1);
                this.formState.metrics[metric.id] = value;
                sliderFill.style.width = `${((value - (metric.min || 1)) / range) * 100}%`;
                metricValue.textContent = value.toString();
            });
        } else if (metric.type === 'number') {
            // Number metrics use input fields
            const numberInput = metricField.createEl('input', {
                type: 'number',
                cls: 'sfp-metric-input',
                value: this.formState.metrics[metric.id]?.toString() || '0'
            });
            numberInput.style.cssText = `
                flex: 0 0 80px;
                padding: 4px 8px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                text-align: center;
                background: var(--background-primary);
                color: var(--text-normal);
            `;
            numberInput.min = (metric.min || 0).toString();
            numberInput.max = (metric.max || 100).toString();
            
            numberInput.addEventListener('change', (e) => {
                const value = parseInt((e.target as HTMLInputElement).value) || 0;
                this.formState.metrics[metric.id] = Math.max(metric.min || 0, Math.min(metric.max || 100, value));
            });
        } else {
            // Text metrics use text inputs
            const textInput = metricField.createEl('input', {
                type: 'text',
                cls: 'sfp-metric-input',
                value: this.formState.metrics[metric.id]?.toString() || ''
            });
            textInput.style.cssText = `
                flex: 1;
                padding: 4px 8px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
            `;
            
            textInput.addEventListener('input', (e) => {
                this.formState.metrics[metric.id] = (e.target as HTMLInputElement).value;
            });
        }
    }
    

    private async insertEntry(): Promise<void> {
        try {
            const { writeJournalEntry } = await import('../../logic/entry-writer');
            await writeJournalEntry(this.plugin.app, this.plugin.settings, this.formState);
            new Notice('Journal entry created successfully');
        } catch (error) {
            console.error('Failed to create journal entry:', error);
            new Notice('Failed to create journal entry');
        }
    }

    private clearForm(): void {
        // Reset form state to defaults
        const defaultMetrics: Record<string, number | string> = {};
        this.plugin.settings.selectedMetrics.forEach(metric => {
            if (metric.type === 'score' || metric.type === 'number') {
                defaultMetrics[metric.id] = metric.min || 1;
            } else {
                defaultMetrics[metric.id] = '';
            }
        });
        
        this.formState = {
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
            journalContent: '',
            journalImagePath: '',
            journalImageWidth: 400,
            dreamTitle: '',
            dreamContent: '',
            dreamImagePath: '',
            dreamImageWidth: 400,
            metrics: defaultMetrics,
        };
        
        // Refresh the display
        this.display();
    }


    private createPreviewContent(previewElement: HTMLElement, type: 'journal' | 'dream'): void {
        const label = previewElement.createEl('div', { 
            text: type === 'journal' ? 'Journal image preview' : 'Dream image preview', 
            cls: 'sfp-preview-label'
        });
        label.style.cssText = `
            font-weight: 500;
            color: var(--text-muted);
            margin-bottom: 8px;
        `;
        
        const instruction = previewElement.createEl('div', {
            text: 'Click to select image',
            cls: 'sfp-preview-instruction'
        });
        instruction.style.cssText = `
            font-size: 14px;
            color: var(--text-faint);
            font-style: italic;
            margin-bottom: 12px;
        `;
        
        // Add image width control
        const widthControl = previewElement.createDiv('sfp-width-control');
        widthControl.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            justify-content: center;
        `;
        
        const widthLabel = widthControl.createSpan();
        widthLabel.textContent = 'Width:';
        widthLabel.style.color = 'var(--text-muted)';
        
        const widthInput = widthControl.createEl('input', {
            type: 'number',
            value: type === 'journal' ? this.formState.journalImageWidth.toString() : this.formState.dreamImageWidth.toString(),
            cls: 'sfp-width-input'
        });
        widthInput.style.cssText = `
            width: 60px;
            padding: 4px 8px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            text-align: center;
            font-size: 13px;
            background: var(--background-primary);
            color: var(--text-normal);
        `;
        
        widthInput.addEventListener('change', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value) || 400;
            if (type === 'journal') {
                this.formState.journalImageWidth = value;
            } else {
                this.formState.dreamImageWidth = value;
            }
        });
        
        widthInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        const pxLabel = widthControl.createSpan();
        pxLabel.textContent = 'px';
        pxLabel.style.color = 'var(--text-muted)';
    }

    private openImageSelector(type: 'journal' | 'dream'): void {
        // Use user's selected image types from settings
        const allowedTypes = this.plugin.settings.allowedImageTypes;
        
        // Fallback to common image types if none selected
        if (allowedTypes.length === 0) {
            new Notice('No image file types selected in settings. Please configure allowed image types.');
            return;
        }
        
        const imageExtensions = allowedTypes.map(type => `.${type.toLowerCase()}`);
        const files = this.plugin.app.vault.getFiles();
        
        let imageFiles = files.filter(file => 
            imageExtensions.some(ext => file.path.toLowerCase().endsWith(ext))
        );
        
        // Filter by image folder preference if set
        if (this.plugin.settings.imageFolderPath) {
            const folderPath = this.plugin.settings.imageFolderPath.toLowerCase();
            imageFiles = imageFiles.filter(file => 
                file.path.toLowerCase().startsWith(folderPath)
            );
        }
        
        if (imageFiles.length === 0) {
            const folderMsg = this.plugin.settings.imageFolderPath 
                ? ` in folder "${this.plugin.settings.imageFolderPath}"` 
                : '';
            const typesMsg = allowedTypes.map(type => type.toUpperCase()).join(', ');
            new Notice(`No ${typesMsg} image files found${folderMsg}`);
            return;
        }
        
        // Create a simple modal for file selection
        const modal = new Modal(this.plugin.app);
        modal.titleEl.textContent = `Select ${type === 'journal' ? 'Journal' : 'Dream'} Image`;
        
        const container = modal.contentEl.createDiv();
        container.style.cssText = `
            max-height: 400px;
            overflow-y: auto;
        `;
        
        imageFiles.forEach(file => {
            const fileItem = container.createDiv('file-item');
            fileItem.style.cssText = `
                padding: 8px 12px;
                border-bottom: 1px solid var(--background-modifier-border);
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            fileItem.textContent = file.path;
            
            fileItem.addEventListener('mouseenter', () => {
                fileItem.style.backgroundColor = 'var(--background-modifier-hover)';
            });
            
            fileItem.addEventListener('mouseleave', () => {
                fileItem.style.backgroundColor = '';
            });
            
            fileItem.addEventListener('click', () => {
                if (type === 'journal') {
                    this.formState.journalImagePath = file.path;
                } else {
                    this.formState.dreamImagePath = file.path;
                }
                this.updateImagePreview(type, file.path);
                modal.close();
            });
        });
        
        modal.open();
    }

    private setupResizeObserver(previewElement: HTMLElement, _contentElement: HTMLElement): void {
        const resizeObserver = new ResizeObserver(_entries => {
            // Content area will automatically adjust due to flex layout
        });
        
        resizeObserver.observe(previewElement);
        
        // Store the observer for cleanup
        if (!previewElement.dataset.resizeObserver) {
            previewElement.dataset.resizeObserver = 'true';
            // Clean up observer when element is removed
            const originalRemove = previewElement.remove;
            previewElement.remove = function() {
                resizeObserver.disconnect();
                originalRemove.call(this);
            };
        }
    }

    private async updateImagePreview(type: 'journal' | 'dream', imagePath: string): Promise<void> {
        const previewContainer = type === 'journal' ? this.journalImagePreview : this.dreamImagePreview;
        if (!previewContainer) return;

        // Clear existing content except label
        const label = previewContainer.querySelector('.sfp-preview-label');
        previewContainer.empty();
        if (label) {
            previewContainer.appendChild(label);
        } else {
            previewContainer.createEl('p', { 
                text: type === 'journal' ? 'Journal Image Preview' : 'Dream Image Preview', 
                cls: 'sfp-preview-label' 
            });
        }

        if (!imagePath.trim()) {
            return;
        }

        try {
            const file = this.plugin.app.vault.getAbstractFileByPath(imagePath);
            if (file && file instanceof TFile) {
                const arrayBuffer = await this.plugin.app.vault.readBinary(file);
                const blob = new Blob([arrayBuffer]);
                const url = URL.createObjectURL(blob);

                const img = previewContainer.createEl('img');
                img.style.cssText = `
                    max-width: 100%;
                    max-height: 600px;
                    object-fit: contain;
                    border-radius: 4px;
                    margin-top: 10px;
                `;
                img.src = url;
                img.alt = imagePath;

                // Clean up blob URL when image loads or errors
                img.addEventListener('load', () => URL.revokeObjectURL(url));
                img.addEventListener('error', () => {
                    URL.revokeObjectURL(url);
                    previewContainer.createEl('p', { 
                        text: `Failed to load image: ${imagePath}`,
                        cls: 'sfp-error-text'
                    }).style.color = 'var(--text-error)';
                });
            } else {
                previewContainer.createEl('p', { 
                    text: `File not found: ${imagePath}`,
                    cls: 'sfp-error-text'
                }).style.color = 'var(--text-error)';
            }
        } catch (error) {
            console.error('Error loading image preview:', error);
            previewContainer.createEl('p', { 
                text: `Error loading image: ${imagePath}`,
                cls: 'sfp-error-text'
            }).style.color = 'var(--text-error)';
        }
    }

    hide(): void {
        this.containerEl.empty();
    }
}