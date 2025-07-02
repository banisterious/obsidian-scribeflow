import { LogLevel, LoggingSettings } from '../types';

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	component: string;
	method?: string;
	message: string;
	data?: any;
}

export class LoggingService {
	private static instance: LoggingService;
	private settings: LoggingSettings;

	private constructor() {
		this.settings = {
			enabled: false,
			level: LogLevel.WARN,
		};
	}

	static getInstance(): LoggingService {
		if (!LoggingService.instance) {
			LoggingService.instance = new LoggingService();
		}
		return LoggingService.instance;
	}

	updateSettings(settings: LoggingSettings): void {
		this.settings = { ...settings };
	}

	private shouldLog(level: LogLevel): boolean {
		if (!this.settings.enabled) {
			return false;
		}

		const levelHierarchy = {
			[LogLevel.ERROR]: 0,
			[LogLevel.WARN]: 1,
			[LogLevel.INFO]: 2,
			[LogLevel.DEBUG]: 3,
		};

		return levelHierarchy[level] <= levelHierarchy[this.settings.level];
	}

	private formatMessage(component: string, method: string | undefined, message: string): string {
		const methodPart = method ? `.${method}` : '';
		return `[ScribeFlow] ${component}${methodPart}: ${message}`;
	}

	private createLogEntry(
		level: LogLevel,
		component: string,
		method: string | undefined,
		message: string,
		data?: any
	): LogEntry {
		return {
			timestamp: new Date().toISOString(),
			level,
			component,
			method,
			message,
			data,
		};
	}

	error(component: string, message: string, data?: any): void;
	error(component: string, method: string, message: string, data?: any): void;
	error(component: string, methodOrMessage: string, messageOrData?: any, data?: any): void {
		const isMethodProvided = typeof messageOrData === 'string';
		const method = isMethodProvided ? methodOrMessage : undefined;
		const message = isMethodProvided ? messageOrData : methodOrMessage;
		const logData = isMethodProvided ? data : messageOrData;

		if (this.shouldLog(LogLevel.ERROR)) {
			const logEntry = this.createLogEntry(LogLevel.ERROR, component, method, message, logData);
			const formattedMessage = this.formatMessage(component, method, message);

			if (logData) {
				console.error(formattedMessage, logData);
			} else {
				console.error(formattedMessage);
			}
		}
	}

	warn(component: string, message: string, data?: any): void;
	warn(component: string, method: string, message: string, data?: any): void;
	warn(component: string, methodOrMessage: string, messageOrData?: any, data?: any): void {
		const isMethodProvided = typeof messageOrData === 'string';
		const method = isMethodProvided ? methodOrMessage : undefined;
		const message = isMethodProvided ? messageOrData : methodOrMessage;
		const logData = isMethodProvided ? data : messageOrData;

		if (this.shouldLog(LogLevel.WARN)) {
			const logEntry = this.createLogEntry(LogLevel.WARN, component, method, message, logData);
			const formattedMessage = this.formatMessage(component, method, message);

			if (logData) {
				console.warn(formattedMessage, logData);
			} else {
				console.warn(formattedMessage);
			}
		}
	}

	info(component: string, message: string, data?: any): void;
	info(component: string, method: string, message: string, data?: any): void;
	info(component: string, methodOrMessage: string, messageOrData?: any, data?: any): void {
		const isMethodProvided = typeof messageOrData === 'string';
		const method = isMethodProvided ? methodOrMessage : undefined;
		const message = isMethodProvided ? messageOrData : methodOrMessage;
		const logData = isMethodProvided ? data : messageOrData;

		if (this.shouldLog(LogLevel.INFO)) {
			const logEntry = this.createLogEntry(LogLevel.INFO, component, method, message, logData);
			const formattedMessage = this.formatMessage(component, method, message);

			if (logData) {
				console.info(formattedMessage, logData);
			} else {
				console.info(formattedMessage);
			}
		}
	}

	debug(component: string, message: string, data?: any): void;
	debug(component: string, method: string, message: string, data?: any): void;
	debug(component: string, methodOrMessage: string, messageOrData?: any, data?: any): void {
		const isMethodProvided = typeof messageOrData === 'string';
		const method = isMethodProvided ? methodOrMessage : undefined;
		const message = isMethodProvided ? messageOrData : methodOrMessage;
		const logData = isMethodProvided ? data : messageOrData;

		if (this.shouldLog(LogLevel.DEBUG)) {
			const logEntry = this.createLogEntry(LogLevel.DEBUG, component, method, message, logData);
			const formattedMessage = this.formatMessage(component, method, message);

			if (logData) {
				console.debug(formattedMessage, logData);
			} else {
				console.debug(formattedMessage);
			}
		}
	}

	// Legacy compatibility methods for existing console.error/warn patterns
	legacyError(message: string, data?: any): void {
		if (this.shouldLog(LogLevel.ERROR)) {
			if (data) {
				console.error(message, data);
			} else {
				console.error(message);
			}
		}
	}

	legacyWarn(message: string, data?: any): void {
		if (this.shouldLog(LogLevel.WARN)) {
			if (data) {
				console.warn(message, data);
			} else {
				console.warn(message);
			}
		}
	}
}

// Export singleton instance
export const logger = LoggingService.getInstance();
