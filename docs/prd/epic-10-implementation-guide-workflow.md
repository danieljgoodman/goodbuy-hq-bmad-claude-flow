# Epic 10: Implementation Guide Generation Workflow - Brownfield Enhancement

## Epic Goal

Enable premium users to generate actionable implementation guides from completed business evaluation opportunities, connecting the existing but disconnected evaluation → guide → progress tracking workflow to deliver the full premium value proposition.

## Epic Description

### Existing System Context

- **Current relevant functionality**: Business evaluations complete successfully and display improvement opportunities, but users cannot convert these into actionable guides
- **Technology stack**: Next.js 15, React, TypeScript, Prisma with PostgreSQL, existing PremiumAccessService and GuideService
- **Integration points**: Evaluation results page, OpportunitiesList component, GuideService API, ProgressService backend

### Enhancement Details

- **What's being added/changed**: Enable premium tier check and UI controls to generate implementation guides from evaluation opportunities
- **How it integrates**: Modify existing OpportunitiesList component to show guide generation buttons for premium users, connect to existing GuideService API
- **Success criteria**: Premium users can generate guides post-evaluation and access them via progress tracking workflow

## Stories

### Story 10.1: Enable Premium Implementation Guide Generation UI
Add premium tier check and guide generation buttons to evaluation results page

**User Story**: As a premium subscriber, I want to see "Generate Implementation Guide" buttons on my completed evaluation opportunities, so that I can convert insights into actionable plans.

### Story 10.2: Connect Guide Generation to Existing Backend  
Integrate frontend guide generation with existing GuideService API and ensure proper data flow

**User Story**: As a premium subscriber, I want the guide generation to successfully create detailed implementation guides, so that I have step-by-step action plans for my business improvements.

### Story 10.3: Verify Progress Tracking Integration
Ensure generated guides properly connect to existing progress tracking workflow and validate end-to-end functionality

**User Story**: As a premium subscriber, I want my generated implementation guides to be available in progress tracking, so that I can monitor and measure my improvement initiatives over time.

## Compatibility Requirements

- [x] Existing APIs remain unchanged - Using existing GuideService and ProgressService APIs
- [x] Database schema changes are backward compatible - No schema changes required, using existing tables
- [x] UI changes follow existing patterns - Following established premium feature gating patterns
- [x] Performance impact is minimal - Single service call addition to evaluation completion flow

## Risk Mitigation

- **Primary Risk**: Breaking existing evaluation completion workflow or free tier experience
- **Mitigation**: Conservative prop-based feature toggling with fallback to current behavior
- **Rollback Plan**: Revert OpportunitiesList showImplementationGuides prop to false, no database rollback needed

## Technical Integration Points

- **File**: `/src/app/evaluation/[id]/page.tsx` - Line 181 (OpportunitiesList component)
- **Service**: `PremiumAccessService.checkFeatureAccess()` - For tier validation
- **API**: `GuideService.generateImplementationGuide()` - For guide creation
- **Component**: `OpportunitiesList` - For UI modifications
- **Backend**: Existing database tables (ImplementationGuide, ProgressEntry, etc.)

## Definition of Done

- [ ] Premium users see implementation guide generation options on completed evaluations
- [ ] Guide generation successfully creates guides via existing GuideService API
- [ ] Generated guides appear in existing progress tracking workflow  
- [ ] Free tier users experience unchanged - no guide generation options visible
- [ ] No regression in evaluation completion or opportunity display functionality
- [ ] End-to-end workflow validated: Evaluation → Opportunities → Guide Generation → Progress Tracking

## Story Manager Handoff

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running Next.js 15, React, TypeScript, Prisma
- Integration points: PremiumAccessService, OpportunitiesList component, GuideService API, ProgressService
- Existing patterns to follow: Premium feature gating via component props, service-based API calls
- Critical compatibility requirements: No breaking changes to evaluation workflow, preserve free tier experience
- Each story must include verification that existing functionality remains intact

The epic should maintain system integrity while delivering seamless evaluation-to-progress-tracking workflow for premium users."

---

**Created**: 2025-09-12  
**Epic Number**: 10  
**Type**: Brownfield Enhancement  
**Priority**: High  
**Estimated Stories**: 3  
**Risk Level**: Low