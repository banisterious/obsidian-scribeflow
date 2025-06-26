
export interface ChroniclePluginSettings {
    journalPath: string;
    templateA_ImagePath: string;
    templateA_ImageWidth: number;
    templateB_ImagePath: string;
    templateB_ImageWidth: number;
}

export interface FormState {
    activeTemplate: 'A' | 'B';
    date: string;
    time: string;
    journalContent: string;
    dreamTitle: string;
    dreamContent: string;
    metrics: {
        sensory: number;
        emotional: number;
        lost: number;
        descriptive: number;
        confidence: number;
    };
    journalImage: string | null;
    dreamImage: string | null;
}
