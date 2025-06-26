
import { FormState } from '../types';
import ChroniclePlugin from '../main';

const DRAFT_KEY = 'chronicle-draft';

export async function saveDraft(plugin: ChroniclePlugin, draft: FormState): Promise<void> {
    plugin.draft = draft;
    await plugin.saveData({ [DRAFT_KEY]: draft });
}

export async function loadDraft(plugin: ChroniclePlugin): Promise<FormState | null> {
    const data = await plugin.loadData();
    return data?.[DRAFT_KEY] || null;
}

export async function clearDraft(plugin: ChroniclePlugin): Promise<void> {
    plugin.draft = null;
    await plugin.saveData({ [DRAFT_KEY]: null });
}
