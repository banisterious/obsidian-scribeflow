import { App, PluginSettingTab, Setting } from 'obsidian';
import { ScribeFlowPluginSettings, AVAILABLE_METRICS, AVAILABLE_IMAGE_TYPES, JournalTemplate, LogLevel } from './types';
import ScribeFlowPlugin from './main';
import { FolderSuggest } from './ui/FolderSuggest';
import { FileSuggest } from './ui/FileSuggest';

export const DEFAULT_SETTINGS: ScribeFlowPluginSettings = {
	calloutNames: {
		journalEntry: 'journal-entry',
		dreamDiary: 'dream-diary',
	},
	imageFolderPath: '',
	allowedImageTypes: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'], // Default common image types
	selectedMetrics: AVAILABLE_METRICS.slice(0, 5), // Default selection, users can add more
	templates: [], // Start with empty templates array
	tocSettings: {
		updateYearNote: false,
		updateMasterJournals: false,
		masterJournalsNotePath: '',
		yearNoteCalloutName: '',
		masterJournalsCalloutName: '',
	},
	dashboardSettings: {
		scanFolders: [],
		parseTemplates: [],
		previewWordLimit: 100,
		statisticsGroupedView: false,
		dailyWordGoal: 250,
		weeklyConsistencyGoal: 5,
	},
	loggingSettings: {
		enabled: false,
		level: LogLevel.WARN,
	},
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
		this.createDashboardSettings(containerEl);
		this.createTOCSettings(containerEl);
		this.createMetricsSettings(containerEl);
		this.createLoggingSettings(containerEl);
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
			.addText(text =>
				text
					.setPlaceholder('journal-entry')
					.setValue(this.plugin.settings.calloutNames.journalEntry)
					.onChange(async value => {
						this.plugin.settings.calloutNames.journalEntry = value || 'journal-entry';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Dream diary callout')
			.setDesc('The name used for dream diary callouts in the markdown output')
			.addText(text =>
				text
					.setPlaceholder('dream-diary')
					.setValue(this.plugin.settings.calloutNames.dreamDiary)
					.onChange(async value => {
						this.plugin.settings.calloutNames.dreamDiary = value || 'dream-diary';
						await this.plugin.saveSettings();
					})
			);
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
				text.setPlaceholder('attachments/images')
					.setValue(this.plugin.settings.imageFolderPath)
					.onChange(async value => {
						this.plugin.settings.imageFolderPath = value;
						await this.plugin.saveSettings();
					});

				new FolderSuggest(this.app, text.inputEl);
			});

		new Setting(containerEl)
			.setName('Allowed image file types')
			.setDesc('Select which image file types to show in the image picker');

		// Create a dedicated container for the image types manager within this section
		this.imageTypesContainer = containerEl.createDiv('sfp-image-types-container');
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

	private createDashboardSettings(containerEl: HTMLElement): void {
		const heading = containerEl.createDiv('setting-item setting-item-heading');
		const info = heading.createDiv('setting-item-info');
		info.createDiv({ text: 'Scribe Dashboard', cls: 'setting-item-name' });
		info.createDiv({ text: 'Configure settings for the journal dashboard view', cls: 'setting-item-description' });
		heading.createDiv('setting-item-control');

		// Statistics grouped view
		new Setting(containerEl)
			.setName('Group statistics by category')
			.setDesc('Display dashboard statistics grouped by category instead of in a flat grid')
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.dashboardSettings.statisticsGroupedView).onChange(async value => {
					this.plugin.settings.dashboardSettings.statisticsGroupedView = value;
					await this.plugin.saveSettings();
				})
			);

		// Preview word limit
		new Setting(containerEl)
			.setName('Preview word limit')
			.setDesc('Number of words to show in the journal entry preview')
			.addText(text =>
				text
					.setPlaceholder('100')
					.setValue(String(this.plugin.settings.dashboardSettings.previewWordLimit))
					.onChange(async value => {
						const numValue = parseInt(value) || 100;
						this.plugin.settings.dashboardSettings.previewWordLimit = numValue;
						await this.plugin.saveSettings();
					})
			);

		// Scan folders
		new Setting(containerEl)
			.setName('Scan folders')
			.setDesc('Folders to scan for journal entries (use folder selector below to add folders)');

		// Folder selector for scan folders
		new Setting(containerEl)
			.setName('Add scan folder')
			.setDesc('Select a folder to scan for journal entries')
			.addText(text => {
				text.setPlaceholder('path/to/journal/folder');
				new FolderSuggest(this.app, text.inputEl);

				const addFolder = async () => {
					const folderPath = text.getValue().trim();
					if (folderPath && !this.plugin.settings.dashboardSettings.scanFolders.includes(folderPath)) {
						this.plugin.settings.dashboardSettings.scanFolders.push(folderPath);
						await this.plugin.saveSettings();
						text.setValue('');
						this.display(); // Refresh to show updated list
					}
				};

				text.inputEl.addEventListener('keypress', async e => {
					if (e.key === 'Enter') {
						e.preventDefault();
						await addFolder();
					}
				});

				return text;
			})
			.addButton(button => {
				button
					.setButtonText('Add')
					.setTooltip('Add folder to scan list')
					.onClick(async () => {
						const textComponent = button.buttonEl.previousElementSibling as HTMLInputElement;
						if (textComponent) {
							const folderPath = textComponent.value.trim();
							if (
								folderPath &&
								!this.plugin.settings.dashboardSettings.scanFolders.includes(folderPath)
							) {
								this.plugin.settings.dashboardSettings.scanFolders.push(folderPath);
								await this.plugin.saveSettings();
								textComponent.value = '';
								this.display(); // Refresh to show updated list
							}
						}
					});
			});

		// Display current scan folders
		if (this.plugin.settings.dashboardSettings.scanFolders.length > 0) {
			const foldersContainer = containerEl.createDiv('sfp-scan-folders-list');
			foldersContainer.createEl('h6', { text: 'Selected folders:', cls: 'sfp-section-header' });

			this.plugin.settings.dashboardSettings.scanFolders.forEach((folder, index) => {
				const folderItem = foldersContainer.createDiv('sfp-folder-item');
				folderItem.createSpan({ text: folder, cls: 'sfp-folder-name' });

				const removeBtn = folderItem.createEl('button', { text: '×', cls: 'sfp-remove-btn' });
				removeBtn.addEventListener('click', async () => {
					this.plugin.settings.dashboardSettings.scanFolders.splice(index, 1);
					await this.plugin.saveSettings();
					this.display(); // Refresh to show updated list
				});
			});
		}

		// Parse templates
		new Setting(containerEl)
			.setName('Parse templates')
			.setDesc('Select which templates to parse for journal entries');

		// Display template selection
		const templatesContainer = containerEl.createDiv('sfp-parse-templates-container');
		this.renderTemplateSelection(templatesContainer);

		// Goal tracking section header
		const goalHeader = containerEl.createDiv('setting-item setting-item-heading');
		const goalInfo = goalHeader.createDiv('setting-item-info');
		goalInfo.createDiv({ text: 'Goal Tracking', cls: 'setting-item-name' });
		goalInfo.createDiv({ text: 'Set daily and weekly journaling goals', cls: 'setting-item-description' });
		goalHeader.createDiv('setting-item-control');

		// Daily word goal
		new Setting(containerEl)
			.setName('Daily word goal')
			.setDesc('Target number of words to write per day')
			.addText(text =>
				text
					.setPlaceholder('250')
					.setValue(String(this.plugin.settings.dashboardSettings.dailyWordGoal))
					.onChange(async value => {
						const numValue = parseInt(value) || 250;
						this.plugin.settings.dashboardSettings.dailyWordGoal = Math.max(1, numValue);
						await this.plugin.saveSettings();
					})
			);

		// Weekly consistency goal
		new Setting(containerEl)
			.setName('Weekly consistency goal')
			.setDesc('Target number of days to journal per week (1-7)')
			.addText(text =>
				text
					.setPlaceholder('5')
					.setValue(String(this.plugin.settings.dashboardSettings.weeklyConsistencyGoal))
					.onChange(async value => {
						const numValue = parseInt(value) || 5;
						this.plugin.settings.dashboardSettings.weeklyConsistencyGoal = Math.max(1, Math.min(7, numValue));
						await this.plugin.saveSettings();
					})
			);
	}

	private renderTemplateSelection(container: HTMLElement): void {
		container.empty();

		if (this.plugin.settings.templates.length === 0) {
			container.createDiv({
				text: 'No templates available. Create templates first in the Templates tab.',
				cls: 'sfp-no-templates',
			});
			return;
		}

		// Selected templates section
		if (this.plugin.settings.dashboardSettings.parseTemplates.length > 0) {
			const selectedSection = container.createDiv();
			selectedSection.createEl('h6', { text: 'Selected templates', cls: 'sfp-section-header' });

			const selectedList = selectedSection.createDiv('sfp-selected-templates');
			this.plugin.settings.dashboardSettings.parseTemplates.forEach((templateId, index) => {
				const template = this.plugin.settings.templates.find(t => t.id === templateId);
				if (template) {
					const item = selectedList.createDiv('sfp-template-item');

					const name = item.createDiv('sfp-template-name');
					name.textContent = template.name;

					const removeBtn = item.createEl('button', { text: '×', cls: 'sfp-remove-btn' });
					removeBtn.addEventListener('click', async () => {
						this.plugin.settings.dashboardSettings.parseTemplates.splice(index, 1);
						await this.plugin.saveSettings();
						this.renderTemplateSelection(container);
					});
				}
			});
		}

		// Available templates section
		const selectedIds = new Set(this.plugin.settings.dashboardSettings.parseTemplates);
		const availableTemplates = this.plugin.settings.templates.filter(t => !selectedIds.has(t.id));

		if (availableTemplates.length > 0) {
			const availableSection = container.createDiv();
			availableSection.createEl('h6', { text: 'Available templates', cls: 'sfp-section-header' });

			const availableList = availableSection.createDiv('sfp-available-templates');
			availableTemplates.forEach(template => {
				const item = availableList.createDiv('sfp-template-item');

				const name = item.createDiv('sfp-template-name');
				name.textContent = template.name;

				item.createEl('button', { text: '+', cls: 'sfp-add-btn' });

				item.addEventListener('click', async () => {
					this.plugin.settings.dashboardSettings.parseTemplates.push(template.id);
					await this.plugin.saveSettings();
					this.renderTemplateSelection(container);
				});
			});
		}
	}

	private createTOCSettings(containerEl: HTMLElement): void {
		const heading = containerEl.createDiv('setting-item setting-item-heading');
		const info = heading.createDiv('setting-item-info');
		info.createDiv({ text: 'Table of contents', cls: 'setting-item-name' });
		info.createDiv({ text: '', cls: 'setting-item-description' });
		heading.createDiv('setting-item-control');

		// 1. Update active note table of contents
		new Setting(containerEl)
			.setName('Update active note table of contents')
			.setDesc("Automatically add journal entry links to the active note's TOC")
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.tocSettings.updateYearNote).onChange(async value => {
					this.plugin.settings.tocSettings.updateYearNote = value;
					await this.plugin.saveSettings();
					// Refresh the display to show/hide the callout name field
					this.display();
				})
			);

		// 2. Active note TOC callout name (conditional)
		if (this.plugin.settings.tocSettings.updateYearNote) {
			new Setting(containerEl)
				.setName('Active note TOC callout name')
				.setDesc(
					'Name of the callout in active note to insert table of contents links into (leave empty for first callout with list)'
				)
				.addText(text =>
					text
						.setPlaceholder('table-of-contents')
						.setValue(this.plugin.settings.tocSettings.yearNoteCalloutName)
						.onChange(async value => {
							this.plugin.settings.tocSettings.yearNoteCalloutName = value;
							await this.plugin.saveSettings();
						})
				);
		}

		// 3. Update master journals table of contents
		new Setting(containerEl)
			.setName('Update master journals table of contents')
			.setDesc("Automatically add journal entry links to the master journals note's TOC")
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.tocSettings.updateMasterJournals).onChange(async value => {
					this.plugin.settings.tocSettings.updateMasterJournals = value;
					await this.plugin.saveSettings();
					// Refresh the display to show/hide the master journals fields
					this.display();
				})
			);

		// 4. Master journals note (conditional)
		if (this.plugin.settings.tocSettings.updateMasterJournals) {
			new Setting(containerEl)
				.setName('Master journals note')
				.setDesc('Select the note containing the master table of contents')
				.addText(text => {
					text.setPlaceholder('path/to/master-journals.md')
						.setValue(this.plugin.settings.tocSettings.masterJournalsNotePath)
						.onChange(async value => {
							this.plugin.settings.tocSettings.masterJournalsNotePath = value;
							await this.plugin.saveSettings();
						});

					const fileSuggest = new FileSuggest(this.app, text.inputEl);
					fileSuggest.onSelect(async () => {
						// Trigger the onChange event manually to save the setting
						setTimeout(() => {
							const changeEvent = new Event('input', { bubbles: true });
							text.inputEl.dispatchEvent(changeEvent);
						}, 10);
					});
				});

			// 5. Master journals TOC callout name (conditional)
			new Setting(containerEl)
				.setName('Master journals TOC callout name')
				.setDesc(
					'Name of the callout in master journals note to insert table of contents links into (leave empty for first callout with list)'
				)
				.addText(text =>
					text
						.setPlaceholder('journals')
						.setValue(this.plugin.settings.tocSettings.masterJournalsCalloutName)
						.onChange(async value => {
							this.plugin.settings.tocSettings.masterJournalsCalloutName = value;
							await this.plugin.saveSettings();
						})
				);
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

	private createLoggingSettings(containerEl: HTMLElement): void {
		const heading = containerEl.createDiv('setting-item setting-item-heading');
		const info = heading.createDiv('setting-item-info');
		info.createDiv({ text: 'Logging', cls: 'setting-item-name' });
		info.createDiv({
			text: 'Configure logging output for debugging and troubleshooting',
			cls: 'setting-item-description',
		});
		heading.createDiv('setting-item-control');

		// Enable logging toggle
		new Setting(containerEl)
			.setName('Enable logging')
			.setDesc('Turn on logging to see detailed information in the browser console')
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.loggingSettings.enabled).onChange(async value => {
					this.plugin.settings.loggingSettings.enabled = value;
					await this.plugin.saveSettings();
					// Update logging service
					this.plugin.updateLoggingService();
					// Refresh the display to show/hide the log level setting
					this.display();
				})
			);

		// Log level dropdown (conditional)
		if (this.plugin.settings.loggingSettings.enabled) {
			new Setting(containerEl)
				.setName('Log level')
				.setDesc('Choose what level of detail to log (Error < Warning < Info < Debug)')
				.addDropdown(dropdown => {
					dropdown
						.addOption(LogLevel.ERROR, 'Error')
						.addOption(LogLevel.WARN, 'Warning')
						.addOption(LogLevel.INFO, 'Info')
						.addOption(LogLevel.DEBUG, 'Debug')
						.setValue(this.plugin.settings.loggingSettings.level)
						.onChange(async value => {
							this.plugin.settings.loggingSettings.level = value as LogLevel;
							await this.plugin.saveSettings();
							// Update logging service
							this.plugin.updateLoggingService();
						});
				});
		}
	}
}
