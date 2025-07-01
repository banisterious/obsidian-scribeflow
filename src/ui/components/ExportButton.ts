import { Component, setIcon } from 'obsidian';
import { DashboardExportFormat } from '../../services/export/types';

export class ExportButton extends Component {
    private containerEl: HTMLElement;
    private onExport: (format: DashboardExportFormat) => void;
    private dropdown: HTMLElement;
    private button: HTMLElement;
    private isOpen: boolean = false;

    constructor(containerEl: HTMLElement, onExport: (format: DashboardExportFormat) => void) {
        super();
        this.containerEl = containerEl;
        this.onExport = onExport;
    }

    onload(): void {
        this.render();
        this.setupEventListeners();
    }

    onunload(): void {
        this.cleanup();
    }

    private render(): void {
        const exportContainer = this.containerEl.createDiv('sfp-export-container');
        
        // Export button
        this.button = exportContainer.createEl('button', {
            cls: 'sfp-export-button'
        });

        // Button content
        const buttonIcon = this.button.createSpan('sfp-export-button-icon');
        setIcon(buttonIcon, 'download');
        
        this.button.createSpan({
            text: 'Export',
            cls: 'sfp-export-button-text'
        });

        const chevronIcon = this.button.createSpan('sfp-export-button-chevron');
        setIcon(chevronIcon, 'chevron-down');

        // Dropdown container
        this.dropdown = exportContainer.createDiv('sfp-export-dropdown');
        this.dropdown.style.display = 'none';

        // Dropdown options
        this.createDropdownOption(
            this.dropdown,
            'clipboard',
            'Copy as Markdown Table',
            'Copy formatted table to clipboard',
            DashboardExportFormat.MARKDOWN_TABLE
        );

        this.createDropdownOption(
            this.dropdown,
            'file-spreadsheet',
            'Save as CSV File',
            'Export data for Excel or analysis',
            DashboardExportFormat.CSV
        );

        this.createDropdownOption(
            this.dropdown,
            'braces',
            'Save as JSON File',
            'Export structured data with metadata',
            DashboardExportFormat.JSON
        );
    }

    private createDropdownOption(
        dropdown: HTMLElement,
        iconName: string,
        title: string,
        description: string,
        format: DashboardExportFormat
    ): void {
        const option = dropdown.createDiv('sfp-export-option');
        
        // Icon
        const iconEl = option.createDiv('sfp-export-option-icon');
        setIcon(iconEl, iconName);
        
        // Content
        const content = option.createDiv('sfp-export-option-content');
        content.createDiv({
            text: title,
            cls: 'sfp-export-option-title'
        });
        content.createDiv({
            text: description,
            cls: 'sfp-export-option-description'
        });

        // Click handler
        option.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.onExport(format);
            this.closeDropdown();
        });
    }

    private setupEventListeners(): void {
        // Toggle dropdown on button click
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.containerEl.contains(e.target as Node)) {
                this.closeDropdown();
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeDropdown();
            }
        });
    }

    private toggleDropdown(): void {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    private openDropdown(): void {
        this.isOpen = true;
        this.dropdown.style.display = 'block';
        
        // Update chevron icon
        const chevronIcon = this.button.querySelector('.sfp-export-button-chevron');
        if (chevronIcon) {
            setIcon(chevronIcon as HTMLElement, 'chevron-up');
        }
        
        // Add active class to button
        this.button.classList.add('sfp-export-button-active');
    }

    private closeDropdown(): void {
        this.isOpen = false;
        this.dropdown.style.display = 'none';
        
        // Update chevron icon
        const chevronIcon = this.button.querySelector('.sfp-export-button-chevron');
        if (chevronIcon) {
            setIcon(chevronIcon as HTMLElement, 'chevron-down');
        }
        
        // Remove active class from button
        this.button.classList.remove('sfp-export-button-active');
    }

    private cleanup(): void {
        document.removeEventListener('click', this.closeDropdown);
        document.removeEventListener('keydown', this.closeDropdown);
    }
}