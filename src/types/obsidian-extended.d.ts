import { Plugin } from 'obsidian';

declare module 'obsidian' {
	interface App {
		plugins: {
			plugins: Record<string, Plugin & {
				settings?: any;
				_loaded?: boolean;
				enabled?: boolean;
			}>;
			enabledPlugins: Set<string>;
		};
		internalPlugins: {
			plugins: Record<string, {
				instance?: {
					options?: { folder?: string };
					settings?: { folder?: string };
				};
				options?: { folder?: string };
				settings?: { folder?: string };
				enabled?: boolean;
			}>;
			enabledPlugins: Set<string>;
		};
		_scribeflow_debug_done?: boolean;
	}
}