# Adding New Export Versions - Developer Guide

## When to Add a New Version
- Breaking changes to data structure
- New major features that require schema changes
- Backward compatibility issues

## Step-by-Step Guide

### 1. Define New Schema (`src/schemas/export.ts`)
```typescript
// Add new schema (example for v2.0.0)
export const ExportV2Schema = z.object({
  version: z.literal("2.0.0"),
  exportedAt: z.string().datetime(),
  attendees: AttendeeArraySchema,
  meetings: MeetingArraySchema,
  // NEW: Add new fields here
  newFeature: z.string().optional(),
  metadata: ExportMetadataSchema.extend({
    totalAttendees: z.number().int().min(0),
    // NEW: Add new metadata fields
    newMetadata: z.boolean().default(false),
  }),
}).strict();
```

### 2. Update Schema Registry
```typescript
// In EXPORT_SCHEMAS array (add at beginning for newest-first)
const EXPORT_SCHEMAS = [
  { version: "2.0.0", schema: ExportV2Schema }, // NEW
  { version: "1.0.0", schema: ExportV1Schema },
  { version: "legacy", schema: LegacyExportSchema },
] as const;

// Update union type
export const ExportSchema = z.union([
  ExportV2Schema, // NEW
  ExportV1Schema,
  LegacyExportSchema,
]);
```

### 3. Add Migration Path (`src/schemas/migrations.ts`)
```typescript
// Add to MIGRATION_PLANS array
{
  fromVersion: "1.0.0",
  toVersion: "2.0.0",
  description: "Add new feature support",
  transform: migrateV1ToV2,
  validate: (data) => ExportV2Schema.safeParse(data).success,
  rollback: rollbackV2ToV1,
}
```

### 4. Update Version Constants (`src/schemas/index.ts`)
```typescript
export const CURRENT_EXPORT_VERSION = "2.0.0"; // UPDATE
export const SUPPORTED_VERSIONS = ["2.0.0", "1.0.0", "legacy"]; // ADD NEW
```

### 5. Update Export Logic (`src/components/ImportExportButtons.tsx`)
```typescript
// Replace createExportV1 with createExportV2
const exportData = createExportV2(meetings, attendees, newFeatureData);
```

### 6. Update Tests
- Copy existing test files as template
- Update version numbers and expected schemas
- Test migration paths
- Verify backward compatibility

## Best Practices
1. **Always maintain backward compatibility** in imports
2. **Test migration paths thoroughly** 
3. **Document breaking changes** in version descriptions
4. **Use semantic versioning** (major.minor.patch)
5. **Keep legacy support** for at least 2 major versions

## Architecture Benefits
- ✅ **Extensible**: Easy to add new versions
- ✅ **Maintainable**: Clear separation of concerns  
- ✅ **Testable**: Each version has isolated tests
- ✅ **Backward Compatible**: Automatic migration system
- ✅ **Type Safe**: Zod validation for all versions

## Current Implementation (v1.0.0)

The export/import system is built on a solid, future-proof foundation:

### Schema-Driven Architecture
- **Zod schemas** provide runtime validation and TypeScript types
- **Version detection** automatically identifies export format
- **Migration system** handles backward compatibility
- **Union types** support multiple format versions simultaneously

### Extensible Design Patterns
- **EXPORT_SCHEMAS array** for easy version registry
- **MIGRATION_PLANS** for defining upgrade/downgrade paths
- **Modular schema files** keeping each version isolated
- **Test-driven development** ensuring reliability

### Migration System Features
- **Automatic detection** of legacy formats
- **Chain migrations** (legacy → v1.0.0 → v2.0.0 → v3.0.0)
- **Rollback support** for downgrade scenarios
- **Error handling** with detailed validation messages
- **Type safety** throughout the migration process

This architecture was designed to scale with your application's evolution while maintaining full backward compatibility and data integrity.

## Related Documentation

- **[Schema Migration Guide](./MIGRATION.md)** - Comprehensive architectural guide with detailed patterns and best practices
- **[Current Implementation](../src/schemas/export.ts)** - Live code showing the v1.0.0 schema and extensible patterns
- **[Working Tests](../src/test/enhanced-export-import.test.ts)** - Examples of migration testing and validation

This guide provides a practical, step-by-step approach to adding new versions, while the Migration Guide covers the architectural principles and detailed patterns.