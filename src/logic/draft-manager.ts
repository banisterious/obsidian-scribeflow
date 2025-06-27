
import { FormState } from '../types';
import ScribeFlowPlugin from '../main';

const DRAFT_KEY = 'scribeflow-draft';

export async function saveDraft(plugin: ScribeFlowPlugin, draft: FormState): Promise<void> {
    plugin.draft = draft;
    await plugin.saveData({ [DRAFT_KEY]: draft });
}

export async function loadDraft(plugin: ScribeFlowPlugin): Promise<FormState | null> {
    const data = await plugin.loadData();
    return data?.[DRAFT_KEY] || null;
}

export async function clearDraft(plugin: ScribeFlowPlugin): Promise<void> {
    plugin.draft = null;
    await plugin.saveData({ [DRAFT_KEY]: null });
}
