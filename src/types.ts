export interface JournalTemplate {
	id: string;
	name: string;
	content: string;
	description?: string;
}

export enum LogLevel {
	ERROR = 'error',
	WARN = 'warn',
	INFO = 'info',
	DEBUG = 'debug',
}

export interface LoggingSettings {
	enabled: boolean;
	level: LogLevel;
}

export interface ScribeFlowPluginSettings {
	calloutNames: {
		journalEntry: string;
		dreamDiary: string;
	};
	imageFolderPath: string;
	allowedImageTypes: string[];
	selectedMetrics: MetricDefinition[];
	templates: JournalTemplate[];
	tocSettings: {
		updateYearNote: boolean;
		updateMasterJournals: boolean;
		masterJournalsNotePath: string;
		yearNoteCalloutName: string;
		masterJournalsCalloutName: string;
	};
	dashboardSettings: {
		scanFolders: string[];
		parseTemplates: string[];
		previewWordLimit: number;
		statisticsGroupedView: boolean;
		dailyWordGoal: number;
		weeklyConsistencyGoal: number;
	};
	loggingSettings: LoggingSettings;
}

export interface MetricDefinition {
	id: string;
	name: string;
	type: 'score' | 'number' | 'text' | 'list';
	description: string;
	min?: number;
	max?: number;
}

export const AVAILABLE_IMAGE_TYPES = [
	{ extension: 'png', label: 'PNG' },
	{ extension: 'jpg', label: 'JPG' },
	{ extension: 'jpeg', label: 'JPEG' },
	{ extension: 'gif', label: 'GIF' },
	{ extension: 'svg', label: 'SVG' },
	{ extension: 'webp', label: 'WebP' },
	{ extension: 'bmp', label: 'BMP' },
	{ extension: 'tiff', label: 'TIFF' },
	{ extension: 'ico', label: 'ICO' },
];

export const AVAILABLE_METRICS: MetricDefinition[] = [
	// Default Metrics
	{
		id: 'sensory',
		name: 'Sensory detail',
		type: 'score',
		description: 'How vivid were the sensory details?',
		min: 1,
		max: 5,
	},
	{
		id: 'emotional',
		name: 'Emotional recall',
		type: 'score',
		description: 'How emotionally intense was the dream?',
		min: 1,
		max: 5,
	},
	{
		id: 'lost',
		name: 'Lost segments',
		type: 'number',
		description: 'How much detail was lost upon waking?',
		min: 0,
		max: 20,
	},
	{
		id: 'descriptive',
		name: 'Descriptiveness',
		type: 'score',
		description: 'How descriptive can you be about the dream?',
		min: 1,
		max: 5,
	},
	{
		id: 'confidence',
		name: 'Confidence score',
		type: 'score',
		description: 'How confident are you in your recall?',
		min: 1,
		max: 5,
	},

	// Character Metrics
	{
		id: 'characterRoles',
		name: 'Character roles',
		type: 'score',
		description: 'Presence and significance of characters',
		min: 1,
		max: 5,
	},
	{
		id: 'charactersCount',
		name: 'Characters count',
		type: 'number',
		description: 'Total number of characters',
		min: 0,
		max: 100,
	},
	{
		id: 'familiarCount',
		name: 'Familiar count',
		type: 'number',
		description: 'Number of familiar characters',
		min: 0,
		max: 100,
	},
	{
		id: 'unfamiliarCount',
		name: 'Unfamiliar count',
		type: 'number',
		description: 'Number of unfamiliar characters',
		min: 0,
		max: 100,
	},
	{ id: 'charactersList', name: 'Characters list', type: 'text', description: 'List all characters that appeared' },
	{
		id: 'characterClarity',
		name: 'Character clarity',
		type: 'score',
		description: 'How clearly you perceived characters',
		min: 1,
		max: 5,
	},

	// Dream Experience Metrics
	{ id: 'dreamTheme', name: 'Dream theme', type: 'text', description: 'Dominant subjects or themes' },
	{ id: 'symbolicContent', name: 'Symbolic content', type: 'text', description: 'Meaningful symbols or objects' },
	{
		id: 'lucidityLevel',
		name: 'Lucidity level',
		type: 'score',
		description: 'Degree of awareness you were dreaming',
		min: 1,
		max: 5,
	},
	{
		id: 'dreamCoherence',
		name: 'Dream coherence',
		type: 'score',
		description: 'Logical consistency of the dream',
		min: 1,
		max: 5,
	},
	{
		id: 'environmentalFamiliarity',
		name: 'Environmental familiarity',
		type: 'score',
		description: 'How familiar were the locations?',
		min: 1,
		max: 5,
	},
	{
		id: 'timeDistortion',
		name: 'Time distortion',
		type: 'score',
		description: 'How unusually did time behave?',
		min: 1,
		max: 5,
	},

	// Memory & Recall Metrics
	{
		id: 'easeOfRecall',
		name: 'Ease of recall',
		type: 'score',
		description: 'How readily could you remember the dream?',
		min: 1,
		max: 5,
	},
	{
		id: 'recallStability',
		name: 'Recall stability',
		type: 'score',
		description: 'How well did the memory hold up?',
		min: 1,
		max: 5,
	},
];

export interface FormState {
	date: string;
	time: string;
	journalContent: string;
	journalImagePath: string;
	journalImageWidth: number;
	dreamTitle: string;
	dreamContent: string;
	dreamImagePath: string;
	dreamImageWidth: number;
	metrics: Record<string, number | string>;
}
