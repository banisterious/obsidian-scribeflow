import { ItemView, WorkspaceLeaf, prepareSimpleSearch, SearchComponent } from 'obsidian';
import ScribeFlowPlugin from '../main';
import {
	DashboardEntry,
	DateFilter,
	DashboardState,
	SearchResult,
	SearchMatch,
	DashboardStatistics,
	StatCard,
	MetricCategories,
} from '../types/dashboard';
import { DashboardParser } from '../services/DashboardParser';
import { DashboardStatisticsCalculator } from '../services/DashboardStatisticsCalculator';
import { DashboardExporter } from '../services/export/DashboardExporter';
import { EntryExporter } from '../services/export/EntryExporter';
import { ExportButton } from '../ui/components/ExportButton';
import { ExportContextMenu } from '../ui/components/ExportContextMenu';
import { DashboardExportFormat, EntryExportFormat } from '../services/export/types';
import { logger } from '../services/LoggingService';

export const DASHBOARD_VIEW_TYPE = 'scribeflow-dashboard';

export class DashboardView extends ItemView {
	private plugin: ScribeFlowPlugin;
	private state: DashboardState;
	private dashboardContentEl: HTMLElement;
	private parser: DashboardParser;
	private dashboardExporter: DashboardExporter;
	private entryExporter: EntryExporter;
	private exportButton: ExportButton;

	constructor(leaf: WorkspaceLeaf, plugin: ScribeFlowPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.parser = new DashboardParser(this.app, this.plugin.settings);
		this.dashboardExporter = new DashboardExporter(this.app);
		this.entryExporter = new EntryExporter(this.app);
		this.state = {
			entries: [],
			filteredEntries: [],
			currentFilter: DateFilter.ALL_TIME,
			sortColumn: 'date',
			sortDirection: 'desc',
			searchQuery: '',
			searchResults: [],
			searchFields: [
				{ name: 'content', label: 'Content', enabled: true },
				{ name: 'file', label: 'Filename', enabled: false },
			],
			headerCollapsed: true,
			statistics: DashboardStatisticsCalculator.calculateStatistics([], DateFilter.ALL_TIME, undefined, [], {
				dailyWordGoal: this.plugin.settings.dashboardSettings.dailyWordGoal,
				weeklyConsistencyGoal: this.plugin.settings.dashboardSettings.weeklyConsistencyGoal
			}),
			statisticsGroupedView: this.plugin.settings.dashboardSettings.statisticsGroupedView ?? false,
			metricsDropdownOpen: false,
			enabledMetrics: {
				goals: true,
				progress: true,
				consistency: true,
				content: true,
				patterns: true,
				vocabulary: false, // Future feature, disabled by default
			},
		};
	}

	getViewType(): string {
		return DASHBOARD_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Scribe dashboard';
	}

	getIcon(): string {
		return 'table';
	}

	async onOpen(): Promise<void> {
		this.dashboardContentEl = this.containerEl.children[1] as HTMLElement;
		this.dashboardContentEl.empty();

		this.renderDashboard();
		await this.loadEntries();
	}

	async onClose(): Promise<void> {
		// Cleanup export button
		if (this.exportButton) {
			this.exportButton.unload();
		}
		
		// Cleanup metrics dropdown listener
		this.removeClickOutsideListener();
	}

	private renderDashboard(): void {
		this.dashboardContentEl.empty();

		// Create main container
		const container = this.dashboardContentEl.createDiv('sfp-scribeflow-dashboard');

		// Render header
		this.renderHeader(container);

		// Render statistics cards (only if header not collapsed)
		if (!this.state.headerCollapsed) {
			try {
				this.renderStatisticsCards(container);
			} catch (error) {
				logger.error('DashboardView', 'renderDashboard', 'Statistics cards rendering failed', {
					error: error.message,
					headerCollapsed: this.state.headerCollapsed,
				});
				// Continue rendering the rest of the dashboard
			}
		}

		// Render controls (includes search if header not collapsed)
		this.renderControls(container);

		// Render table
		this.renderTable(container);
	}

	private renderHeader(container: HTMLElement): void {
		const header = container.createDiv('sfp-dashboard-header');

		// Header top bar with title and toggle
		const headerTop = header.createDiv('sfp-dashboard-header-top');

		const titleSection = headerTop.createDiv('sfp-dashboard-title-section');
		titleSection.createEl('h1', { text: 'Scribe dashboard' });

		// Add controls (toggle + refresh)
		const controls = headerTop.createDiv('sfp-dashboard-header-controls');

		// Collapse/expand toggle (left of refresh)
		const toggleBtnText = this.state.headerCollapsed ? 'Expand' : 'Collapse';
		const toggleBtn = controls.createEl('button', {
			text: toggleBtnText,
			cls: 'sfp-dashboard-toggle-btn',
		});
		toggleBtn.addEventListener('click', () => {
			this.state.headerCollapsed = !this.state.headerCollapsed;

			// Clear search when collapsing to avoid confusion
			if (this.state.headerCollapsed && this.state.searchQuery) {
				this.state.searchQuery = '';
				this.state.searchResults = [];
				this.applyFiltersAndSearch();
			}

			this.renderDashboard();
		});

		// Refresh button (right of toggle)
		const refreshBtn = controls.createEl('button', { text: 'Refresh' });
		refreshBtn.addEventListener('click', async () => {
			refreshBtn.textContent = 'Refreshing...';
			refreshBtn.disabled = true;
			await this.refresh();
			refreshBtn.textContent = 'Refresh';
			refreshBtn.disabled = false;
		});

		// Collapsible content
		if (!this.state.headerCollapsed) {
			const headerContent = header.createDiv('sfp-dashboard-header-content');

			headerContent.createEl('p', {
				text: 'Overview of your journaling activity and trends',
				cls: 'sfp-dashboard-subtitle',
			});
		}
	}

