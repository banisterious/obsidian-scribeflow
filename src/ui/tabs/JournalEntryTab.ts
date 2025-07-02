import { Notice, TFile, Modal, MarkdownView } from 'obsidian';
import ScribeFlowPlugin from '../../main';
import { FormState, MetricDefinition } from '../../types';
import { TemplateProcessingService } from '../../services/TemplateProcessingService';
import { updateTableOfContents } from '../../logic/toc-updater';
import { logger } from '../../services/LoggingService';

export class JournalEntryTab {
	containerEl: HTMLElement;
	plugin: ScribeFlowPlugin;
	formState: FormState;
	private contentEl: HTMLElement;
	private journalImagePreview: HTMLElement | null = null;
	private dreamImagePreview: HTMLElement | null = null;
	private clearButton?: HTMLButtonElement;
	private insertButton?: HTMLButtonElement;
	private journalModal?: any;

	constructor(
		containerEl: HTMLElement,
		plugin: ScribeFlowPlugin,
		buttons?: { clearButton: HTMLButtonElement; insertButton: HTMLButtonElement },
		journalModal?: any
	) {
		this.containerEl = containerEl;
		this.plugin = plugin;
		this.clearButton = buttons?.clearButton;
		this.insertButton = buttons?.insertButton;
		this.journalModal = journalModal;

		// Create dedicated content element for this tab
		this.contentEl = containerEl.createDiv('sfp-tab-content sfp-journal-entry-tab');
		this.contentEl.style.display = 'block'; // Initially visible

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

		// Set up button event handlers
		this.setupButtonHandlers();
	}

	private setupButtonHandlers(): void {
		if (this.insertButton) {
			this.insertButton.addEventListener('click', () => this.handleInsertEntry());
		}

		if (this.clearButton) {
			this.clearButton.addEventListener('click', () => this.handleClearForm());
		}
	}

	display(): void {
		this.contentEl.style.display = 'block';
		// Only render if not already rendered
		if (this.contentEl.children.length === 0) {
			this.renderFormElements(this.contentEl);
		}
	}

