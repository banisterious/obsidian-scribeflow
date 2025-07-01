import { ItemView, WorkspaceLeaf, prepareSimpleSearch, SearchComponent } from 'obsidian';
import ScribeFlowPlugin from '../main';
import { DashboardEntry, DateFilter, DashboardState, SearchResult, SearchMatch, DashboardStatistics, StatCard } from '../types/dashboard';
import { DashboardParser } from '../services/DashboardParser';
import { DashboardStatisticsCalculator } from '../services/DashboardStatisticsCalculator';

export const DASHBOARD_VIEW_TYPE = 'scribeflow-dashboard';

export class DashboardView extends ItemView {
    private plugin: ScribeFlowPlugin;
    private state: DashboardState;
    private dashboardContentEl: HTMLElement;
    private parser: DashboardParser;

    constructor(leaf: WorkspaceLeaf, plugin: ScribeFlowPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.parser = new DashboardParser(this.app, this.plugin.settings);
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
                { name: 'file', label: 'Filename', enabled: false }
            ],
            headerCollapsed: true,
            statistics: DashboardStatisticsCalculator.calculateStatistics([], DateFilter.ALL_TIME),
            statisticsGroupedView: this.plugin.settings.dashboardSettings.statisticsGroupedView ?? false
        };
    }

    getViewType(): string {
        return DASHBOARD_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Scribe Dashboard';
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
        // Cleanup if needed
    }

    private renderDashboard(): void {
        this.dashboardContentEl.empty();
        
        // Create main container
        const container = this.dashboardContentEl.createDiv('scribeflow-dashboard');
        
        // Render header
        this.renderHeader(container);
        
        // Render statistics cards (only if header not collapsed)
        if (!this.state.headerCollapsed) {
            try {
                this.renderStatisticsCards(container);
            } catch (error) {
                console.error('ScribeFlow: Error rendering statistics cards:', error);
                // Continue rendering the rest of the dashboard
            }
        }
        
        // Render search section (only if header not collapsed)
        if (!this.state.headerCollapsed) {
            this.renderSearchSection(container);
        }
        
        // Render controls
        this.renderControls(container);
        
        // Render table
        this.renderTable(container);
    }

    private renderHeader(container: HTMLElement): void {
        const header = container.createDiv('dashboard-header');
        
        // Header top bar with title and toggle
        const headerTop = header.createDiv('dashboard-header-top');
        
        const titleSection = headerTop.createDiv('dashboard-title-section');
        titleSection.createEl('h1', { text: 'Scribe Dashboard' });
        
        // Add controls (toggle + refresh)
        const controls = headerTop.createDiv('dashboard-header-controls');
        
        // Collapse/expand toggle (left of refresh)
        const toggleBtnText = this.state.headerCollapsed ? 'Expand' : 'Collapse';
        const toggleBtn = controls.createEl('button', { 
            text: toggleBtnText,
            cls: 'dashboard-toggle-btn'
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
            const headerContent = header.createDiv('dashboard-header-content');
            
            headerContent.createEl('p', { 
                text: 'Overview of your journaling activity and trends',
                cls: 'dashboard-subtitle'
            });
        }
    }
    
    private renderSummaryStats(header: HTMLElement): void {
        const statsContainer = header.createDiv('dashboard-stats');
        
        const totalEntries = this.state.entries.length;
        const filteredEntries = this.state.filteredEntries.length;
        const avgWords = totalEntries > 0 ? 
            Math.round(this.state.entries.reduce((sum, entry) => sum + entry.wordCount, 0) / totalEntries) : 0;
        
        // Calculate this month count
        const now = new Date();
        const thisMonthCount = this.state.entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getFullYear() === now.getFullYear() && 
                   entryDate.getMonth() === now.getMonth();
        }).length;
        
        const stats = [
            { label: 'Total Entries', value: totalEntries.toString() },
            { label: 'Showing', value: filteredEntries.toString() },
            { label: 'Average Words', value: avgWords.toString() },
            { label: 'This Month', value: thisMonthCount.toString() }
        ];
        
        stats.forEach(stat => {
            const statItem = statsContainer.createDiv('stat-item');
            statItem.createDiv({ text: stat.label, cls: 'stat-label' });
            statItem.createDiv({ text: stat.value, cls: 'stat-value' });
        });
    }
    
    private renderSearchSection(container: HTMLElement): void {
        const searchSection = container.createDiv('search-section');
        
        // Search container
        const searchContainer = searchSection.createDiv('search-container');
        
        // Search input wrapper
        const searchInputWrapper = searchContainer.createDiv('search-input-wrapper');
        
        // Create Obsidian's native SearchComponent
        const searchComponent = new SearchComponent(searchInputWrapper);
        searchComponent.setPlaceholder('Search entries by content or filename...');
        if (this.state.searchQuery) {
            searchComponent.setValue(this.state.searchQuery);
        }
        
        // Search options
        const searchOptions = searchContainer.createDiv('search-options');
        this.state.searchFields.forEach(field => {
            const option = searchOptions.createDiv('search-option');
            const checkbox = option.createEl('input', {
                attr: { type: 'checkbox', id: `search-${field.name}` }
            });
            checkbox.checked = field.enabled;
            
            option.createEl('label', {
                text: field.label,
                attr: { for: `search-${field.name}` }
            });
            
            checkbox.addEventListener('change', () => {
                field.enabled = checkbox.checked;
                this.performSearch();
            });
        });
        
        // Search results info
        const searchResultsInfo = searchSection.createDiv('search-results-info');
        const resultsCount = searchResultsInfo.createDiv('search-results-count');
        this.updateSearchResultsDisplay(resultsCount);
        
        // Search shortcuts
        const shortcuts = searchResultsInfo.createDiv('search-shortcuts');
        shortcuts.innerHTML = `
            <span class="shortcut-hint">Ctrl+F</span> to search
            <span class="shortcut-hint">Esc</span> to clear
        `;
        
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
        const controls = container.createDiv('dashboard-controls');
        
        // Date filter dropdown
        const filterContainer = controls.createDiv('filter-container');
        filterContainer.createEl('label', { text: 'Filter: ' });
        
        const select = filterContainer.createEl('select');
        const filterOptions = [
            { value: DateFilter.ALL_TIME, label: 'All Time' },
            { value: DateFilter.TODAY, label: 'Today' },
            { value: DateFilter.THIS_WEEK, label: 'This Week' },
            { value: DateFilter.THIS_MONTH, label: 'This Month' },
            { value: DateFilter.LAST_30_DAYS, label: 'Last 30 Days' },
            { value: DateFilter.THIS_YEAR, label: 'This Year' }
        ];
        
        filterOptions.forEach(option => {
            const optionEl = select.createEl('option', { 
                value: option.value, 
                text: option.label 
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
        
        // Add refresh event listener
        container.addEventListener('refresh', () => {
            this.refresh();
        });
        
        // Add keyboard shortcuts
        this.setupKeyboardShortcuts(select);
    }

    private renderTable(container: HTMLElement): void {
        // Remove existing table
        const existingTable = container.querySelector('.dashboard-table-container');
        if (existingTable) {
            existingTable.remove();
        }
        
        const tableContainer = container.createDiv('dashboard-table-container');
        const table = tableContainer.createEl('table', { cls: 'dashboard-table' });
        
        // Render table header
        this.renderTableHeader(table);
        
        // Render table body
        this.renderTableBody(table);
    }

    private renderTableHeader(table: HTMLTableElement): void {
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        
        const columns = [
            { key: 'date', label: 'Date', sortable: true },
            { key: 'content', label: 'Journal Entry', sortable: false },
            { key: 'wordCount', label: 'Words', sortable: true },
            { key: 'imageCount', label: 'Images', sortable: true },
            { key: 'file', label: 'File', sortable: true }
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
                cell.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <div style="font-size: 16px; margin-bottom: 8px;">No journal entries found</div>
                        <div style="font-size: 14px;">Configure your dashboard settings to scan folders and select templates</div>
                    </div>
                `;
            } else {
                cell.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <div style="font-size: 16px; margin-bottom: 8px;">No entries match the current filter</div>
                        <div style="font-size: 14px;">Try selecting a different date range</div>
                    </div>
                `;
            }
            return;
        }
        
        this.state.filteredEntries.forEach(entry => {
            this.renderTableRow(tbody, entry);
        });
    }

    private renderTableRow(tbody: HTMLTableSectionElement, entry: DashboardEntry): void {
        const row = tbody.createEl('tr');
        
        // Date cell
        const dateCell = row.createEl('td', { cls: 'date-cell' });
        dateCell.textContent = entry.date;
        
        // Content cell with expansion
        const contentCell = row.createEl('td', { cls: 'content-cell' });
        
        // Check if we have search results for this entry
        const searchResult = this.state.searchResults.find(result => result.entry === entry);
        this.renderExpandableContent(contentCell, entry);
        
        // Word count cell
        const wordCountCell = row.createEl('td', { cls: 'count-cell' });
        wordCountCell.textContent = String(entry.wordCount);
        
        // Image count cell
        const imageCountCell = row.createEl('td', { cls: 'count-cell' });
        imageCountCell.textContent = String(entry.imageCount);
        
        // File link cell
        const fileCell = row.createEl('td', { cls: 'file-cell' });
        const fileLink = fileCell.createEl('a', { 
            href: '#',
            cls: 'internal-link'
        });
        
        // Check if we have search results for filename
        const fileMatch = searchResult?.matches.find(match => match.field === 'file');
        const fileName = this.getFileName(entry.filePath);
        
        if (fileMatch && this.state.searchQuery) {
            fileLink.innerHTML = this.highlightText(fileName, this.state.searchQuery);
        } else {
            fileLink.textContent = fileName;
        }
        
        fileLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.openFile(entry.filePath);
        });
    }

    private renderExpandableContent(cell: HTMLElement, entry: DashboardEntry): void {
        const previewDiv = cell.createDiv('preview-text collapsed');
        
        // Check if we have search results for this entry
        const searchResult = this.state.searchResults.find(result => result.entry === entry);
        const contentMatch = searchResult?.matches.find(match => match.field === 'content');
        
        if (contentMatch && this.state.searchQuery) {
            previewDiv.innerHTML = this.highlightText(this.formatTextWithParagraphs(entry.preview), this.state.searchQuery);
        } else {
            previewDiv.innerHTML = this.formatTextWithParagraphs(entry.preview);
        }
        
        previewDiv.setAttribute('data-full-text', entry.fullContent);
        
        const button = cell.createEl('button');
        button.textContent = 'more';
        button.addEventListener('click', () => {
            this.toggleContentExpansion(previewDiv, button);
        });
    }

    private toggleContentExpansion(previewDiv: HTMLElement, button: HTMLButtonElement): void {
        const isCollapsed = previewDiv.classList.contains('collapsed');
        const fullText = previewDiv.getAttribute('data-full-text') || '';
        
        if (isCollapsed) {
            previewDiv.innerHTML = this.formatTextWithParagraphs(fullText);
            previewDiv.classList.remove('collapsed');
            previewDiv.classList.add('expanded');
            button.textContent = 'less';
        } else {
            const words = fullText.split(/\s+/).filter(word => word.length > 0);
            const previewWords = words.slice(0, this.plugin.settings.dashboardSettings.previewWordLimit);
            const preview = previewWords.join(' ') + (words.length > previewWords.length ? '...' : '');
            previewDiv.innerHTML = this.formatTextWithParagraphs(preview);
            previewDiv.classList.remove('expanded');
            previewDiv.classList.add('collapsed');
            button.textContent = 'more';
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
            this.sortEntries(this.state.sortColumn);
            
            // Re-render entire dashboard to update stats
            this.renderDashboard();
            
        } catch (error) {
            console.error('Failed to load dashboard entries:', error);
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
                    return entryDate.getFullYear() === now.getFullYear() && 
                           entryDate.getMonth() === now.getMonth();
                           
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
                        indices: []  // Simple highlighting without exact indices for now
                    });
                    totalScore += searchResult.score;
                }
            });
            
            if (matches.length > 0) {
                results.push({
                    entry,
                    matches,
                    score: totalScore
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
        return text.replace(regex, '<span class="highlight">$1</span>');
    }
    
    private setupSearchKeyboardShortcuts(searchInput: HTMLInputElement): void {
        this.containerEl.addEventListener('keydown', (e) => {
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
        this.containerEl.addEventListener('keydown', (e) => {
            // Only handle if not typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            
            switch (e.key.toLowerCase()) {
                case 'r':
                    e.preventDefault();
                    // Find refresh button and trigger its click to maintain consistent state handling
                    const refreshBtn = this.containerEl.querySelector('.dashboard-header-controls button');
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
        const container = this.dashboardContentEl.querySelector('.scribeflow-dashboard');
        if (container) {
            const tableContainer = container.querySelector('.dashboard-table-container');
            if (tableContainer) {
                tableContainer.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading journal entries...</div>';
            }
        }
    }

    private showErrorState(error: any): void {
        const container = this.dashboardContentEl.querySelector('.scribeflow-dashboard');
        if (container) {
            const tableContainer = container.querySelector('.dashboard-table-container');
            if (tableContainer) {
                tableContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-error);">
                    Error loading entries: ${error.message || 'Unknown error'}
                    <br><br>
                    <button onclick="this.closest('.scribeflow-dashboard').dispatchEvent(new Event('refresh'))">Retry</button>
                </div>`;
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
        
        // Layout toggle button with dynamic text
        const buttonText = this.state.statisticsGroupedView ? 'Show Grid View' : 'Group by Category';
        const toggleButton = header.createEl('button', {
            cls: 'sfp-dashboard-statistics-toggle',
            text: buttonText
        });
        
        toggleButton.setAttribute('aria-pressed', this.state.statisticsGroupedView.toString());
        toggleButton.addEventListener('click', () => this.toggleStatisticsLayout());
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
        // Group 1: Overall Progress / Summary
        this.renderStatisticsGroup(container, 'Overall Progress', [
            {label: 'Total Entries', value: this.state.statistics.totalEntries, category: 'progress'},
            {label: 'Total Words', value: this.state.statistics.totalWords.toLocaleString(), category: 'progress'},
            {label: 'Avg Words/Entry', value: Math.round(this.state.statistics.averageWordsPerEntry), category: 'progress'}
        ]);
        
        // Group 2: Consistency
        this.renderStatisticsGroup(container, 'Consistency', [
            {label: 'Current Streak', value: this.state.statistics.currentJournalingStreak, suffix: 'days', category: 'consistency'},
            {label: 'Longest Streak', value: this.state.statistics.longestJournalingStreak, suffix: 'days', category: 'consistency'},
            {label: 'Days Journaled', value: this.state.statistics.daysJournaled, category: 'consistency'},
            {label: 'Frequency', value: this.state.statistics.journalingFrequencyPercent.toFixed(1), suffix: '%', category: 'consistency'}
        ]);
        
        // Group 3: Content Insights
        this.renderStatisticsGroup(container, 'Content Insights', [
            {label: 'Median Words', value: this.state.statistics.medianWordCount, category: 'content'},
            {label: 'With Images', value: this.state.statistics.entriesWithImagesPercent.toFixed(1), suffix: '%', category: 'content'},
            {label: 'With Dreams', value: this.state.statistics.entriesWithDreamDiaryPercent.toFixed(1), suffix: '%', category: 'content'}
        ]);
        
        // Group 4: Pattern Recognition
        this.renderStatisticsGroup(container, 'Patterns', [
            {label: 'Most Active Day', value: this.state.statistics.mostActiveDayOfWeek, category: 'pattern'}
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
        const group = container.createDiv('sfp-dashboard-statistics-group');
        
        const groupTitle = group.createDiv('sfp-dashboard-statistics-group-title');
        groupTitle.textContent = title;
        
        const groupGrid = group.createDiv('sfp-dashboard-statistics-grid');
        stats.forEach(stat => {
            this.renderStatCard(groupGrid, stat.label, stat.value, stat.suffix, stat.category);
        });
    }

    private renderStatCard(container: HTMLElement, label: string, value: string | number, suffix?: string, category?: string): HTMLElement {
        const card = container.createDiv('sfp-dashboard-stat-card');
        
        if (category && !this.state.statisticsGroupedView) {
            card.addClass(`category-${category}`);
        }
        
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
        
        const labelEl = card.createDiv('stat-label');
        labelEl.textContent = label;
        
        return card;
    }

    private getAllStatistics(): StatCard[] {
        return [
            // Overall Progress
            {label: 'Total Entries', value: this.state.statistics.totalEntries, category: 'progress'},
            {label: 'Total Words', value: this.state.statistics.totalWords.toLocaleString(), category: 'progress'},
            {label: 'Avg Words/Entry', value: Math.round(this.state.statistics.averageWordsPerEntry), category: 'progress'},
            
            // Consistency
            {label: 'Current Streak', value: this.state.statistics.currentJournalingStreak, suffix: 'days', category: 'consistency'},
            {label: 'Longest Streak', value: this.state.statistics.longestJournalingStreak, suffix: 'days', category: 'consistency'},
            {label: 'Days Journaled', value: this.state.statistics.daysJournaled, category: 'consistency'},
            {label: 'Frequency', value: this.state.statistics.journalingFrequencyPercent.toFixed(1), suffix: '%', category: 'consistency'},
            
            // Content Insights
            {label: 'Median Words', value: this.state.statistics.medianWordCount, category: 'content'},
            {label: 'With Images', value: this.state.statistics.entriesWithImagesPercent.toFixed(1), suffix: '%', category: 'content'},
            {label: 'With Dreams', value: this.state.statistics.entriesWithDreamDiaryPercent.toFixed(1), suffix: '%', category: 'content'},
            
            // Pattern Recognition
            {label: 'Most Active Day', value: this.state.statistics.mostActiveDayOfWeek, category: 'pattern'}
        ];
    }

    private refreshStatisticsCards(): void {
        const statisticsContainer = this.dashboardContentEl.querySelector('.sfp-dashboard-statistics-container');
        if (statisticsContainer) {
            statisticsContainer.remove();
        }
        
        const container = this.dashboardContentEl.querySelector('.scribeflow-dashboard') as HTMLElement;
        if (container) {
            // Find the header and insert statistics after it
            const header = container.querySelector('.dashboard-header');
            if (header && !this.state.headerCollapsed) {
                // Create the statistics container manually and insert it after the header
                const statisticsContainer = container.createDiv('sfp-dashboard-statistics-container');
                
                // Move it to the correct position (after header, before search)
                const searchSection = container.querySelector('.search-section');
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
            this.state.searchQuery
        );
    }
}