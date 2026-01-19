# Schema Migration Guide

This document explains how to implement new schema versions for the Neetings JSX application's export/import system using Zod validation and automatic migration.

## Table of Contents

- [Overview](#overview)
- [When to Create a New Schema Version](#when-to-create-a-new-schema-version)
- [Step-by-Step Implementation](#step-by-step-implementation)
- [Best Practices](#best-practices)
- [Testing Your Migration](#testing-your-migration)
- [Common Pitfalls](#common-pitfalls)
- [Rollback Strategy](#rollback-strategy)
- [Deployment Checklist](#deployment-checklist)
- [Getting Help](#getting-help)

## Overview

The application uses a versioned schema system to handle data evolution over time. This ensures that exported meeting data remains compatible as new features are added or data structures change.

### Current Schema Versions

- **legacy** (Deprecated): Plain array format `[meeting1, meeting2, ...]`
- **v1.0.0** (Current): Structured format with attendees, meetings, and metadata

### Implementation Status

**✅ Currently Active:**
- v1.0.0 schema with attendees and meetings support
- Legacy format backward compatibility
- Migration infrastructure (legacy→v1.0.0) fully working
- Version detection and validation
- Import/export with automatic migration

**🎯 Current Export Format (v1.0.0):**
```json
{
  "version": "1.0.0",
  "exportedAt": "2025-06-18T...",
  "attendees": [{"id": "...", "name": "...", "email": "..."}],
  "meetings": [{"id": "...", "attendeeIds": ["..."]}],
  "metadata": {"totalMeetings": 1, "totalAttendees": 1}
}
```

**Note**: This guide shows patterns for implementing future v2.0.0 development based on the current v1.0.0 foundation.

## Current State: v1.0.0 Active

The system is currently using v1.0.0 format with these characteristics:

1. **Structured Export Format:**
   - Version metadata for future compatibility
   - Separate attendees and meetings arrays
   - Rich metadata including totals and block types
   - Timestamp for export tracking

2. **Backward Compatibility:**
   - Legacy array format automatically detected and migrated
   - No data loss during import of old formats
   - Seamless upgrade path for users

3. **Ready for Future Versions:**
   - Migration infrastructure supports version chains
   - Schema validation ensures data integrity
   - Rollback capabilities for emergency scenarios

## When to Create a New Schema Version

Create a new schema version when you need to:

- Add new required fields to existing data structures
- Change the structure of core data types (Block, Meeting, etc.)
- Remove or rename existing fields
- Introduce breaking changes to the export format
- Add new top-level data sections (like global settings)

**Note**: Minor additions that are optional and backward-compatible can often be added without a version bump.

## Step-by-Step Implementation

### 1. Define the New Schema

To implement a future v2.0.0 schema, you would add:

```typescript
// Future v2.0.0 schema (example)
export const ExportV2Schema = z.object({
  version: z.literal("2.0.0"),
  exportedAt: z.string().datetime(),
  attendees: AttendeeArraySchema,
  meetings: MeetingArraySchema,
  metadata: ExportMetadataSchema.extend({
    totalAttendees: z.number().int().min(0),
    // NEW: Add new metadata fields for v2.0.0
    exportedBy: z.string().optional(),
    appVersion: z.string(),
  }),
  // NEW: Additional top-level sections
  settings: z.object({
    theme: z.string().default("light"),
    language: z.string().default("en"),
  }).optional(),
}).strict();

// Future v3.0.0 example
export const ExportV3Schema = z.object({
  version: z.literal("3.0.0"),
  exportedAt: z.string().datetime(),
  attendees: AttendeeArraySchema,
  meetings: MeetingArraySchema,
  metadata: ExportMetadataSchema.extend({
    totalAttendees: z.number().int().min(0),
    exportedBy: z.string().optional(),
    appVersion: z.string(),
  }),
  settings: z.object({
    theme: z.string().default("light"),
    language: z.string().default("en"),
  }).optional(),
  // NEW: Templates and advanced features
  templates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    blocks: z.array(z.any()),
  })).default([]),
}).strict();
```

### 2. Update Union Types

Add your new schema to the export union type:

```typescript
// Current state (v1.0.0 and legacy)
export const ExportSchema = z.union([
  ExportV1Schema,
  LegacyExportSchema,
]);

// To add v2.0.0 in the future:
export const ExportSchema = z.union([
  ExportV2Schema, // NEW
  ExportV1Schema,
  LegacyExportSchema,
]);

// To add v3.0.0 in the future:
export const ExportSchema = z.union([
  ExportV3Schema, // NEW
  ExportV2Schema,
  ExportV1Schema,
  LegacyExportSchema,
]);
```

### 3. Update Version Detection

Modify the `detectExportVersion` function to recognize your new format:

```typescript
export function detectExportVersion(data: unknown): string {
  // Check schemas in order (newest first)
  for (const { version, schema } of EXPORT_SCHEMAS) {
    if (schema.safeParse(data).success) {
      return version;
    }
  }
  
  throw new Error("Unsupported or invalid export format");
}

// Example for future versions:
// const EXPORT_SCHEMAS = [
//   { version: "3.0.0", schema: ExportV3Schema },
//   { version: "2.0.0", schema: ExportV2Schema },
//   { version: "1.0.0", schema: ExportV1Schema },
//   { version: "legacy", schema: LegacyExportSchema },
// ] as const;
```

### 4. Create Migration Functions

In `src/schemas/migrations.ts`, add transformation functions:

```typescript
// Example: Forward migration v1.0.0 → v2.0.0
function migrateV1ToV2(data: ExportV1Type): ExportV2Type {
  console.log("Migrating from v1.0.0 to v2.0.0...");
  
  return {
    version: "2.0.0",
    exportedAt: data.exportedAt,
    attendees: data.attendees,
    meetings: data.meetings,
    metadata: {
      ...data.metadata,
      // NEW: Add v2.0.0 metadata fields
      exportedBy: "migration-system",
      appVersion: data.metadata.appVersion,
    },
    // NEW: Add default settings
    settings: {
      theme: "light",
      language: "en",
    },
  };
}

// Example: Forward migration v2.0.0 → v3.0.0
function migrateV2ToV3(data: ExportV2Type): ExportV3Type {
  console.log("Migrating from v2.0.0 to v3.0.0...");
  
  return {
    version: "3.0.0",
    exportedAt: data.exportedAt,
    attendees: data.attendees,
    meetings: data.meetings,
    metadata: data.metadata,
    settings: data.settings || { theme: "light", language: "en" },
    // NEW: Add templates support
    templates: [],
  };
}

// Backward migrations for rollback
function rollbackV2ToV1(data: ExportV2Type): ExportV1Type {
  console.log("Rolling back from v2.0.0 to v1.0.0...");
  
  return {
    version: "1.0.0",
    exportedAt: data.exportedAt,
    attendees: data.attendees,
    meetings: data.meetings,
    metadata: {
      appVersion: data.metadata.appVersion,
      totalMeetings: data.metadata.totalMeetings,
      totalAttendees: data.metadata.totalAttendees,
      blockTypes: data.metadata.blockTypes,
      includesAttendees: data.metadata.includesAttendees,
      includesTopicGroups: data.metadata.includesTopicGroups,
    },
  };
}
```

### 5. Register Migration Plan

Add your migration plan to the `MIGRATION_PLANS` array:

```typescript
export const MIGRATION_PLANS: MigrationPlan[] = [
  // Current migration (legacy → v1.0.0)
  {
    fromVersion: "legacy",
    toVersion: "1.0.0",
    description: "Convert legacy meetings array to structured v1.0.0 format with attendees",
    transform: migrateLegacyToV1,
    validate: (data) => ExportV1Schema.safeParse(data).success,
    rollback: rollbackV1ToLegacy,
  },
  // Future migration example (v1.0.0 → v2.0.0)
  // {
  //   fromVersion: "1.0.0",
  //   toVersion: "2.0.0",
  //   description: "Add settings and enhanced metadata",
  //   transform: migrateV1ToV2,
  //   validate: (data) => ExportV2Schema.safeParse(data).success,
  //   rollback: rollbackV2ToV1,
  // },
];
```

### 6. Update Constants

Update version constants in `src/schemas/index.ts`:

```typescript
// Current active version
export const CURRENT_EXPORT_VERSION = "1.0.0";
export const SUPPORTED_VERSIONS = ["1.0.0", "legacy"];

// Future: When implementing v2.0.0
// export const CURRENT_EXPORT_VERSION = "2.0.0";
// export const SUPPORTED_VERSIONS = ["2.0.0", "1.0.0", "legacy"];

// Future: When implementing v3.0.0
// export const CURRENT_EXPORT_VERSION = "3.0.0";
// export const SUPPORTED_VERSIONS = ["3.0.0", "2.0.0", "1.0.0", "legacy"];
```

### 7. Update Core Data Schemas (If Needed)

If your new version requires changes to core data structures, update the relevant schemas:

```typescript
// Example: Enhanced Block schema for v3.0.0
export const BlockV3Schema = BlockSchema.extend({
  // New fields for v3.0.0
  richContent: z.object({
    type: z.literal("rich"),
    data: z.any(),
  }).optional(),
  
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
  })).optional(),
});
```

### 8. Create Helper Functions

Add utility functions for working with your new format:

```typescript
// Current helper function (v1.0.0)
export function createExportV1(
  meetings: z.infer<typeof MeetingArraySchema>,
  attendees: z.infer<typeof AttendeeArraySchema>,
  options: Partial<ExportOptionsType> = {}
): ExportV1Type {
  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    attendees,
    meetings,
    metadata: {
      appVersion: "1.0.0",
      totalMeetings: meetings.length,
      totalAttendees: attendees.length,
      blockTypes: [...new Set(meetings.flatMap(m => m.blocks.map(b => b.type)))],
      includesAttendees: true,
      includesTopicGroups: true,
    },
  };
}

// Future helper example (v2.0.0)
// export function createExportV2(
//   meetings: z.infer<typeof MeetingArraySchema>,
//   attendees: z.infer<typeof AttendeeArraySchema>,
//   settings?: any,
//   options: Partial<ExportOptionsType> = {}
// ): ExportV2Type {
//   return {
//     version: "2.0.0",
//     exportedAt: new Date().toISOString(),
//     attendees,
//     meetings,
//     metadata: {
//       appVersion: "1.0.0",
//       totalMeetings: meetings.length,
//       totalAttendees: attendees.length,
//       blockTypes: [...new Set(meetings.flatMap(m => m.blocks.map(b => b.type)))],
//       includesAttendees: true,
//       includesTopicGroups: true,
//       exportedBy: "system",
//     },
//     settings: settings || { theme: "light", language: "en" },
//   };
// }
```

### 9. Update Normalization Function

Extend the `normalizeExportToV2` function to handle your new version:

```typescript
// Current normalization function
export function normalizeExportToV1(data: unknown): ExportV1Type {
  const version = detectExportVersion(data);
  
  switch (version) {
    case "1.0.0":
      return ExportV1Schema.parse(data);
      
    case "legacy": {
      const meetings = LegacyExportSchema.parse(data);
      return createExportV1(meetings, []); // No attendees in legacy format
    }
      
    default:
      throw new Error(`Cannot normalize unsupported version: ${version}`);
  }
}

// Future normalization function example
// export function normalizeExportToV2(data: unknown): ExportV2Type {
//   const version = detectExportVersion(data);
//   
//   switch (version) {
//     case "2.0.0":
//       return ExportV2Schema.parse(data);
//       
//     case "1.0.0": {
//       const v1Data = ExportV1Schema.parse(data);
//       return migrateV1ToV2(v1Data);
//     }
//       
//     case "legacy": {
//       const meetings = LegacyExportSchema.parse(data);
//       const v1Data = createExportV1(meetings, []);
//       return migrateV1ToV2(v1Data);
//     }
//       
//     default:
//       throw new Error(`Cannot normalize unsupported version: ${version}`);
//   }
// }
```

### 10. Write Tests

Create comprehensive tests for your new schema version:

```typescript
// Current tests (legacy → v1.0.0)
// In src/test/enhanced-export-import.test.ts
describe("Schema Migration legacy → v1.0.0", () => {
  it("migrates legacy data to v1.0.0 format", () => {
    const legacyData = [/* array of meetings */];
    
    const result = migrateLegacyToV1(legacyData);
    
    expect(result.version).toBe("1.0.0");
    expect(result.attendees).toBeDefined();
    expect(result.meetings).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(ExportV1Schema.safeParse(result).success).toBe(true);
  });
  
  it("can rollback v1.0.0 data to legacy", () => {
    const v1Data: ExportV1Type = {/* test data */};
    const result = rollbackV1ToLegacy(v1Data);
    
    expect(Array.isArray(result)).toBe(true);
    expect(LegacyExportSchema.safeParse(result).success).toBe(true);
  });
});

// Future test example (v1.0.0 → v2.0.0)
// describe("Schema Migration v1.0.0 → v2.0.0", () => {
//   it("migrates v1 data to v2 format", () => {
//     const v1Data: ExportV1Type = {
//       version: "1.0.0",
//       exportedAt: "2024-01-01T00:00:00Z",
//       attendees: [],
//       meetings: [],
//       metadata: {/* test metadata */},
//     };
//     
//     const result = migrateV1ToV2(v1Data);
//     
//     expect(result.version).toBe("2.0.0");
//     expect(result.settings).toBeDefined();
//     expect(ExportV2Schema.safeParse(result).success).toBe(true);
//   });
// });
```

## Best Practices

### Data Transformation Guidelines

1. **Preserve Data**: Never lose user data during migration
2. **Validate Early**: Use Zod validation before and after transformation
3. **Handle Edge Cases**: Account for missing or malformed data
4. **Log Changes**: Use console.log to track migration progress
5. **Test Thoroughly**: Write tests for both forward and backward migration

### Schema Design Principles

1. **Backward Compatibility**: New fields should be optional when possible
2. **Clear Versioning**: Use semantic versioning (major.minor.patch)
3. **Meaningful Metadata**: Include helpful information for debugging
4. **Extensible Design**: Plan for future growth

### Error Handling

```typescript
function migrateData(data: ExportV2Type): ExportV3Type {
  try {
    // Attempt migration
    const result = migrateV2ToV3(data);
    
    // Validate result
    const validation = ExportV3Schema.safeParse(result);
    if (!validation.success) {
      throw new Error(`Migration validation failed: ${validation.error.message}`);
    }
    
    return result;
  } catch (error) {
    console.error("Migration failed:", error);
    throw new Error(`Unable to migrate data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

## Testing Your Migration

### 1. Unit Tests
Test individual migration functions with various data scenarios.

### 2. Integration Tests
Test the full import/export flow with your new schema version.

### 3. Manual Testing
1. Export data with the new version
2. Import the exported file
3. Verify all data is preserved and correctly structured
4. Test edge cases (empty data, malformed data, etc.)

### 4. Backward Compatibility Testing
1. Export with new version
2. Import old version files
3. Verify automatic migration works
4. Test rollback functionality

## Common Pitfalls

1. **Breaking Changes**: Always provide migration paths for breaking changes
2. **Data Loss**: Double-check that all user data is preserved during migration
3. **Validation Errors**: Ensure migrated data passes new schema validation
4. **Performance**: Large datasets may require streaming or batched migration
5. **Version Detection**: Make sure version detection is accurate and unambiguous

## Rollback Strategy

Always implement rollback functions for emergency situations:

```typescript
// Emergency rollback to previous version
function emergencyRollback(data: ExportV3Type): ExportV2Type {
  console.warn("Performing emergency rollback from v3.0.0 to v2.0.0");
  return rollbackV3ToV2(data);
}
```

## Deployment Checklist

Before deploying a new schema version:

- [ ] All migration functions implemented and tested
- [ ] Rollback functions implemented and tested
- [ ] Unit tests cover all migration scenarios
- [ ] Integration tests pass with new schema
- [ ] Documentation updated
- [ ] Version constants updated
- [ ] Error handling tested
- [ ] Performance impact assessed
- [ ] Backward compatibility verified

## Getting Help

If you encounter issues during migration implementation:

1. Check existing migration patterns in `src/schemas/migrations.ts`
2. Review Zod documentation for schema validation
3. Test with small datasets first
4. Use detailed logging to track migration steps
5. Consider implementing partial migrations for complex changes

Remember: The goal is to maintain data integrity while enabling application evolution. When in doubt, err on the side of preserving user data and providing clear error messages.

## Related Documentation

- **[Future Versions Guide](./FUTURE_VERSIONS.md)** - Practical step-by-step guide for adding new export versions
- **[Current Implementation](../src/schemas/export.ts)** - Live code showing v1.0.0 schema and migration patterns
- **[Test Examples](../src/test/enhanced-export-import.test.ts)** - Working tests demonstrating migration functionality

The `FUTURE_VERSIONS.md` guide provides a more concise, practical approach to adding new versions, while this document covers the architectural principles and detailed patterns.