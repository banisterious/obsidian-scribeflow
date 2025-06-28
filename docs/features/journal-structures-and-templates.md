# Journal Structures and Templates Feature Specification

## Table of Contents

- [Overview](#overview)
- [Vision](#vision)
- [Core Features](#core-features)
  - [1. Template Creation Wizard (3-Path System)](#1-template-creation-wizard-3-path-system)
    - [Path A: Direct Input](#path-a-direct-input)
    - [Path B: Templater Integration](#path-b-templater-integration)
    - [Path C: Predefined Structures](#path-c-predefined-structures)
  - [2. Placeholder System](#2-placeholder-system)
    - [Date Placeholders](#date-placeholders)
    - [Content Placeholders](#content-placeholders)
    - [Individual Metric Placeholders](#individual-metric-placeholders)
    - [Image Placeholders](#image-placeholders)
  - [3. User Interface Integration](#3-user-interface-integration)
    - [Journal Entry Modal Header](#journal-entry-modal-header)
    - [Journal Structures Tab](#journal-structures-tab)
  - [4. Template Management](#4-template-management)
    - [Template Storage](#template-storage)
    - [Template Operations](#template-operations)
- [Implementation Phases](#implementation-phases)
  - [Phase 1: Foundation](#phase-1-foundation)
  - [Phase 2: Core Functionality](#phase-2-core-functionality)
  - [Phase 3: Advanced Features](#phase-3-advanced-features)
  - [Phase 4: Polish and Integration](#phase-4-polish-and-integration)
- [Milestones](#milestones)
  - [Milestone 1: Basic Template System](#milestone-1-basic-template-system)
  - [Milestone 2: Template Application](#milestone-2-template-application)
  - [Milestone 3: Advanced Template Features](#milestone-3-advanced-template-features)
  - [Milestone 4: Production Ready](#milestone-4-production-ready)
- [Technical Specifications](#technical-specifications)
  - [Template Data Structure](#template-data-structure)
  - [Placeholder Processing](#placeholder-processing)
  - [UI Components](#ui-components)
- [User Workflow](#user-workflow)
- [Future Considerations](#future-considerations)
- [Success Criteria](#success-criteria)

## Overview

This document outlines the implementation of a comprehensive template system for ScribeFlow, designed to work in harmony with OneiroMetrics as part of a unified ecosystem where ScribeFlow focuses on content creation and OneiroMetrics focuses on analysis and reporting.

## Vision

**ScribeFlow** serves as the content creation engine, providing users with structured templates and streamlined journal entry workflows.

**OneiroMetrics** serves as the analysis engine, processing and analyzing content created with ScribeFlow.

This division creates a powerful ecosystem where users can seamlessly create structured content and gain insights from their data.

## Core Features

### 1. Template Creation Wizard (3-Path System)

The Journal Structures tab will feature a template creation wizard supporting three distinct approaches:

#### Path A: Direct Input
- **User Experience**: User types or pastes a sample callout structure
- **Use Case**: Quick template creation from existing content or manual design
- **Example Input**:
```markdown
> [!journal-entry] {{date-month-day}} [[Journals|John's Journal]]
> ^{{date-compact}}
> 
> {{content}}
>
> > [!dream-diary] Dream Diary [[Journals/Dream Diary/Dream Diary#^{{date-compact}}-title|Dream Diary]]
> > 
> > {{content}}
> >
> > > [!dream-metrics]
> > > {{metrics}}
```

#### Path B: Templater Integration
- **User Experience**: Integration with existing Templater plugin templates
- **Use Case**: Users with advanced Templater setups can leverage existing templates
- **Functionality**: Import and adapt Templater templates for ScribeFlow use

#### Path C: Predefined Structures
- **User Experience**: Select from built-in template patterns
- **Use Case**: Quick setup for common journal structures
- **Options**: Daily journal, dream diary, project notes, research entries, etc.

### 2. Placeholder System

Templates support dynamic placeholders that are replaced during entry insertion:

#### Date Placeholders
- `{{date}}` - Standard date format (2025-01-15)
- `{{date-long}}` - Long format (January 15, 2025)
- `{{date-month-day}}` - Month and day (January 15)
- `{{date-compact}}` - Compact format (20250115)

#### Content Placeholders
- `{{title}}` - Entry title/heading
- `{{content}}` - Main journal content
- `{{metrics}}` - Populated from currently selected metrics in settings

#### Individual Metric Placeholders
- `{{Sensory Detail}}` - Individual metric values
- `{{Emotional Recall}}` - Specific metric scoring
- (All available metrics can be used as individual placeholders)

#### Image Placeholders
- `{{journal-image}}` - Journal entry images
- `{{dream-image}}` - Dream diary images

### 3. User Interface Integration

#### Journal Entry Modal Header
Templates dropdown will be positioned in the modal header:
```
Create ScribeFlow Entry    [Templates ▼] [Clear form] [Insert entry]
```

**Behavior**:
- Dropdown defaults to first available template
- If no templates exist, "Insert entry" button is disabled
- Template selection affects final content formatting during insertion
- Template selection doesn't pre-populate form fields (form remains generic)

#### Journal Structures Tab
- Template creation wizard interface
- Template management (create, edit, delete)
- Template preview functionality
- Import/export capabilities

### 4. Template Management

#### Template Storage
- Templates stored in plugin settings
- Template metadata: name, description, creation date, structure type
- Template validation and error handling

#### Template Operations
- **Create**: Through wizard interface
- **Edit**: Modify existing templates via wizard
- **Delete**: Remove templates with confirmation
- **Preview**: Live preview of template output
- **Apply**: Use template during entry insertion

## Implementation Phases

### Phase 1: Foundation
- [ ] Create templates dropdown in Journal Entry modal header
- [ ] Implement basic template creation wizard (Direct Input path)
- [ ] Add template storage to plugin settings
- [ ] Create template preview functionality

### Phase 2: Core Functionality
- [ ] Template management interface in Journal Structures tab
- [ ] Template application during entry insertion
- [ ] Placeholder replacement system
- [ ] Integration with selected metrics from settings

### Phase 3: Advanced Features
- [ ] Templater integration (Path B)
- [ ] Predefined structures (Path C)
- [ ] Template import/export
- [ ] Template validation and error handling

### Phase 4: Polish and Integration
- [ ] Template categories/organization
- [ ] Advanced placeholder options
- [ ] OneiroMetrics compatibility planning
- [ ] User documentation and examples

## Milestones

### Milestone 1: Basic Template System
**Goal**: Users can create and manage basic templates using direct input

**Deliverables**:
- [ ] Templates dropdown in Journal Entry modal header
- [ ] Basic template creation wizard (Direct Input path only)
- [ ] Template storage in plugin settings
- [ ] Template list and delete functionality in Journal Structures tab
- [ ] Basic placeholder system ({{content}}, {{date}} variants)

**Success Criteria**:
- Users can create a template by pasting callout structure
- Templates appear in header dropdown
- Templates are persisted between sessions
- Basic placeholders are replaced during insertion

**Target**: End of current development cycle

### Milestone 2: Template Application
**Goal**: Templates fully integrated with journal entry insertion workflow

**Deliverables**:
- [ ] Template application during entry insertion
- [ ] Metrics placeholder integration ({{metrics}})
- [ ] Individual metric placeholders ({{Sensory Detail}}, etc.)
- [ ] Template preview functionality
- [ ] Template editing capability

**Success Criteria**:
- Selected template formats journal entries correctly
- All placeholder types work reliably
- Users can preview templates before saving
- Template editing preserves existing functionality

**Target**: Follow-up development cycle

### Milestone 3: Advanced Template Features
**Goal**: Complete 3-path template wizard and advanced features

**Deliverables**:
- [ ] Templater integration (Path B)
- [ ] Predefined structures (Path C)
- [ ] Template import/export functionality
- [ ] Template validation and error handling
- [ ] Advanced placeholder options

**Success Criteria**:
- All three template creation paths functional
- Templates can be shared between users
- Robust error handling and validation
- Advanced users can leverage Templater integration

**Target**: Future development cycle

### Milestone 4: Production Ready
**Goal**: Polish, optimization, and ecosystem integration

**Deliverables**:
- [ ] Template categories and organization
- [ ] Performance optimization for large template sets
- [ ] OneiroMetrics compatibility features
- [ ] Comprehensive user documentation
- [ ] Community template examples

**Success Criteria**:
- System scales to hundreds of templates
- Seamless integration with OneiroMetrics workflow
- Complete user documentation and examples
- Ready for community adoption

**Target**: Pre-release phase

## Technical Specifications

### Template Data Structure
```typescript
interface JournalTemplate {
    id: string;
    name: string;
    description?: string;
    content: string;
    type: 'direct' | 'templater' | 'predefined';
    createdDate: string;
    lastModified: string;
}
```

### Placeholder Processing
- Template engine processes placeholders during insertion
- Metrics placeholder populated from `plugin.settings.selectedMetrics`
- Date placeholders use current date/time
- Content placeholders filled from form data

### UI Components
- Template creation wizard modal
- Template selection dropdown component
- Template preview area
- Template management interface

## User Workflow

1. **Template Creation**:
   - User opens Journal Structures tab
   - Clicks "Create Template" button
   - Selects creation method (Direct Input, Templater, or Predefined)
   - Follows wizard steps to create template
   - Template saved and available in dropdown

2. **Journal Entry Creation**:
   - User opens Journal Entry modal
   - Selects template from header dropdown
   - Fills out form across tabs as usual
   - Clicks "Insert entry"
   - Content formatted using selected template and inserted into active note

3. **Template Management**:
   - User can edit, delete, or duplicate existing templates
   - Templates can be imported/exported for sharing
   - Preview functionality shows template output before use

## Future Considerations

- **OneiroMetrics Integration**: Design template format for compatibility with OneiroMetrics analysis
- **Template Sharing**: Community template repository
- **Advanced Placeholders**: Conditional logic, computed values
- **Template Inheritance**: Base templates with variations
- **Multi-note Templates**: Templates that create multiple linked notes

## Success Criteria

- [ ] Users can create templates easily using direct input
- [ ] Template selection workflow is intuitive and efficient
- [ ] Placeholder system reliably replaces content during insertion
- [ ] Template management is comprehensive and user-friendly
- [ ] Integration with existing ScribeFlow features is seamless
- [ ] Foundation is established for OneiroMetrics compatibility