	private renderSummaryStats(header: HTMLElement): void {
		const statsContainer = header.createDiv('dashboard-stats');

		const totalEntries = this.state.entries.length;
		const filteredEntries = this.state.filteredEntries.length;
		const avgWords =
			totalEntries > 0
				? Math.round(this.state.entries.reduce((sum, entry) => sum + entry.wordCount, 0) / totalEntries)
				: 0;

		// Calculate this month count
		const now = new Date();
		const thisMonthCount = this.state.entries.filter(entry => {
			const entryDate = new Date(entry.date);
			return entryDate.getFullYear() === now.getFullYear() && entryDate.getMonth() === now.getMonth();
		}).length;

		const stats = [
			{ label: 'Total entries', value: totalEntries.toString() },
			{ label: 'Showing', value: filteredEntries.toString() },
			{ label: 'Average words', value: avgWords.toString() },
			{ label: 'This month', value: thisMonthCount.toString() },
		];

		stats.forEach(stat => {
			const statItem = statsContainer.createDiv('stat-item');
			statItem.createDiv({ text: stat.label, cls: 'stat-label' });
			statItem.createDiv({ text: stat.value, cls: 'stat-value' });
		});
	}

	private updateSearchResultsDisplay(resultsElement: HTMLElement): void {
		if (this.state.searchQuery) {
			const count = this.state.searchResults.length;
			resultsElement.textContent = `${count} result${count !== 1 ? 's' : ''} for "${this.state.searchQuery}"`;
			resultsElement.classList.add('has-results');
		} else {
			resultsElement.textContent = '';
			resultsElement.classList.remove('has-results');
		}
	}

	private renderControls(container: HTMLElement): void {
		const controls = container.createDiv('sfp-dashboard-controls');

		// Left side: Date filter dropdown
		const filterContainer = controls.createDiv('filter-container');
		filterContainer.createEl('label', { text: 'Filter: ' });

		const select = filterContainer.createEl('select');
		const filterOptions = [
			{ value: DateFilter.ALL_TIME, label: 'All time' },
			{ value: DateFilter.TODAY, label: 'Today' },
			{ value: DateFilter.THIS_WEEK, label: 'This week' },
			{ value: DateFilter.THIS_MONTH, label: 'This month' },
			{ value: DateFilter.LAST_30_DAYS, label: 'Last 30 days' },
			{ value: DateFilter.THIS_YEAR, label: 'This year' },
		];

		filterOptions.forEach(option => {
			const optionEl = select.createEl('option', {
				value: option.value,
				text: option.label,
			});
			if (option.value === this.state.currentFilter) {
				optionEl.selected = true;
			}
		});

		select.addEventListener('change', () => {
			this.state.currentFilter = select.value as DateFilter;
			this.applyFiltersAndSearch();
			this.renderTable(container);
		});

		// Right side: Search section (always visible)
		this.renderSearchInControls(controls, container);

		// Export button (rightmost position)
		this.exportButton = new ExportButton(controls, format => this.handleDashboardExport(format));
		this.exportButton.load();

		// Add refresh event listener
		container.addEventListener('refresh', () => {
			this.refresh();
		});

		// Add keyboard shortcuts
		this.setupKeyboardShortcuts(select);
	}

