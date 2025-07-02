import { App, TFile, Notice } from 'obsidian';

export interface TemplateFile {
	name: string;
	path: string;
	content: string;
}

export class TemplateIntegrationService {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Check if Templater plugin is available and enabled
	 */
	isTemplaterAvailable(): boolean {
		try {
			// Check if Templater plugin is installed and enabled
			const app = this.app as any;
			const plugins = app.plugins;

			// Check multiple possible plugin IDs for Templater
			const possibleIds = ['templater-obsidian', 'templater', 'Templater'];

			for (const id of possibleIds) {
				const plugin = plugins?.plugins?.[id] || plugins?.enabledPlugins?.has?.(id);
				if (plugin) {
					// Double-check it's actually enabled
					return plugins.enabledPlugins?.has?.(id) || plugin._loaded || plugin.enabled !== false;
				}
			}

			return false;
		} catch (error) {
			console.warn('[ScribeFlow] Templater availability check failed', {
				component: 'TemplateIntegrationService',
				method: 'isTemplaterAvailable',
				error: error.message,
				timestamp: new Date().toISOString(),
			});
			return false;
		}
	}

	/**
	 * Check if Core Templates plugin is available and enabled
	 */
	isCoreTemplatesAvailable(): boolean {
		try {
			// Check if Core Templates plugin is installed and enabled
			const app = this.app as any;
			const internalPlugins = app.internalPlugins;

			if (!internalPlugins) return false;

			// Check if templates plugin exists and is enabled
			const templatesPlugin = internalPlugins.plugins?.templates;
			if (!templatesPlugin) return false;

			// Check if it's enabled (enabledPlugins is a Set containing plugin IDs)
			return internalPlugins.enabledPlugins?.has?.('templates') || templatesPlugin.enabled === true;
		} catch (error) {
			console.warn('[ScribeFlow] Core Templates availability check failed', {
				component: 'TemplateIntegrationService',
				method: 'isCoreTemplatesAvailable',
				error: error.message,
				timestamp: new Date().toISOString(),
			});
			return false;
		}
	}

	/**
	 * Get available templates from Templater plugin
	 */
	async getTemplaterTemplates(): Promise<TemplateFile[]> {
		if (!this.isTemplaterAvailable()) {
			return [];
		}

		try {
			const app = this.app as any;
			const plugins = app.plugins;

			// Find Templater plugin with multiple possible IDs
			const possibleIds = ['templater-obsidian', 'templater', 'Templater'];
			let templaterPlugin = null;

			for (const id of possibleIds) {
				if (plugins?.plugins?.[id]) {
					templaterPlugin = plugins.plugins[id];
					break;
				}
			}

			if (!templaterPlugin) {
				console.warn('[ScribeFlow] Templater plugin object access failed', {
					component: 'TemplateIntegrationService',
					method: 'getTemplaterTemplates',
					message: 'Plugin detected but object not accessible',
					possibleIds,
					timestamp: new Date().toISOString(),
				});
				return [];
			}

			// Get template folder from Templater settings
			const templaterSettings = templaterPlugin.settings || {};
			let templateFolder = templaterSettings.template_folder || templaterSettings.templates_folder || '';

			// If no specific folder is set, try common default locations
			if (!templateFolder) {
				// Check for common template folder names
				const commonFolders = ['Templates', 'templates', '_templates'];
				for (const folder of commonFolders) {
					const folderExists = this.app.vault.getAbstractFileByPath(folder);
					if (folderExists) {
						templateFolder = folder;
						break;
					}
				}
			}

			// Get all markdown files from the template folder
			const templateFiles: TemplateFile[] = [];
			const allFiles = this.app.vault.getMarkdownFiles();

			for (const file of allFiles) {
				let isInTemplateFolder = false;

				if (templateFolder) {
					// Check if file is in the specified template folder
					isInTemplateFolder = file.path.startsWith(templateFolder + '/') || file.path === templateFolder;
				} else {
					// If no folder specified, include all markdown files (let user choose)
					isInTemplateFolder = true;
				}

				if (isInTemplateFolder) {
					try {
						const content = await this.app.vault.read(file);
						templateFiles.push({
							name: file.basename,
							path: file.path,
							content: content,
						});
					} catch (error) {
						console.warn('[ScribeFlow] Template file read failed', {
							component: 'TemplateIntegrationService',
							method: 'template file reading',
							filePath: file.path,
							error: error.message,
							timestamp: new Date().toISOString(),
						});
					}
				}
			}

			return templateFiles;
		} catch (error) {
			console.error('[ScribeFlow] Templater templates loading failed', {
				component: 'TemplateIntegrationService',
				method: 'getTemplaterTemplates',
				error: error.message,
				stack: error.stack,
				timestamp: new Date().toISOString(),
			});
			new Notice('Failed to load Templater templates');
			return [];
		}
	}

