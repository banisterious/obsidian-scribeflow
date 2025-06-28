import { AbstractInputSuggest, App, TFile } from 'obsidian';

export class FileSuggest extends AbstractInputSuggest<TFile> {
    private selectCallback?: (file: TFile, evt: MouseEvent | KeyboardEvent) => any;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
    }

    onSelect(callback: (value: TFile, evt: MouseEvent | KeyboardEvent) => any): this {
        this.selectCallback = callback;
        return this;
    }

    getSuggestions(query: string): TFile[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const files: TFile[] = [];
        const lowerCaseInputStr = query.toLowerCase();

        abstractFiles.forEach((file: any) => {
            if (
                file instanceof TFile &&
                file.extension === 'md' &&
                file.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                files.push(file);
            }
        });

        return files;
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFile, evt?: MouseEvent | KeyboardEvent): void {
        this.setValue(file.path);
        
        // Call the registered onSelect callback if it exists
        if (this.selectCallback && evt) {
            this.selectCallback(file, evt);
        }
        
        this.close();
    }
}