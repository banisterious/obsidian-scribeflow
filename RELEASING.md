# Release Guide

This document outlines the procedures for releasing new versions of the Custom Journal Entry Plugin.

## Version Numbering

We follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (MAJOR.MINOR.PATCH):

- **MAJOR** (1.0.0): Breaking changes
  - Incompatible API changes
  - Major UI/UX changes
  - Removal of features
  - Changes to data storage format

- **MINOR** (0.1.0): New features
  - Backwards-compatible functionality
  - New settings
  - UI improvements
  - Performance enhancements

- **PATCH** (0.0.1): Bug fixes
  - Backwards-compatible bug fixes
  - Minor UI tweaks
  - Documentation updates
  - Performance optimizations

## Pre-Release Checklist

1. **Code Review**
   - [ ] All tests pass
   - [ ] Code is properly formatted
   - [ ] No linter errors
   - [ ] Documentation is up to date

2. **Feature Verification**
   - [ ] All new features are tested
   - [ ] All bug fixes are verified
   - [ ] No regression issues
   - [ ] Performance is acceptable

3. **Documentation**
   - [ ] README.md is updated
   - [ ] CHANGELOG.md is updated
   - [ ] SPECIFICATION.md is updated
   - [ ] All new features are documented

4. **Build Verification**
   - [ ] Plugin builds successfully
   - [ ] All assets are included
   - [ ] No missing dependencies
   - [ ] Size is within limits

## Release Process

1. **Update Version Numbers**
   ```bash
   # Update version in manifest.json
   {
     "id": "custom-journal-entry",
     "name": "Custom Journal Entry",
     "version": "X.Y.Z",
     "minAppVersion": "1.0.0",
     ...
   }

   # Update version in package.json
   {
     "name": "custom-journal-entry",
     "version": "X.Y.Z",
     ...
   }
   ```

2. **Update Changelog**
   - Move entries from [Unreleased] to new version
   - Add release date
   - Verify all changes are documented
   - Add migration notes if needed

3. **Create Release Branch**
   ```bash
   git checkout -b release/X.Y.Z
   git add .
   git commit -m "Prepare release X.Y.Z"
   git push origin release/X.Y.Z
   ```

4. **Create Pull Request**
   - Title: "Release X.Y.Z"
   - Description: Include changelog entries
   - Request review from maintainers

5. **Build Release**
   ```bash
   # Install dependencies
   npm install

   # Build plugin
   npm run build

   # Verify build
   npm run test
   ```

6. **Create GitHub Release**
   - Tag: `vX.Y.Z`
   - Title: "Version X.Y.Z"
   - Description: Copy from CHANGELOG.md
   - Upload built files
   - Mark as latest release

7. **Merge to Main**
   - After PR approval
   - After successful build
   - After release creation

8. **Post-Release Tasks**
   - [ ] Update documentation links
   - [ ] Announce on community forums
   - [ ] Monitor for issues
   - [ ] Plan next release

## Breaking Changes

When making breaking changes:

1. **Documentation**
   - Update SPECIFICATION.md
   - Add migration guide
   - Update examples
   - Document new requirements

2. **Communication**
   - Announce in advance
   - Provide migration path
   - Set reasonable timeline
   - Offer support

3. **Testing**
   - Test migration process
   - Verify backwards compatibility
   - Check edge cases
   - Validate data integrity

## Release Schedule

- **Major Releases**: As needed for breaking changes
- **Minor Releases**: Monthly or when features are ready
- **Patch Releases**: Weekly or as bugs are fixed

## Emergency Releases

For critical bug fixes:

1. Create hotfix branch
2. Fix the issue
3. Update CHANGELOG.md
4. Create patch release
5. Deploy immediately
6. Follow up with proper release

## Release Notes Template

```markdown
# Version X.Y.Z

## Overview
Brief description of the release

## Breaking Changes
- List any breaking changes
- Include migration steps

## New Features
- Feature 1
- Feature 2

## Improvements
- Improvement 1
- Improvement 2

## Bug Fixes
- Fix 1
- Fix 2

## Documentation
- Doc update 1
- Doc update 2

## Technical Details
- Build requirements
- Dependencies
- Performance notes
```

## Support

For release-related issues:
1. Check the [GitHub Issues](https://github.com/yourusername/custom-journal-entry/issues)
2. Contact maintainers
3. Review release documentation
4. Check community forums 