	/**
	 * Get available templates from Core Templates plugin
	 */
	async getCoreTemplates(): Promise<TemplateFile[]> {
		if (!this.isCoreTemplatesAvailable()) {
			return [];
		}

		try {
			const app = this.app as any;
			const internalPlugins = app.internalPlugins;
			const coreTemplates = internalPlugins.plugins?.templates;

			if (!coreTemplates) {
				console.warn('[ScribeFlow] Core Templates plugin object access failed', {
					component: 'TemplateIntegrationService',
					method: 'getCoreTemplates',
					message: 'Plugin detected but object not accessible',
					timestamp: new Date().toISOString(),
				});
				return [];
			}

			// Get template folder from Core Templates settings
			// Try multiple possible paths for the folder setting
			let templateFolder = '';

			if (coreTemplates.instance?.options?.folder) {
				templateFolder = coreTemplates.instance.options.folder;
			} else if (coreTemplates.instance?.settings?.folder) {
				templateFolder = coreTemplates.instance.settings.folder;
			} else if (coreTemplates.options?.folder) {
				templateFolder = coreTemplates.options.folder;
			} else if (coreTemplates.settings?.folder) {
				templateFolder = coreTemplates.settings.folder;
			} else {
				// Default folder name
				templateFolder = 'Templates';
			}

			// Get all markdown files from the template folder
			const templateFiles: TemplateFile[] = [];
			const allFiles = this.app.vault.getMarkdownFiles();

			for (const file of allFiles) {
				// Check if file is in the template folder
				let isInTemplateFolder = false;

				if (templateFolder) {
					isInTemplateFolder =
						file.path.startsWith(templateFolder + '/') ||
						file.path === templateFolder ||
						(templateFolder === 'Templates' && file.path.startsWith('Templates/'));
				}

				if (isInTemplateFolder) {
					try {
						const content = await this.app.vault.read(file);
						templateFiles.push({
							name: file.basename,
							path: file.path,
							content: content,
						});
					} catch (error) {
						console.warn('[ScribeFlow] Template file read failed', {
							component: 'TemplateIntegrationService',
							method: 'template file reading',
							filePath: file.path,
							error: error.message,
							timestamp: new Date().toISOString(),
						});
					}
				}
			}

			return templateFiles;
		} catch (error) {
			console.error('[ScribeFlow] Core Templates loading failed', {
				component: 'TemplateIntegrationService',
				method: 'getCoreTemplates',
				error: error.message,
				stack: error.stack,
				timestamp: new Date().toISOString(),
			});
			new Notice('Failed to load Core Templates');
			return [];
		}
	}

	/**
	 * Get templates from a specific plugin
	 */
	async getTemplatesFromPlugin(pluginType: 'templater' | 'core'): Promise<TemplateFile[]> {
		if (pluginType === 'templater') {
			return await this.getTemplaterTemplates();
		} else if (pluginType === 'core') {
			return await this.getCoreTemplates();
		}
		return [];
	}

