#!/usr/bin/env node

/**
 * ScribeFlow CSS Build System
 * 
 * Concatenates all component CSS files into a single styles.css file for Obsidian.
 * Maintains proper order and includes build metadata.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSS file order configuration - defines concatenation order
const CSS_BUILD_ORDER = [
    // Base and variables must come first
    'variables.css',
    'base.css',
    
    // Core components
    'components/buttons.css',
    'components/forms.css',
    'components/modals.css',
    'components/navigation.css',
    'components/settings.css',
    'components/metrics.css',
    'components/journal-entry.css',
    'components/tabs.css',
    
    // Dashboard components
    'dashboard/dashboard-base.css',
    'dashboard/dashboard-search.css',
    'dashboard/dashboard-stats.css',
    'dashboard/dashboard-table.css',
    
    // Feature-specific styles
    'features/callouts.css',
    'features/export.css',
    
    // Wizard components
    'wizard/wizard-base.css',
    'wizard/wizard-navigation.css',
    'wizard/wizard-progress.css',
    'wizard/wizard-methods.css',
    'wizard/wizard-templates.css',
    
    // Responsive styles come last
    'responsive/mobile.css',
    
    // Utilities always last
    'utilities.css'
];

/**
 * Reads and returns the content of a CSS file
 */
function readCSSFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
        return '';
    }
}

/**
 * Generates the build header comment
 */
function generateBuildHeader() {
    const buildTime = new Date().toISOString();
    return `/* ScribeFlow - Generated CSS Bundle
 * 
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * This file is automatically built from component CSS files in the styles/ directory.
 * 
 * To make changes:
 * 1. Edit the individual CSS files in styles/
 * 2. Run 'npm run build:css' to regenerate this file
 * 
 * Build time: ${buildTime}
 * Build order: ${CSS_BUILD_ORDER.length} files concatenated
 */

`;
}

/**
 * Main CSS build function
 */
function buildCSS() {
    console.log('🎨 Building CSS bundle...');
    
    const stylesDir = path.join(__dirname, 'styles');
    const outputFile = path.join(__dirname, 'styles.css');
    
    // Start with build header
    let cssContent = generateBuildHeader();
    
    let processedFiles = 0;
    let skippedFiles = 0;
    
    // Process files in the specified order
    for (const relativePath of CSS_BUILD_ORDER) {
        const fullPath = path.join(stylesDir, relativePath);
        
        if (fs.existsSync(fullPath)) {
            const fileContent = readCSSFile(fullPath);
            
            if (fileContent.trim()) {
                // Add section header
                cssContent += `\n/* ================================ */\n`;
                cssContent += `/* ${relativePath} */\n`;
                cssContent += `/* ================================ */\n\n`;
                
                // Add file content
                cssContent += fileContent;
                
                // Ensure proper spacing between files
                if (!fileContent.endsWith('\n')) {
                    cssContent += '\n';
                }
                cssContent += '\n';
                
                processedFiles++;
                console.log(`✓ Added: ${relativePath}`);
            } else {
                console.log(`⚠ Skipped (empty): ${relativePath}`);
                skippedFiles++;
            }
        } else {
            console.log(`⚠ Skipped (not found): ${relativePath}`);
            skippedFiles++;
        }
    }
    
    // Write the final CSS file
    try {
        fs.writeFileSync(outputFile, cssContent, 'utf8');
        console.log(`\n✅ CSS build complete!`);
        console.log(`📁 Output: styles.css`);
        console.log(`📊 Files processed: ${processedFiles}`);
        console.log(`⚠️  Files skipped: ${skippedFiles}`);
        console.log(`📏 Total size: ${(cssContent.length / 1024).toFixed(1)} KB`);
    } catch (error) {
        console.error(`❌ Error writing styles.css: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Watch mode for development
 */
function watchCSS() {
    console.log('👀 Watching CSS files for changes...');
    
    const stylesDir = path.join(__dirname, 'styles');
    
    // Initial build
    buildCSS();
    
    // Watch for changes
    fs.watch(stylesDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.css')) {
            console.log(`\n🔄 Detected change in: ${filename}`);
            setTimeout(() => {
                buildCSS();
                console.log('👀 Watching for more changes...');
            }, 100); // Small delay to handle rapid successive changes
        }
    });
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'watch':
        watchCSS();
        break;
    case 'build':
    default:
        buildCSS();
        break;
}