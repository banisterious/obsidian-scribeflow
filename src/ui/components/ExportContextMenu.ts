import { Menu, setIcon } from 'obsidian';
import { DashboardEntry } from '../../types/dashboard';
import { EntryExportFormat } from '../../services/export/types';

export class ExportContextMenu {
	static create(
		entry: DashboardEntry,
		onExport: (entry: DashboardEntry, format: EntryExportFormat) => void,
		selectedEntries?: DashboardEntry[]
	): Menu {
		const menu = new Menu();

		// If multiple entries are selected, show multi-export options
		if (selectedEntries && selectedEntries.length > 1) {
			menu.addItem(item => {
				item.setTitle(`Export selected (${selectedEntries.length})`)
					.setIcon('download')
					.onClick(() => {
						// Show submenu for format selection
						const submenu = new Menu();

						submenu.addItem(subitem => {
							subitem
								.setTitle('Markdown (.md)')
								.setIcon('file-text')
								.onClick(() => {
									selectedEntries.forEach(entry => onExport(entry, EntryExportFormat.MARKDOWN));
								});
						});

						submenu.addItem(subitem => {
							subitem
								.setTitle('Plain Text (.txt)')
								.setIcon('type')
								.onClick(() => {
									selectedEntries.forEach(entry => onExport(entry, EntryExportFormat.PLAIN_TEXT));
								});
						});

						submenu.addItem(subitem => {
							subitem
								.setTitle('PDF (.pdf)')
								.setIcon('file')
								.onClick(() => {
									selectedEntries.forEach(entry => onExport(entry, EntryExportFormat.PDF));
								});
						});

						submenu.addItem(subitem => {
							subitem
								.setTitle('Image (.png)')
								.setIcon('image')
								.onClick(() => {
									selectedEntries.forEach(entry => onExport(entry, EntryExportFormat.IMAGE));
								});
						});

						submenu.showAtMouseEvent(event as MouseEvent);
					});
			});
		} else {
			// Single entry export options
			menu.addItem(item => {
				item.setTitle('Export as Markdown')
					.setIcon('file-text')
					.onClick(() => onExport(entry, EntryExportFormat.MARKDOWN));
			});

			menu.addItem(item => {
				item.setTitle('Export as plain text')
					.setIcon('type')
					.onClick(() => onExport(entry, EntryExportFormat.PLAIN_TEXT));
			});

			menu.addItem(item => {
				item.setTitle('Export as PDF')
					.setIcon('file')
					.onClick(() => onExport(entry, EntryExportFormat.PDF));
			});

			menu.addItem(item => {
				item.setTitle('Export as Image')
					.setIcon('image')
					.onClick(() => onExport(entry, EntryExportFormat.IMAGE));
			});
		}

		return menu;
	}

	static createSimple(
		entry: DashboardEntry,
		onExport: (entry: DashboardEntry, format: EntryExportFormat) => void
	): Menu {
		const menu = new Menu();

		menu.addItem(item => {
			item.setTitle('Export as Markdown')
				.setIcon('file-text')
				.onClick(() => onExport(entry, EntryExportFormat.MARKDOWN));
		});

		menu.addItem(item => {
			item.setTitle('Export as plain text')
				.setIcon('type')
				.onClick(() => onExport(entry, EntryExportFormat.PLAIN_TEXT));
		});

		menu.addItem(item => {
			item.setTitle('Export as PDF')
				.setIcon('file')
				.onClick(() => onExport(entry, EntryExportFormat.PDF));
		});

		menu.addItem(item => {
			item.setTitle('Export as Image')
				.setIcon('image')
				.onClick(() => onExport(entry, EntryExportFormat.IMAGE));
		});

		return menu;
	}
}