	/**
	 * Get the content of a specific template file
	 */
	async getTemplateContent(templatePath: string): Promise<string> {
		try {
			const file = this.app.vault.getAbstractFileByPath(templatePath);
			if (file instanceof TFile) {
				return await this.app.vault.read(file);
			}
			throw new Error(`Template file not found: ${templatePath}`);
		} catch (error) {
			console.error('[ScribeFlow] Template content reading failed', {
				component: 'TemplateIntegrationService',
				method: 'getTemplateContent',
				templatePath,
				error: error.message,
				timestamp: new Date().toISOString(),
			});
			new Notice(`Failed to read template: ${templatePath}`);
			return '';
		}
	}

	/**
	 * Process Templater template to static content (basic conversion)
	 * This removes Templater syntax and replaces with static placeholders
	 */
	processTemplaterToStatic(content: string): string {
		let processed = content;

		// Replace common Templater date syntax with static placeholders
		processed = processed.replace(/<% tp\.date\.now\(\) %>/g, '{{date}}');
		processed = processed.replace(/<% tp\.date\.now\("YYYY-MM-DD"\) %>/g, '{{date}}');
		processed = processed.replace(/<% tp\.date\.now\("dddd, MMMM Do YYYY"\) %>/g, '{{date-long}}');
		processed = processed.replace(/<% tp\.date\.now\("MMMM Do, YYYY"\) %>/g, '{{date-long}}');
		processed = processed.replace(/<% tp\.date\.now\("DD-MM-YYYY"\) %>/g, '{{date}}');

		// Replace time syntax
		processed = processed.replace(/<% tp\.date\.time\(\) %>/g, '{{time}}');
		processed = processed.replace(/<% tp\.date\.time\("HH:mm"\) %>/g, '{{time}}');
		processed = processed.replace(/<% tp\.date\.time\("hh:mm A"\) %>/g, '{{time}}');

		// Replace title placeholders
		processed = processed.replace(/<% tp\.file\.title %>/g, '{{title}}');
		processed = processed.replace(/<% tp\.file\.name %>/g, '{{title}}');

		// Replace cursor position
		processed = processed.replace(/<% tp\.file\.cursor\(\) %>/g, '{{cursor}}');
		processed = processed.replace(/<% tp\.file\.cursor %>/g, '{{cursor}}');

		// Replace web functions
		processed = processed.replace(/<% tp\.web\.daily_quote\(\) %>/g, '{{quote}}');
		processed = processed.replace(/<% tp\.web\.random_picture\(\) %>/g, '{{image}}');

		// Replace system functions
		processed = processed.replace(/<% tp\.system\.prompt\([^)]*\) %>/g, '{{prompt}}');
		processed = processed.replace(/<% tp\.system\.suggester\([^)]*\) %>/g, '{{selection}}');

		// Replace folder path
		processed = processed.replace(/<% tp\.file\.folder %>/g, '{{folder}}');

		// Replace creation date
		processed = processed.replace(/<% tp\.file\.creation_date\([^)]*\) %>/g, '{{creation-date}}');

		// More complex patterns - replace with generic content placeholder
		processed = processed.replace(/<% await tp\.[^%]*%>/g, '{{content}}');
		processed = processed.replace(/<% tp\.[^%]*%>/g, '{{content}}');

		// Remove any remaining Templater syntax (anything between <% and %>)
		processed = processed.replace(/<%[\s\S]*?%>/g, '{{content}}');

		return processed;
	}

	/**
	 * Get a summary of conversions made from Templater to static placeholders
	 */
	getTemplaterConversionSummary(originalContent: string): string[] {
		const conversions: string[] = [];

		if (originalContent.includes('tp.date.now()')) {
			conversions.push('Date functions → {{date}} or {{date-long}}');
		}
		if (originalContent.includes('tp.date.time()')) {
			conversions.push('Time functions → {{time}}');
		}
		if (originalContent.includes('tp.file.title') || originalContent.includes('tp.file.name')) {
			conversions.push('File title/name → {{title}}');
		}
		if (originalContent.includes('tp.file.cursor')) {
			conversions.push('Cursor position → {{cursor}}');
		}
		if (originalContent.includes('tp.web.')) {
			conversions.push('Web functions → {{quote}}, {{image}}');
		}
		if (originalContent.includes('tp.system.')) {
			conversions.push('System prompts → {{prompt}}, {{selection}}');
		}
		if (/<% tp\.[^%]*%>/.test(originalContent) || /<% await tp\.[^%]*%>/.test(originalContent)) {
			conversions.push('Complex Templater syntax → {{content}}');
		}

		return conversions;
	}

	/**
	 * Debug method to inspect plugin structure with structured logging
	 */
	debugPluginStructure(): void {
		const app = this.app as any;
		const debugData = {
			timestamp: new Date().toISOString(),
			component: 'TemplateIntegrationService',
			operation: 'debugPluginStructure',
			appStructure: {
				plugins: {
					exists: !!app.plugins,
					pluginsObject: !!app.plugins?.plugins,
					enabledPlugins: {
						exists: !!app.plugins?.enabledPlugins,
						type: typeof app.plugins?.enabledPlugins,
						isSet: app.plugins?.enabledPlugins instanceof Set,
						size: app.plugins?.enabledPlugins?.size || 0,
					},
				},
				internalPlugins: {
					exists: !!app.internalPlugins,
					pluginsObject: !!app.internalPlugins?.plugins,
					enabledPlugins: {
						exists: !!app.internalPlugins?.enabledPlugins,
						type: typeof app.internalPlugins?.enabledPlugins,
						isSet: app.internalPlugins?.enabledPlugins instanceof Set,
						size: app.internalPlugins?.enabledPlugins?.size || 0,
					},
				},
			},
			templaterCheck: {} as Record<string, any>,
			coreTemplatesCheck: {},
		};

		// Check Templater plugin variants
		const possibleIds = ['templater-obsidian', 'templater', 'Templater'];
		for (const id of possibleIds) {
			debugData.templaterCheck[id] = {
				pluginExists: !!app.plugins?.plugins?.[id],
				pluginEnabled: app.plugins?.enabledPlugins?.has?.(id) || false,
				pluginObject: app.plugins?.plugins?.[id]
					? {
							hasSettings: !!app.plugins.plugins[id].settings,
							isLoaded: !!app.plugins.plugins[id]._loaded,
							enabled: app.plugins.plugins[id].enabled,
						}
					: null,
			};
		}

		// Check Core Templates
		debugData.coreTemplatesCheck = {
			pluginExists: !!app.internalPlugins?.plugins?.templates,
			pluginEnabled: app.internalPlugins?.enabledPlugins?.has?.('templates') || false,
			pluginObject: app.internalPlugins?.plugins?.templates
				? {
						hasInstance: !!app.internalPlugins.plugins.templates.instance,
						hasOptions: !!app.internalPlugins.plugins.templates.instance?.options,
						hasSettings: !!app.internalPlugins.plugins.templates.settings,
						enabled: app.internalPlugins.plugins.templates.enabled,
					}
				: null,
		};

		// Structured console output
		console.group('[ScribeFlow] Template Plugin Detection Debug');
		console.log('Debug Data:', JSON.stringify(debugData, null, 2));

		// Summary table for easy reading
		console.table({
			'Templater Available': {
				detected: this.isTemplaterAvailable(),
				method: 'isTemplaterAvailable()',
			},
			'Core Templates Available': {
				detected: this.isCoreTemplatesAvailable(),
				method: 'isCoreTemplatesAvailable()',
			},
		});

		console.groupEnd();
	}

	/**
	 * Get available plugin sources (returns which plugins are available)
	 */
	getAvailablePlugins(): Array<{ id: 'templater' | 'core'; name: string; available: boolean }> {
		// Debug plugin structure on first call
		if ((this.app as any)._scribeflow_debug_done !== true) {
			this.debugPluginStructure();
			(this.app as any)._scribeflow_debug_done = true;
		}

		return [
			{
				id: 'templater',
				name: 'Templater',
				available: this.isTemplaterAvailable(),
			},
			{
				id: 'core',
				name: 'Core Templates',
				available: this.isCoreTemplatesAvailable(),
			},
		];
	}
}
