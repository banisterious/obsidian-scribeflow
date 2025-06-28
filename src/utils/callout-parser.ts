export function findFirstCalloutListEnd(content: string): number | null {
    const lines = content.split('\n');
    let inCallout = false;
    let calloutDepth = 0;
    let listFound = false;
    let lastListRelatedLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed.startsWith('> [!')) {
            inCallout = true;
            calloutDepth = 1;
            listFound = false;
            lastListRelatedLine = -1;
            continue;
        }
        
        if (inCallout) {
            if (trimmed.startsWith('>>>')) {
                if (calloutDepth === 2) {
                    calloutDepth = 3;
                }
                continue;
            }
            
            if (trimmed.startsWith('>>')) {
                if (calloutDepth === 1) {
                    calloutDepth = 2;
                }
                // Check for any list item (including indented sub-items)
                if (trimmed.match(/^>>\s*-/) || trimmed.match(/^>>\s*\*/) || trimmed.match(/^>>\s*\+/)) {
                    listFound = true;
                    lastListRelatedLine = i;
                }
                continue;
            }
            
            if (trimmed.startsWith('>') && !trimmed.startsWith('>>')) {
                if (listFound && lastListRelatedLine >= 0) {
                    return lastListRelatedLine + 1;
                }
                calloutDepth = 1;
                continue;
            }
            
            if (!trimmed.startsWith('>')) {
                if (listFound && lastListRelatedLine >= 0) {
                    return lastListRelatedLine + 1;
                }
                inCallout = false;
                calloutDepth = 0;
                listFound = false;
                lastListRelatedLine = -1;
            }
        }
    }
    
    if (inCallout && listFound && lastListRelatedLine >= 0) {
        return lastListRelatedLine + 1;
    }
    
    return null;
}

export function findLastCalloutListEnd(content: string): number | null {
    const lines = content.split('\n');
    let lastCalloutEnd = -1;
    let inCallout = false;
    let calloutDepth = 0;
    let listFound = false;
    let lastListLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed.startsWith('> [!')) {
            // Start of new callout - reset tracking
            inCallout = true;
            calloutDepth = 1;
            listFound = false;
            lastListLine = -1;
            continue;
        }
        
        if (inCallout) {
            if (trimmed.startsWith('>>>')) {
                if (calloutDepth === 2) {
                    calloutDepth = 3;
                }
                continue;
            }
            
            if (trimmed.startsWith('>>')) {
                if (calloutDepth === 1) {
                    calloutDepth = 2;
                }
                if (trimmed.startsWith('>> -') || trimmed.startsWith('>> *') || trimmed.startsWith('>> +')) {
                    listFound = true;
                    lastListLine = i;
                }
                continue;
            }
            
            if (trimmed.startsWith('>') && !trimmed.startsWith('>>')) {
                calloutDepth = 1;
                continue;
            }
            
            if (!trimmed.startsWith('>')) {
                // End of callout
                if (listFound && lastListLine >= 0) {
                    lastCalloutEnd = lastListLine + 1;
                }
                inCallout = false;
                calloutDepth = 0;
                listFound = false;
                lastListLine = -1;
            }
        }
    }
    
    // Handle case where file ends with a callout
    if (inCallout && listFound && lastListLine >= 0) {
        lastCalloutEnd = lastListLine + 1;
    }
    
    return lastCalloutEnd >= 0 ? lastCalloutEnd : null;
}

export function findSpecificCalloutListEnd(content: string, calloutName: string): number | null {
    if (!calloutName.trim()) {
        return findFirstCalloutListEnd(content);
    }
    
    const lines = content.split('\n');
    let inTargetCallout = false;
    let calloutDepth = 0;
    let listFound = false;
    let lastListRelatedLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed.startsWith('> [!')) {
            const calloutMatch = trimmed.match(/> \[!([^\]]+)\]/);
            if (calloutMatch && calloutMatch[1] === calloutName) {
                inTargetCallout = true;
                calloutDepth = 1;
                listFound = false;
                lastListRelatedLine = -1;
            } else {
                inTargetCallout = false;
                calloutDepth = 0;
                listFound = false;
                lastListRelatedLine = -1;
            }
            continue;
        }
        
        if (inTargetCallout) {
            if (trimmed.startsWith('>>>')) {
                if (calloutDepth === 2) {
                    calloutDepth = 3;
                }
                continue;
            }
            
            if (trimmed.startsWith('>>')) {
                if (calloutDepth === 1) {
                    calloutDepth = 2;
                }
                // Check for any list item (including indented sub-items)
                if (trimmed.match(/^>>\s*-/) || trimmed.match(/^>>\s*\*/) || trimmed.match(/^>>\s*\+/)) {
                    listFound = true;
                    lastListRelatedLine = i;
                }
                continue;
            }
            
            if (trimmed.startsWith('>') && !trimmed.startsWith('>>')) {
                calloutDepth = 1;
                continue;
            }
            
            if (!trimmed.startsWith('>')) {
                if (listFound && lastListRelatedLine >= 0) {
                    return lastListRelatedLine + 1;
                }
                inTargetCallout = false;
                calloutDepth = 0;
                listFound = false;
                lastListRelatedLine = -1;
            }
        }
    }
    
    if (inTargetCallout && listFound && lastListRelatedLine >= 0) {
        return lastListRelatedLine + 1;
    }
    
    return null;
}