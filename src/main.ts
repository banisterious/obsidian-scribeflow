import { Plugin } from 'obsidian';
import { JournalEntryModal } from './ui/JournalEntryModal';
import { ScribeFlowPluginSettings, FormState } from './types';
import { DEFAULT_SETTINGS, ScribeFlowSettingTab } from './settings';
import { loadDraft, saveDraft } from './logic/draft-manager';
import { DashboardView, DASHBOARD_VIEW_TYPE } from './views/DashboardView';
import { logger } from './services/LoggingService';

export default class ScribeFlowPlugin extends Plugin {
	settings: ScribeFlowPluginSettings;
	draft: FormState | null = null;

	async onload() {
		await this.loadSettings();
		this.updateLoggingService();
		this.draft = await loadDraft(this);

		// Register dashboard view
		this.registerView(DASHBOARD_VIEW_TYPE, leaf => new DashboardView(leaf, this));

		this.addCommand({
			id: 'open-scribeflow-entry-modal',
			name: 'Create Journal Entry',
			callback: () => {
				new JournalEntryModal(this.app, this).open();
			},
		});

		this.addCommand({
			id: 'open-scribe-dashboard',
			name: 'Open Scribe Dashboard',
			callback: () => {
				this.openDashboard();
			},
		});

		// Add ribbon buttons
		this.addRibbonIcon('notebook-pen', 'ScribeFlow Journal Entry', () => {
			new JournalEntryModal(this.app, this).open();
		});

		this.addRibbonIcon('table', 'Scribe Dashboard', () => {
			this.openDashboard();
		});

		this.addSettingTab(new ScribeFlowSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, _editor, _view) => {
				menu.addItem(item => {
					item.setTitle('ScribeFlow: insert journal entry')
						.setIcon('calendar-plus')
						.onClick(() => {
							new JournalEntryModal(this.app, this).open();
						});
				});
			})
		);
	}

	async onunload() {
		if (this.draft) {
			await saveDraft(this, this.draft);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// Migrate old settings: update preview word limit to 100
		if (
			this.settings.dashboardSettings.previewWordLimit === 50 ||
			this.settings.dashboardSettings.previewWordLimit === 200
		) {
			this.settings.dashboardSettings.previewWordLimit = 100;
			await this.saveSettings();
		}

		// Migrate settings: add statisticsGroupedView if missing
		if (this.settings.dashboardSettings.statisticsGroupedView === undefined) {
			this.settings.dashboardSettings.statisticsGroupedView = false;
			await this.saveSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	updateLoggingService(): void {
		logger.updateSettings(this.settings.loggingSettings);
	}

	async openDashboard(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE);

		if (existing.length > 0) {
			// Dashboard already open, just focus it
			this.app.workspace.revealLeaf(existing[0]);
		} else {
			// Open new dashboard
			const leaf = this.app.workspace.getLeaf(true);
			await leaf.setViewState({
				type: DASHBOARD_VIEW_TYPE,
				active: true,
			});
		}
	}
}