	private renderSearchInControls(controls: HTMLElement, container: HTMLElement): void {
		// Search container
		const searchContainer = controls.createDiv('sfp-search-container');

		// Search input wrapper
		const searchInputWrapper = searchContainer.createDiv('sfp-search-input-wrapper');

		// Create Obsidian's native SearchComponent
		const searchComponent = new SearchComponent(searchInputWrapper);
		searchComponent.setPlaceholder('Search entries...');
		if (this.state.searchQuery) {
			searchComponent.setValue(this.state.searchQuery);
		}

		// Search options
		const searchOptions = searchContainer.createDiv('sfp-search-options');
		this.state.searchFields.forEach(field => {
			const option = searchOptions.createDiv('sfp-search-option');
			const checkbox = option.createEl('input', {
				attr: { type: 'checkbox', id: `search-${field.name}` },
			});
			checkbox.checked = field.enabled;

			option.createEl('label', {
				text: field.label,
				attr: { for: `search-${field.name}` },
			});

			checkbox.addEventListener('change', () => {
				field.enabled = checkbox.checked;
				this.performSearch();
			});
		});

		// Search results info
		const searchResultsInfo = searchContainer.createDiv('search-results-info');
		const resultsCount = searchResultsInfo.createDiv('search-results-count');
		this.updateSearchResultsDisplay(resultsCount);

		// Event listeners
		let searchTimeout: NodeJS.Timeout;

		const handleSearchUpdate = () => {
			this.state.searchQuery = searchComponent.inputEl.value;

			// Debounce search
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				this.performSearch();
				this.updateSearchResultsDisplay(resultsCount);
				this.renderTable(container);
			}, 300);
		};

		// Handle typing in search field
		searchComponent.inputEl.addEventListener('input', handleSearchUpdate);

		// Handle clear button and other value changes
		searchComponent.inputEl.addEventListener('change', handleSearchUpdate);

		// Also handle when the field loses focus (covers additional clear scenarios)
		searchComponent.inputEl.addEventListener('blur', () => {
			if (searchComponent.inputEl.value !== this.state.searchQuery) {
				handleSearchUpdate();
			}
		});

		// Global keyboard shortcuts
		this.setupSearchKeyboardShortcuts(searchComponent.inputEl);
	}

	private renderTable(container: HTMLElement): void {
		// Remove existing table
		const existingTable = container.querySelector('.sfp-dashboard-table-container');
		if (existingTable) {
			existingTable.remove();
		}

		const tableContainer = container.createDiv('sfp-dashboard-table-container');
		const table = tableContainer.createEl('table', { cls: 'sfp-dashboard-table' });

		// Render table header
		this.renderTableHeader(table);

		// Render table body
		this.renderTableBody(table);
	}

	private renderTableHeader(table: HTMLTableElement): void {
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');

		const columns = [
			{ key: 'date', label: 'Entry', sortable: true },
			{ key: 'content', label: 'Content', sortable: false },
			{ key: 'tags', label: 'Tags', sortable: false },
			{ key: 'wordCount', label: 'Words', sortable: true },
			{ key: 'imageCount', label: 'Images', sortable: true },
		];

		columns.forEach(column => {
			const th = headerRow.createEl('th');
			th.textContent = column.label;

			if (column.sortable) {
				th.classList.add('sortable');
				th.addEventListener('click', () => {
					this.sortEntries(column.key);
					this.renderTable(table.parentElement!.parentElement!);
				});

				// Add sort indicator
				if (this.state.sortColumn === column.key) {
					th.classList.add(`sort-${this.state.sortDirection}`);
				}
			}
		});
	}

	private renderTableBody(table: HTMLTableElement): void {
		const tbody = table.createEl('tbody');

		if (this.state.filteredEntries.length === 0) {
			const row = tbody.createEl('tr');
			const cell = row.createEl('td', { attr: { colspan: '5' } });

			if (this.state.entries.length === 0) {
				const messageContainer = cell.createDiv('sfp-dashboard-empty');
				messageContainer.createDiv({
					text: 'No journal entries found',
					cls: 'sfp-dashboard-empty-title'
				});
				messageContainer.createDiv({
					text: 'Configure your dashboard settings to scan folders and select templates',
					cls: 'sfp-dashboard-empty-subtitle'
				});
			} else {
				const messageContainer = cell.createDiv('sfp-dashboard-filter-empty');
				messageContainer.createDiv({
					text: 'No entries match the current filter',
					cls: 'sfp-dashboard-filter-empty-title'
				});
				messageContainer.createDiv({
					text: 'Try selecting a different date range',
					cls: 'sfp-dashboard-filter-empty-subtitle'
				});
			}
			return;
		}

		this.state.filteredEntries.forEach(entry => {
			this.renderTableRow(tbody, entry);
		});
	}

	private renderTableRow(tbody: HTMLTableSectionElement, entry: DashboardEntry): void {
		const row = tbody.createEl('tr');

		// Check if we have search results for this entry
		const searchResult = this.state.searchResults.find(result => result.entry === entry);

		// Entry cell (date + file)
		const entryCell = row.createEl('td', { cls: 'entry-cell' });
		
		// Date on first line
		const dateDiv = entryCell.createDiv('entry-date');
		dateDiv.textContent = entry.date;
		
		// File link on second line
		const fileDiv = entryCell.createDiv('entry-file');
		const fileLink = fileDiv.createEl('a', {
			href: '#',
			cls: 'internal-link file-link',
			title: 'Open in new tab',
		});

		// Check if we have search results for filename
		const fileMatch = searchResult?.matches.find(match => match.field === 'file');
		const fileName = this.getFileName(entry.filePath);

		// Add opening parenthesis
		fileLink.appendChild(document.createTextNode('('));

		if (fileMatch && this.state.searchQuery) {
			this.highlightTextInElement(fileName, this.state.searchQuery, fileLink);
		} else {
			fileLink.appendChild(document.createTextNode(fileName));
		}

		// Add closing parenthesis
		fileLink.appendChild(document.createTextNode(')'))

		fileLink.addEventListener('click', e => {
			e.preventDefault();
			this.openFile(entry.filePath);
		});

		// Content cell with expansion
		const contentCell = row.createEl('td', { cls: 'content-cell' });
		this.renderExpandableContent(contentCell, entry);

		// Tags cell
		const tagsCell = row.createEl('td', { cls: 'tags-cell' });
		if (entry.tags && entry.tags.length > 0) {
			tagsCell.textContent = entry.tags.join(', ');
		} else {
			tagsCell.textContent = '';
		}

		// Word count cell (combined with unique words)
		const wordCountCell = row.createEl('td', { cls: 'count-cell words-combined' });
		
		// Total words on first line
		const totalWordsDiv = wordCountCell.createDiv('words-total');
		totalWordsDiv.textContent = String(entry.wordCount);
		
		// Unique words on second line
		const uniqueWordsDiv = wordCountCell.createDiv('words-unique');
		uniqueWordsDiv.textContent = `${entry.uniqueWordCount} unique`;

		// Image count cell
		const imageCountCell = row.createEl('td', { cls: 'count-cell' });
		imageCountCell.textContent = String(entry.imageCount);

		// Add right-click context menu for entry export
		row.addEventListener('contextmenu', e => {
			e.preventDefault();
			const menu = ExportContextMenu.createSimple(entry, (entry, format) =>
				this.handleEntryExport(entry, format)
			);
			menu.showAtMouseEvent(e);
		});
	}

	private renderExpandableContent(cell: HTMLElement, entry: DashboardEntry): void {
		const previewDiv = cell.createDiv('preview-text collapsed');

		// Check if we have search results for this entry
		const searchResult = this.state.searchResults.find(result => result.entry === entry);
		const contentMatch = searchResult?.matches.find(match => match.field === 'content');

		if (contentMatch && this.state.searchQuery) {
			this.createHighlightedParagraphElements(entry.preview, this.state.searchQuery, previewDiv);
		} else {
			this.createParagraphElements(entry.preview, previewDiv);
		}

		previewDiv.setAttribute('data-full-text', entry.fullContent);

		const button = cell.createEl('button');
		button.textContent = 'more';
		button.title = 'Expand to show full entry';
		button.addEventListener('click', () => {
			this.toggleContentExpansion(previewDiv, button);
		});
	}

	private toggleContentExpansion(previewDiv: HTMLElement, button: HTMLButtonElement): void {
		const isCollapsed = previewDiv.classList.contains('collapsed');
		const fullText = previewDiv.getAttribute('data-full-text') || '';

		// Check if we have search results for this content
		const searchQuery = this.state.searchQuery;
		const hasSearch = searchQuery && searchQuery.trim().length > 0;

		if (isCollapsed) {
			if (hasSearch) {
				this.createHighlightedParagraphElements(fullText, searchQuery, previewDiv);
			} else {
				this.createParagraphElements(fullText, previewDiv);
			}
			previewDiv.classList.remove('collapsed');
			previewDiv.classList.add('expanded');
			button.textContent = 'less';
			button.title = 'Collapse entry';
		} else {
			const words = fullText.split(/\s+/).filter(word => word.length > 0);
			const previewWords = words.slice(0, this.plugin.settings.dashboardSettings.previewWordLimit);
			const preview = previewWords.join(' ') + (words.length > previewWords.length ? '...' : '');
			if (hasSearch) {
				this.createHighlightedParagraphElements(preview, searchQuery, previewDiv);
			} else {
				this.createParagraphElements(preview, previewDiv);
			}
			previewDiv.classList.remove('expanded');
			previewDiv.classList.add('collapsed');
			button.textContent = 'more';
			button.title = 'Expand to show full entry';
		}
	}

	private formatTextWithParagraphs(text: string): string {
		if (!text) return '';

		// Split text by double line breaks (paragraph breaks)
		const paragraphs = text.split(/\n\s*\n/);

		// Wrap each paragraph in a div for proper spacing
		return paragraphs
			.map(paragraph => paragraph.trim())
			.filter(paragraph => paragraph.length > 0)
			.map(paragraph => `<div class="dashboard-paragraph">${paragraph}</div>`)
			.join('');
	}

	private createParagraphElements(text: string, container: HTMLElement): void {
		if (!text) return;

		// Clear existing content
		container.empty();

		// Split text by double line breaks (paragraph breaks)
		const paragraphs = text.split(/\n\s*\n/);

		// Create a div element for each paragraph
		paragraphs
			.map(paragraph => paragraph.trim())
			.filter(paragraph => paragraph.length > 0)
			.forEach(paragraph => {
				const paragraphDiv = container.createDiv('dashboard-paragraph');
				paragraphDiv.textContent = paragraph;
			});
	}

	private createHighlightedParagraphElements(text: string, query: string, container: HTMLElement): void {
		if (!text) return;

		// Clear existing content
		container.empty();

		// Split text by double line breaks (paragraph breaks)
		const paragraphs = text.split(/\n\s*\n/);

		// Create a div element for each paragraph with highlighting
		paragraphs
			.map(paragraph => paragraph.trim())
			.filter(paragraph => paragraph.length > 0)
			.forEach(paragraph => {
				const paragraphDiv = container.createDiv('dashboard-paragraph');
				this.highlightTextInElement(paragraph, query, paragraphDiv);
			});
	}

	private highlightTextInElement(text: string, query: string, element: HTMLElement): void {
		if (!query) {
			element.textContent = text;
			return;
		}

		const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		const parts = text.split(regex);

		parts.forEach((part, index) => {
			if (index % 2 === 1) {
				// This is a match - create a highlighted span
				const highlightSpan = element.createSpan('scribe-highlight');
				highlightSpan.textContent = part;
			} else {
				// This is regular text
				element.appendChild(document.createTextNode(part));
			}
		});
	}

	private async loadEntries(): Promise<void> {
		try {
			// Show loading state
			this.showLoadingState();

			// Update parser with current settings
			this.parser.updateSettings(this.plugin.settings);

			// Parse all entries
			this.state.entries = await this.parser.parseAllEntries();

			// Apply current filter, search, and sort
			this.applyFiltersAndSearch();

			// Re-render entire dashboard to update stats
			this.renderDashboard();
		} catch (error) {
			logger.error('DashboardView', 'loadEntries', 'Dashboard entries loading failed', {
				error: error.message,
				scanFolders: this.plugin.settings.dashboardSettings.scanFolders,
				parseTemplates: this.plugin.settings.dashboardSettings.parseTemplates,
			});
			this.showErrorState(error);
		}
	}

	private applyFiltersAndSearch(): void {
		// First apply date filters
		const dateFiltered = this.filterEntriesByDate();

		// Then apply search if there's a query
		if (this.state.searchQuery && this.state.searchQuery.trim().length > 0) {
			this.performSearchOnEntries(dateFiltered);
			this.state.filteredEntries = this.state.searchResults.map(result => result.entry);
		} else {
			this.state.filteredEntries = dateFiltered;
			this.state.searchResults = [];
		}

		// Apply current sort
		this.applySortToFilteredEntries();

		// Update statistics based on filtered entries
		this.updateStatistics();
	}

	private filterEntriesByDate(): DashboardEntry[] {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		return this.state.entries.filter(entry => {
			const entryDate = new Date(entry.date);

			switch (this.state.currentFilter) {
				case DateFilter.TODAY:
					return entryDate.getTime() === today.getTime();

				case DateFilter.THIS_WEEK:
					const startOfWeek = new Date(today);
					startOfWeek.setDate(today.getDate() - today.getDay());
					const endOfWeek = new Date(startOfWeek);
					endOfWeek.setDate(startOfWeek.getDate() + 6);
					return entryDate >= startOfWeek && entryDate <= endOfWeek;

				case DateFilter.THIS_MONTH:
					return entryDate.getFullYear() === now.getFullYear() && entryDate.getMonth() === now.getMonth();

				case DateFilter.LAST_30_DAYS:
					const thirtyDaysAgo = new Date(today);
					thirtyDaysAgo.setDate(today.getDate() - 30);
					return entryDate >= thirtyDaysAgo && entryDate <= today;

				case DateFilter.THIS_YEAR:
					return entryDate.getFullYear() === now.getFullYear();

				case DateFilter.ALL_TIME:
					return true;

				default:
					return true;
			}
		});
	}

	private performSearch(): void {
		this.applyFiltersAndSearch();
	}

	private performSearchOnEntries(entries: DashboardEntry[]): void {
		if (!this.state.searchQuery || this.state.searchQuery.trim().length === 0) {
			this.state.searchResults = [];
			return;
		}

		const searchFn = prepareSimpleSearch(this.state.searchQuery);
		const results: SearchResult[] = [];

		entries.forEach(entry => {
			const matches: SearchMatch[] = [];
			let totalScore = 0;

			this.state.searchFields.forEach(field => {
				if (!field.enabled) return;

				let searchText = '';
				switch (field.name) {
					case 'content':
						searchText = entry.fullContent;
						break;
					case 'file':
						searchText = this.getFileName(entry.filePath);
						break;
				}

				const searchResult = searchFn(searchText);
				if (searchResult) {
					matches.push({
						field: field.name,
						text: searchText,
						indices: [], // Simple highlighting without exact indices for now
					});
					totalScore += searchResult.score;
				}
			});

			if (matches.length > 0) {
				results.push({
					entry,
					matches,
					score: totalScore,
				});
			}
		});

		// Sort by score (higher is better)
		results.sort((a, b) => b.score - a.score);
		this.state.searchResults = results;
	}

	private sortEntries(column: string): void {
		const direction = this.state.sortColumn === column && this.state.sortDirection === 'asc' ? 'desc' : 'asc';
		this.state.sortColumn = column;
		this.state.sortDirection = direction;

		this.applySortToFilteredEntries();
	}

	private applySortToFilteredEntries(): void {
		const column = this.state.sortColumn;
		const direction = this.state.sortDirection;

		this.state.filteredEntries.sort((a, b) => {
			let aVal: any, bVal: any;

			switch (column) {
				case 'date':
					aVal = new Date(a.date);
					bVal = new Date(b.date);
					break;
				case 'title':
					aVal = a.title.toLowerCase();
					bVal = b.title.toLowerCase();
					break;
				case 'wordCount':
					aVal = a.wordCount;
					bVal = b.wordCount;
					break;
				case 'imageCount':
					aVal = a.imageCount;
					bVal = b.imageCount;
					break;
				case 'file':
					aVal = this.getFileName(a.filePath).toLowerCase();
					bVal = this.getFileName(b.filePath).toLowerCase();
					break;
				default:
					return 0;
			}

			if (aVal < bVal) return direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return direction === 'asc' ? 1 : -1;
			return 0;
		});
	}

	private getFileName(filePath: string): string {
		return filePath.split('/').pop() || filePath;
	}

	private async openFile(filePath: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file) {
			await this.app.workspace.openLinkText(filePath, '', false);
		}
	}

	async refresh(): Promise<void> {
		await this.loadEntries();
	}

	private highlightText(text: string, query: string): string {
		if (!query) return text;

		const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		return text.replace(regex, '<span class="scribe-highlight">$1</span>');
	}

	private setupSearchKeyboardShortcuts(searchInput: HTMLInputElement): void {
		this.containerEl.addEventListener('keydown', e => {
			// Only handle if not typing in an input (except for Ctrl+F)
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				if (e.key === 'Escape' && e.target === searchInput) {
					// Clear the search and trigger update
					searchInput.value = '';
					searchInput.dispatchEvent(new Event('input', { bubbles: true }));
					searchInput.blur();
				}
				return;
			}

			if (e.ctrlKey && e.key === 'f') {
				e.preventDefault();
				searchInput.focus();
			}
		});
	}

	private setupKeyboardShortcuts(selectEl: HTMLSelectElement): void {
		this.containerEl.addEventListener('keydown', e => {
			// Only handle if not typing in an input
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			switch (e.key.toLowerCase()) {
				case 'r':
					e.preventDefault();
					// Find refresh button and trigger its click to maintain consistent state handling
					const refreshBtn = this.containerEl.querySelector('.sfp-dashboard-header-controls button');
					if (refreshBtn) {
						(refreshBtn as HTMLButtonElement).click();
					}
					break;
				case '/':
					e.preventDefault();
					selectEl.focus();
					break;
				case 'escape':
					// Clear focus from any focused element
					(document.activeElement as HTMLElement)?.blur();
					break;
			}
		});
	}

	private showLoadingState(): void {
		const container = this.dashboardContentEl.querySelector('.sfp-scribeflow-dashboard');
		if (container) {
			const tableContainer = container.querySelector('.sfp-dashboard-table-container');
			if (tableContainer) {
				tableContainer.empty();
				const loadingDiv = tableContainer.createDiv('sfp-dashboard-loading');
				loadingDiv.textContent = 'Loading journal entries...';
			}
		}
	}

	private showErrorState(error: any): void {
		const container = this.dashboardContentEl.querySelector('.sfp-scribeflow-dashboard');
		if (container) {
			const tableContainer = container.querySelector('.sfp-dashboard-table-container');
			if (tableContainer) {
				tableContainer.empty();
				const errorDiv = tableContainer.createDiv('sfp-dashboard-error');
				
				errorDiv.textContent = `Error loading entries: ${error.message || 'Unknown error'}`;
				
				// Add line breaks
				errorDiv.createEl('br');
				errorDiv.createEl('br');
				
				// Add retry button
				const retryButton = errorDiv.createEl('button', { text: 'Retry' });
				retryButton.addEventListener('click', () => {
					container.dispatchEvent(new Event('refresh'));
				});
			}
		}
	}

	// Statistics Cards Methods
	private renderStatisticsCards(container: HTMLElement): void {
		const statisticsContainer = container.createDiv('sfp-dashboard-statistics-container');

		// Render layout toggle and statistics cards
		this.renderStatisticsHeader(statisticsContainer);

		if (this.state.statisticsGroupedView) {
			// Layout A: Grouped with Headers
			this.renderGroupedStatistics(statisticsContainer);
		} else {
			// Layout B: Flat Grid (default)
			this.renderFlatGridStatistics(statisticsContainer);
		}
	}

	private renderStatisticsHeader(container: HTMLElement): void {
		const header = container.createDiv('sfp-dashboard-statistics-header');

		// Create button container for proper spacing
		const buttonContainer = header.createDiv('sfp-dashboard-header-buttons');

		// Layout toggle button with dynamic text
		const buttonText = this.state.statisticsGroupedView ? 'Show Grid View' : 'Group by Category';
		const toggleButton = buttonContainer.createEl('button', {
			cls: 'sfp-dashboard-statistics-toggle',
			text: buttonText,
		});

		toggleButton.setAttribute('aria-pressed', this.state.statisticsGroupedView.toString());
		toggleButton.addEventListener('click', () => this.toggleStatisticsLayout());

		// Choose Metrics button
		const metricsButton = buttonContainer.createEl('button', {
			cls: 'sfp-dashboard-statistics-toggle sfp-choose-metrics-btn',
			text: 'Choose Metrics',
		});

		metricsButton.setAttribute('aria-expanded', this.state.metricsDropdownOpen.toString());
		metricsButton.addEventListener('click', (e) => {
			e.stopPropagation();
			this.toggleMetricsDropdown();
		});

		// Render metrics dropdown if open
		if (this.state.metricsDropdownOpen) {
			this.renderMetricsDropdown(header);
		}

		// Close dropdown when clicking outside
		this.addClickOutsideListener();
	}

	private toggleStatisticsLayout(): void {
		this.state.statisticsGroupedView = !this.state.statisticsGroupedView;

		// Save preference to settings
		this.plugin.settings.dashboardSettings.statisticsGroupedView = this.state.statisticsGroupedView;
		this.plugin.saveSettings();

		// Re-render statistics section
		this.refreshStatisticsCards();
	}

	private renderGroupedStatistics(container: HTMLElement): void {
		// Group 0: Goal Progress
		this.renderStatisticsGroup(container, 'Goals', [
			{ label: 'Daily goal', value: this.state.statistics.dailyGoalStatus, category: 'goals' },
			{ label: 'Weekly goal', value: this.state.statistics.weeklyGoalStatus, category: 'goals' },
			{ label: 'Monthly progress', value: this.state.statistics.monthlyGoalStatus, category: 'goals' },
		]);

		// Group 1: Overall Progress / Summary
		this.renderStatisticsGroup(container, 'Overall Progress', [
			{ label: 'Total entries', value: this.state.statistics.totalEntries, category: 'progress' },
			{ label: 'Total words', value: this.state.statistics.totalWords.toLocaleString(), category: 'progress' },
			{
				label: 'Avg Words/Entry',
				value: Math.round(this.state.statistics.averageWordsPerEntry),
				category: 'progress',
			},
		]);

		// Group 2: Consistency
		this.renderStatisticsGroup(container, 'Consistency', [
			{
				label: 'Current streak',
				value: this.state.statistics.currentJournalingStreak,
				suffix: 'days',
				category: 'consistency',
			},
			{
				label: 'Longest streak',
				value: this.state.statistics.longestJournalingStreak,
				suffix: 'days',
				category: 'consistency',
			},
			{ label: 'Days journaled', value: this.state.statistics.daysJournaled, category: 'consistency' },
			{
				label: 'Frequency',
				value: this.state.statistics.journalingFrequencyPercent.toFixed(1),
				suffix: '%',
				category: 'consistency',
			},
		]);

		// Group 3: Content Insights
		this.renderStatisticsGroup(container, 'Content insights', [
			{ label: 'Median words', value: this.state.statistics.medianWordCount, category: 'content' },
			{
				label: 'With images',
				value: this.state.statistics.entriesWithImagesPercent.toFixed(1),
				suffix: '%',
				category: 'content',
			},
			{
				label: 'With dreams',
				value: this.state.statistics.entriesWithDreamDiaryPercent.toFixed(1),
				suffix: '%',
				category: 'content',
			},
		]);

		// Group 4: Pattern Recognition
		this.renderStatisticsGroup(container, 'Patterns', [
			{ label: 'Most frequent day', value: this.state.statistics.mostFrequentDayOfWeek, category: 'pattern' },
			{ label: 'Most productive day', value: this.state.statistics.mostProductiveDayOfWeek, category: 'pattern' },
			{ label: 'Least productive day', value: this.state.statistics.leastProductiveDayOfWeek, category: 'pattern' },
		]);
	}

	private renderFlatGridStatistics(container: HTMLElement): void {
		const gridContainer = container.createDiv('sfp-dashboard-statistics-grid');
		const stats = this.getAllStatistics();

		stats.forEach(stat => {
			this.renderStatCard(gridContainer, stat.label, stat.value, stat.suffix, stat.category);
		});
	}

	private renderStatisticsGroup(container: HTMLElement, title: string, stats: StatCard[]): void {
		// Filter stats based on enabled categories
		const filteredStats = stats.filter(stat => {
			const category = this.mapStatCategoryToMetricCategory(stat.category);
			return category ? this.state.enabledMetrics[category] : true;
		});

		// Don't render empty groups
		if (filteredStats.length === 0) {
			return;
		}

		const group = container.createDiv('sfp-dashboard-statistics-group');

		const groupTitle = group.createDiv('sfp-dashboard-statistics-group-title');
		groupTitle.textContent = title;

		const groupGrid = group.createDiv('sfp-dashboard-statistics-grid');
		filteredStats.forEach(stat => {
			this.renderStatCard(groupGrid, stat.label, stat.value, stat.suffix, stat.category);
		});
	}

	private mapStatCategoryToMetricCategory(statCategory: string | undefined): keyof MetricCategories | null {
		switch (statCategory) {
			case 'goals': return 'goals';
			case 'progress': return 'progress';
			case 'consistency': return 'consistency';
			case 'content': return 'content';
			case 'pattern': return 'patterns';
			case 'vocabulary': return 'vocabulary';
			default: return null;
		}
	}

	private renderStatCard(
		container: HTMLElement,
		label: string,
		value: string | number,
		suffix?: string,
		category?: string
	): HTMLElement {
		const card = container.createDiv('sfp-dashboard-stat-card');

		if (category && !this.state.statisticsGroupedView) {
			card.addClass(`category-${category}`);
		}

		// Special handling for Longest Streak card
		if (label === 'Longest Streak') {
			this.setupLongestStreakCard(card, value, suffix);
		} else {
			// Standard card rendering
			const valueEl = card.createDiv('stat-value');
			if (typeof value === 'number' && value > 9999) {
				valueEl.addClass('large-number');
			}
			if (typeof value === 'string' && isNaN(Number(value))) {
				valueEl.addClass('text-value');
			}

			valueEl.textContent = value.toString();

			if (suffix) {
				const suffixEl = valueEl.createSpan('stat-suffix');
				suffixEl.textContent = suffix;
			}
		}

		const labelEl = card.createDiv('stat-label');
		labelEl.textContent = label;

		return card;
	}

	private setupLongestStreakCard(card: HTMLElement, value: string | number, suffix?: string): void {
		const dateRange = this.state.statistics.longestJournalingStreakDateRange;
		let isShowingDates = false;

		const valueEl = card.createDiv('stat-value');
		if (typeof value === 'number' && value > 9999) {
			valueEl.addClass('large-number');
		}

		// Initial display: show value + suffix
		const updateDisplay = () => {
			if (isShowingDates && dateRange) {
				valueEl.textContent = dateRange;
				valueEl.title = `${value}${suffix || ''} - Click to show streak length`;
			} else {
				valueEl.textContent = value.toString();
				if (suffix) {
					const suffixEl = valueEl.createSpan('stat-suffix');
					suffixEl.textContent = suffix;
				}
				if (dateRange) {
					valueEl.title = 'Click to show date range';
				}
			}
		};

		updateDisplay();

		// Add interactive behavior if we have a date range
		if (dateRange) {
			card.addClass('sfp-interactive-stat-card');
			card.style.cursor = 'pointer';

			// Click/tap to toggle
			card.addEventListener('click', () => {
				isShowingDates = !isShowingDates;
				// Clear existing content
				valueEl.empty();
				updateDisplay();
			});

			// Desktop: hover tooltip
			card.addEventListener('mouseenter', () => {
				if (!isShowingDates && dateRange) {
					card.title = dateRange;
				}
			});

			card.addEventListener('mouseleave', () => {
				card.title = '';
			});
		}
	}

	private getAllStatistics(): StatCard[] {
		const allStats: StatCard[] = [
			// Goal Progress
			{ label: 'Daily goal', value: this.state.statistics.dailyGoalStatus, category: 'goals' },
			{ label: 'Weekly goal', value: this.state.statistics.weeklyGoalStatus, category: 'goals' },
			{ label: 'Monthly progress', value: this.state.statistics.monthlyGoalStatus, category: 'goals' },

			// Overall Progress
			{ label: 'Total entries', value: this.state.statistics.totalEntries, category: 'progress' },
			{ label: 'Total words', value: this.state.statistics.totalWords.toLocaleString(), category: 'progress' },
			{
				label: 'Avg Words/Entry',
				value: Math.round(this.state.statistics.averageWordsPerEntry),
				category: 'progress',
			},

			// Consistency
			{
				label: 'Current streak',
				value: this.state.statistics.currentJournalingStreak,
				suffix: 'days',
				category: 'consistency',
			},
			{
				label: 'Longest streak',
				value: this.state.statistics.longestJournalingStreak,
				suffix: 'days',
				category: 'consistency',
			},
			{ label: 'Days journaled', value: this.state.statistics.daysJournaled, category: 'consistency' },
			{
				label: 'Frequency',
				value: this.state.statistics.journalingFrequencyPercent.toFixed(1),
				suffix: '%',
				category: 'consistency',
			},

			// Content Insights
			{ label: 'Median words', value: this.state.statistics.medianWordCount, category: 'content' },
			{
				label: 'With images',
				value: this.state.statistics.entriesWithImagesPercent.toFixed(1),
				suffix: '%',
				category: 'content',
			},
			{
				label: 'With dreams',
				value: this.state.statistics.entriesWithDreamDiaryPercent.toFixed(1),
				suffix: '%',
				category: 'content',
			},

			// Pattern Recognition
			{ label: 'Most frequent day', value: this.state.statistics.mostFrequentDayOfWeek, category: 'pattern' },
			{ label: 'Most productive day', value: this.state.statistics.mostProductiveDayOfWeek, category: 'pattern' },
			{ label: 'Least productive day', value: this.state.statistics.leastProductiveDayOfWeek, category: 'pattern' },
		];

		// Filter stats based on enabled metric categories
		return allStats.filter(stat => {
			const category = this.mapStatCategoryToMetricCategory(stat.category);
			return category ? this.state.enabledMetrics[category] : true;
		});
	}

	private refreshStatisticsCards(): void {
		const statisticsContainer = this.dashboardContentEl.querySelector('.sfp-dashboard-statistics-container');
		if (statisticsContainer) {
			statisticsContainer.remove();
		}

		const container = this.dashboardContentEl.querySelector('.sfp-scribeflow-dashboard') as HTMLElement;
		if (container) {
			// Find the header and insert statistics after it
			const header = container.querySelector('.sfp-dashboard-header');
			if (header && !this.state.headerCollapsed) {
				// Create the statistics container manually and insert it after the header
				const statisticsContainer = container.createDiv('sfp-dashboard-statistics-container');

				// Move it to the correct position (after header, before search)
				const searchSection = container.querySelector('.sfp-search-section');
				if (searchSection) {
					container.insertBefore(statisticsContainer, searchSection);
				} else {
					// If no search section, insert after header
					header.insertAdjacentElement('afterend', statisticsContainer);
				}

				// Render the content into the correctly positioned container
				this.renderStatisticsHeader(statisticsContainer);

				if (this.state.statisticsGroupedView) {
					this.renderGroupedStatistics(statisticsContainer);
				} else {
					this.renderFlatGridStatistics(statisticsContainer);
				}
			}
		}
	}

	private updateStatistics(): void {
		this.state.statistics = DashboardStatisticsCalculator.calculateStatistics(
			this.state.filteredEntries,
			this.state.currentFilter,
			this.state.searchQuery,
			this.parser.getParsedTemplates(),
			{
				dailyWordGoal: this.plugin.settings.dashboardSettings.dailyWordGoal,
				weeklyConsistencyGoal: this.plugin.settings.dashboardSettings.weeklyConsistencyGoal
			}
		);
	}

	// Export handlers
	private async handleDashboardExport(format: DashboardExportFormat): Promise<void> {
		try {
			const result = await this.dashboardExporter.exportDashboardData(
				this.state.filteredEntries,
				this.state.statistics,
				this.state.currentFilter,
				this.state.searchQuery,
				{
					format,
					destination: format === DashboardExportFormat.MARKDOWN_TABLE ? 'clipboard' : 'file',
					includeStatistics: true,
				}
			);

			if (!result.success) {
				logger.error('DashboardView', 'handleDashboardExport', 'Dashboard export failed', {
					format,
					message: result.message,
					entriesCount: this.state.filteredEntries.length,
				});
			}
		} catch (error) {
			logger.error('DashboardView', 'handleDashboardExport', 'Dashboard export error', {
				format,
				error: error.message,
				entriesCount: this.state.filteredEntries.length,
			});
		}
	}

	private async handleEntryExport(entry: DashboardEntry, format: EntryExportFormat): Promise<void> {
		try {
			const result = await this.entryExporter.exportEntry(entry, format, {
				format,
				destination: 'file',
			});

			if (!result.success) {
				logger.error('DashboardView', 'handleEntryExport', 'Entry export failed', {
					format,
					message: result.message,
					entryPath: entry.filePath,
					entryDate: entry.date,
				});
			}
		} catch (error) {
			logger.error('DashboardView', 'handleEntryExport', 'Entry export error', {
				format,
				error: error.message,
				entryPath: entry.filePath,
				entryDate: entry.date,
			});
		}
	}

	private toggleMetricsDropdown(): void {
		this.state.metricsDropdownOpen = !this.state.metricsDropdownOpen;
		this.refreshStatisticsCards();
	}

	private renderMetricsDropdown(container: HTMLElement): void {
		const dropdown = container.createDiv('sfp-metrics-dropdown');
		
		// Dropdown content
		const content = dropdown.createDiv('sfp-metrics-dropdown-content');
		content.createEl('h4', { text: 'Choose metrics to display' });
		
		const categories = [
			{ key: 'goals', label: 'Goals', desc: 'Daily and weekly goal progress tracking' },
			{ key: 'progress', label: 'Progress', desc: 'Total entries, words, averages' },
			{ key: 'consistency', label: 'Consistency', desc: 'Streaks, frequency, days journaled' },
			{ key: 'content', label: 'Content', desc: 'Median words, images, dreams' },
			{ key: 'patterns', label: 'Patterns', desc: 'Day-based frequency and productivity' },
			{ key: 'vocabulary', label: 'Vocabulary', desc: 'Unique words, richness (future)' },
		];

		categories.forEach(category => {
			const option = content.createDiv('sfp-metrics-option');
			
			const checkbox = option.createEl('input', {
				type: 'checkbox',
				attr: { id: `metric-${category.key}` }
			}) as HTMLInputElement;
			
			checkbox.checked = this.state.enabledMetrics[category.key as keyof MetricCategories];
			checkbox.addEventListener('change', () => {
				this.state.enabledMetrics[category.key as keyof MetricCategories] = checkbox.checked;
				this.refreshStatisticsCards();
			});

			const label = option.createEl('label', { 
				attr: { for: `metric-${category.key}` },
				cls: 'sfp-metrics-label'
			});
			
			label.createSpan({ text: category.label, cls: 'sfp-metrics-label-title' });
			label.createSpan({ text: category.desc, cls: 'sfp-metrics-label-desc' });
		});
	}

	private addClickOutsideListener(): void {
		// Remove any existing listener first
		this.removeClickOutsideListener();
		
		this.clickOutsideHandler = (event: MouseEvent) => {
			const target = event.target as Element;
			if (!target.closest('.sfp-metrics-dropdown') && !target.closest('.sfp-choose-metrics-btn')) {
				this.state.metricsDropdownOpen = false;
				this.refreshStatisticsCards();
			}
		};
		
		document.addEventListener('click', this.clickOutsideHandler);
	}

	private removeClickOutsideListener(): void {
		if (this.clickOutsideHandler) {
			document.removeEventListener('click', this.clickOutsideHandler);
			this.clickOutsideHandler = null;
		}
	}

	private clickOutsideHandler: ((event: MouseEvent) => void) | null = null;

}