	private renderFormElements(container: HTMLElement): void {
		// Date and Time - horizontal layout
		const dateTimeRow = container.createDiv('sfp-field-row');

		const dateField = dateTimeRow.createDiv('sfp-field sfp-field-half');
		dateField.createEl('label', { text: 'Date', cls: 'sfp-field-label' });
		const dateInput = dateField.createEl('input', {
			type: 'date',
			cls: 'sfp-field-input',
			value: this.formState.date,
		});
		dateInput.addEventListener('change', e => {
			this.formState.date = (e.target as HTMLInputElement).value;
		});

		const timeField = dateTimeRow.createDiv('sfp-field sfp-field-half');
		timeField.createEl('label', { text: 'Time', cls: 'sfp-field-label' });
		const timeInput = timeField.createEl('input', {
			type: 'time',
			cls: 'sfp-field-input',
			value: this.formState.time,
		});
		timeInput.addEventListener('change', e => {
			this.formState.time = (e.target as HTMLInputElement).value;
		});

		// Journal Content with Preview
		const journalContentSection = container.createDiv('sfp-content-section');

		const journalContentContainer = journalContentSection.createDiv('sfp-content-form');
		const journalField = journalContentContainer.createDiv('sfp-field');
		journalField.createEl('label', { text: 'Journal entry', cls: 'sfp-field-label' });
		const journalTextarea = journalField.createEl('textarea', {
			cls: 'sfp-field-input sfp-textarea',
			placeholder: 'Write your journal entry here...',
		});
		journalTextarea.value = this.formState.journalContent;
		journalTextarea.addEventListener('input', e => {
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
			value: this.formState.dreamTitle,
		});
		dreamTitleInput.addEventListener('input', e => {
			this.formState.dreamTitle = (e.target as HTMLInputElement).value;
		});

		// Dream Content with Preview
		const dreamContentSection = container.createDiv('sfp-content-section');

		const dreamContentContainer = dreamContentSection.createDiv('sfp-content-form');
		const dreamField = dreamContentContainer.createDiv('sfp-field');
		dreamField.createEl('label', { text: 'Dream content', cls: 'sfp-field-label' });
		const dreamTextarea = dreamField.createEl('textarea', {
			cls: 'sfp-field-input sfp-textarea',
			placeholder: 'Describe your dream here...',
		});
		dreamTextarea.style.minHeight = '100px';
		dreamTextarea.value = this.formState.dreamContent;
		dreamTextarea.addEventListener('input', e => {
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

		// Note: Button event handlers are already set up in setupButtonHandlers() called from constructor
		// Removing duplicate event listeners to prevent double insertion

		// Update previews for any existing image paths
		if (this.formState.journalImagePath) {
			this.updateImagePreview('journal', this.formState.journalImagePath);
		}
		if (this.formState.dreamImagePath) {
			this.updateImagePreview('dream', this.formState.dreamImagePath);
		}
	}

	private createModernMetricField(
		container: HTMLElement,
		name: string,
		desc: string,
		metric: MetricDefinition
	): void {
		const metricField = container.createDiv('sfp-metric-field');

		const metricInfo = metricField.createDiv('sfp-metric-info');
		metricInfo.createDiv({ text: name, cls: 'sfp-metric-label' });
		metricInfo.createDiv({ text: desc, cls: 'sfp-metric-desc' });

		if (metric.type === 'score') {
			// Score metrics use sliders
			const metricSlider = metricField.createDiv('sfp-metric-slider');
			const currentValue = (this.formState.metrics[metric.id] as number) || metric.min || 1;
			const range = (metric.max || 10) - (metric.min || 1);

			const sliderFill = document.createElement('div');
			sliderFill.className = 'sfp-slider-fill';
			sliderFill.style.width = `${((currentValue - (metric.min || 1)) / range) * 100}%`;
			metricSlider.appendChild(sliderFill);

			const metricValue = metricField.createDiv({ text: currentValue.toString(), cls: 'sfp-metric-value' });

			metricSlider.addEventListener('click', e => {
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
				value: this.formState.metrics[metric.id]?.toString() || '0',
			});
			numberInput.addClass('sfp-metric-input');
			numberInput.min = (metric.min || 0).toString();
			numberInput.max = (metric.max || 100).toString();

			numberInput.addEventListener('change', e => {
				const value = parseInt((e.target as HTMLInputElement).value) || 0;
				this.formState.metrics[metric.id] = Math.max(metric.min || 0, Math.min(metric.max || 100, value));
			});
		} else {
			// Text metrics use text inputs
			const textInput = metricField.createEl('input', {
				type: 'text',
				cls: 'sfp-metric-input',
				value: this.formState.metrics[metric.id]?.toString() || '',
			});
			textInput.addClass('sfp-metric-input');

			textInput.addEventListener('input', e => {
				this.formState.metrics[metric.id] = (e.target as HTMLInputElement).value;
			});
		}
	}

	private createPreviewContent(previewElement: HTMLElement, type: 'journal' | 'dream'): void {
		const label = previewElement.createEl('div', {
			text: type === 'journal' ? 'Journal image preview' : 'Dream image preview',
			cls: 'sfp-preview-label',
		});
		label.addClass('sfp-preview-label');

		const instruction = previewElement.createEl('div', {
			text: 'Click to select image',
			cls: 'sfp-preview-instruction',
		});
		instruction.addClass('sfp-preview-instruction');

		// Add image width control
		const widthControl = previewElement.createDiv('sfp-width-control');
		widthControl.addClass('sfp-width-control');

		const widthLabel = widthControl.createSpan();
		widthLabel.textContent = 'Width:';
		widthLabel.style.color = 'var(--text-muted)';

		const widthInput = widthControl.createEl('input', {
			type: 'number',
			value:
				type === 'journal'
					? this.formState.journalImageWidth.toString()
					: this.formState.dreamImageWidth.toString(),
			cls: 'sfp-width-input',
		});
		widthInput.addClass('sfp-width-input');

		widthInput.addEventListener('change', e => {
			const value = parseInt((e.target as HTMLInputElement).value) || 400;
			if (type === 'journal') {
				this.formState.journalImageWidth = value;
			} else {
				this.formState.dreamImageWidth = value;
			}
		});

		widthInput.addEventListener('click', e => {
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

		let imageFiles = files.filter(file => imageExtensions.some(ext => file.path.toLowerCase().endsWith(ext)));

		// Filter by image folder preference if set
		if (this.plugin.settings.imageFolderPath) {
			const folderPath = this.plugin.settings.imageFolderPath.toLowerCase();
			imageFiles = imageFiles.filter(file => file.path.toLowerCase().startsWith(folderPath));
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
		container.style.maxHeight = '400px';
		container.style.overflowY = 'auto';

		imageFiles.forEach(file => {
			const fileItem = container.createDiv('file-item');
			fileItem.addClass('file-item');
			fileItem.textContent = file.path;

			// Hover styles are now handled by CSS

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
			previewElement.remove = function () {
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
				cls: 'sfp-preview-label',
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
				img.style.maxWidth = '100%';
				img.style.maxHeight = '600px';
				img.style.objectFit = 'contain';
				img.style.borderRadius = '4px';
				img.style.marginTop = '10px';
				img.src = url;
				img.alt = imagePath;

				// Clean up blob URL when image loads or errors
				img.addEventListener('load', () => URL.revokeObjectURL(url));
				img.addEventListener('error', () => {
					URL.revokeObjectURL(url);
					previewContainer.createEl('p', {
						text: `Failed to load image: ${imagePath}`,
						cls: 'sfp-error-text',
					});
				});
			} else {
				previewContainer.createEl('p', {
					text: `File not found: ${imagePath}`,
					cls: 'sfp-error-text',
				});
			}
		} catch (error) {
			logger.error('JournalEntryTab', 'updateImagePreview', 'Image preview loading failed', {
				type,
				imagePath,
				error: error.message,
			});
			previewContainer.createEl('p', {
				text: `Error loading image: ${imagePath}`,
				cls: 'sfp-error-text',
			});
		}
	}

	hide(): void {
		this.contentEl.style.display = 'none';
	}

	private async handleInsertEntry(): Promise<void> {
		// Get the selected template from the modal
		const selectedTemplate = this.getSelectedTemplate();

		try {
			if (!selectedTemplate) {
				new Notice('No template selected');
				return;
			}

			// Process the template with current form data
			const templateProcessor = new TemplateProcessingService();
			const processedContent = templateProcessor.processTemplate(
				selectedTemplate,
				this.formState,
				this.plugin.settings.selectedMetrics
			);

			// Insert into active editor
			await this.insertIntoActiveEditor(processedContent);

			// Update TOC after successful insertion
			const dateBlockID = `^${this.formState.date.replace(/-/g, '')}`;
			if (
				this.plugin.settings.tocSettings.updateMasterJournals ||
				this.plugin.settings.tocSettings.updateYearNote
			) {
				// Wait for editor to commit changes, then update TOCs
				setTimeout(async () => {
					try {
						await updateTableOfContents(this.plugin.app, this.plugin.settings, this.formState, dateBlockID);
					} catch (error) {
						logger.error('JournalEntryTab', 'handleInsertEntry', 'TOC update failed', {
							error: error.message,
							dateBlockID,
							updateYearNote: this.plugin.settings.tocSettings.updateYearNote,
							updateMasterJournals: this.plugin.settings.tocSettings.updateMasterJournals,
						});
					}
				}, 500);
			}

			// Show success message
			new Notice('Journal entry inserted successfully!');

			// Save draft and optionally clear form
			await this.plugin.saveSettings();
		} catch (error) {
			logger.error('JournalEntryTab', 'handleInsertEntry', 'Journal entry insertion failed', {
				error: error.message,
				templateName: selectedTemplate?.name,
				hasJournalContent: !!this.formState.journalContent,
				hasDreamContent: !!this.formState.dreamContent,
			});
			new Notice(`Failed to insert journal entry: ${error.message}`);
		}
	}

	private getSelectedTemplate() {
		// Get selected template from the modal
		if (this.journalModal && this.journalModal.selectedTemplate) {
			return this.journalModal.selectedTemplate;
		}

		// Fallback: use first available template
		if (this.plugin.settings.templates.length > 0) {
			return this.plugin.settings.templates[0];
		}

		return null;
	}

	private async insertIntoActiveEditor(content: string): Promise<void> {
		const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			throw new Error('No active markdown editor found');
		}

		const editor = activeView.editor;
		const cursor = editor.getCursor();

		// Insert the content at cursor position
		editor.replaceRange(content, cursor);

		// Move cursor to end of inserted content
		const lines = content.split('\n');
		const newCursor = {
			line: cursor.line + lines.length - 1,
			ch: lines.length === 1 ? cursor.ch + content.length : lines[lines.length - 1].length,
		};
		editor.setCursor(newCursor);
	}

	private handleClearForm(): void {
		// Reset form state to defaults
		const defaultMetrics: Record<string, number | string> = {};
		this.plugin.settings.selectedMetrics.forEach(metric => {
			if (metric.type === 'score' || metric.type === 'number') {
				defaultMetrics[metric.id] = metric.min || 1;
			} else {
				defaultMetrics[metric.id] = '';
			}
		});

		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		const todayString = `${year}-${month}-${day}`;
		const timeString = today.toTimeString().slice(0, 5);

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

		// Re-render the form to reflect cleared state
		this.contentEl.empty();
		this.renderFormElements(this.contentEl);

		new Notice('Form cleared');
	}
}
