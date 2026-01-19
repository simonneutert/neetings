import {
  createExportV1,
  detectExportVersion,
  ExportV1Schema,
  ExportV1Type,
  LegacyExportType,
} from "./export";
import { migrateLegacyMeeting } from "./meeting";

// Migration plan interface
interface MigrationPlan {
  fromVersion: string;
  toVersion: string;
  description: string;
  transform: (data: any) => any;
  validate: (_data: any) => boolean;
  rollback?: (data: any) => any;
}

// Migration result interface
interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
}

// Available migration paths
export const MIGRATION_PLANS: MigrationPlan[] = [
  {
    fromVersion: "legacy",
    toVersion: "1.0.0",
    description:
      "Convert legacy meetings array to structured v1.0.0 format with attendees",
    transform: migrateLegacyToV1,
    validate: (data) => ExportV1Schema.safeParse(data).success,
    rollback: rollbackV1ToLegacy,
  },
];

// Legacy to V1 migration: Convert meetings array to structured format
function migrateLegacyToV1(data: LegacyExportType): ExportV1Type {
  console.log("Migrating from legacy format to v1.0.0...");

  // Normalize legacy meetings
  const normalizedMeetings = data.map((meeting) => {
    try {
      return migrateLegacyMeeting(meeting);
    } catch (error) {
      console.warn(`Failed to migrate meeting ${meeting.id}:`, error);
      // Return meeting as-is but ensure required fields exist
      return {
        ...meeting,
        topicGroups: meeting.topicGroups || [],
        attendeeIds: meeting.attendeeIds || [],
      };
    }
  });

  // Legacy format has no attendees, so create empty array
  return createExportV1(normalizedMeetings, []);
}

// Rollback functions
function rollbackV1ToLegacy(data: ExportV1Type): LegacyExportType {
  console.log("Rolling back from v1.0.0 to legacy format...");
  return data.meetings;
}

// Main migration function with enhanced error reporting
export function migrateData(
  data: unknown,
  fromVersion: string,
  toVersion: string,
): MigrationResult {
  try {
    // Find migration path
    const migrationPath = findMigrationPath(fromVersion, toVersion);
    if (!migrationPath.length) {
      return {
        success: false,
        fromVersion,
        toVersion,
        errors: [
          `No migration available from v${fromVersion} to v${toVersion}`,
        ],
      };
    }

    // Apply migrations in sequence
    let currentData = data;
    let currentVersion = fromVersion;
    const warnings: string[] = [];

    for (const plan of migrationPath) {
      try {
        currentData = plan.transform(currentData);
        currentVersion = plan.toVersion;

        // Validate migration result
        if (!plan.validate(currentData)) {
          return {
            success: false,
            fromVersion,
            toVersion: currentVersion,
            errors: [
              `Data validation failed after migrating to v${plan.toVersion}`,
            ],
          };
        }
      } catch (error) {
        return {
          success: false,
          fromVersion,
          toVersion: currentVersion,
          errors: [
            `Migration failed (v${plan.fromVersion} → v${plan.toVersion})`,
            error instanceof Error ? error.message : "Unknown migration error",
          ],
        };
      }
    }

    return {
      success: true,
      fromVersion,
      toVersion,
      data: currentData,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      fromVersion,
      toVersion,
      errors: [
        error instanceof Error ? error.message : "Migration system error",
      ],
    };
  }
}

// Find migration path between versions
function findMigrationPath(
  fromVersion: string,
  toVersion: string,
): MigrationPlan[] {
  // Simple direct path lookup for now
  const directPath = MIGRATION_PLANS.find(
    (plan) => plan.fromVersion === fromVersion && plan.toVersion === toVersion,
  );

  if (directPath) {
    return [directPath];
  }

  // Multi-step path finding (for future complex migrations)
  const path = [];
  let currentVersion = fromVersion;

  while (currentVersion !== toVersion) {
    const nextStep = MIGRATION_PLANS.find((plan) =>
      plan.fromVersion === currentVersion
    );
    if (!nextStep) {
      break;
    }

    path.push(nextStep);
    currentVersion = nextStep.toVersion;

    // Prevent infinite loops
    if (path.length > 10) {
      break;
    }
  }

  return currentVersion === toVersion ? path : [];
}

// Rollback function
export function rollbackData(
  data: unknown,
  fromVersion: string,
  toVersion: string,
): MigrationResult {
  console.log(`Starting rollback from ${fromVersion} to ${toVersion}`);

  try {
    // Find rollback path (reverse of migration path)
    const migrationPath = findMigrationPath(toVersion, fromVersion);
    if (!migrationPath.length) {
      throw new Error(
        `No rollback path found from ${fromVersion} to ${toVersion}`,
      );
    }

    // Apply rollbacks in reverse order
    let currentData = data;

    for (const plan of migrationPath.reverse()) {
      if (!plan.rollback) {
        throw new Error(
          `No rollback function available for ${plan.fromVersion} -> ${plan.toVersion}`,
        );
      }

      console.log(
        `Applying rollback: ${plan.toVersion} -> ${plan.fromVersion}`,
      );
      currentData = plan.rollback(currentData);
    }

    return {
      success: true,
      fromVersion,
      toVersion,
      data: currentData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";
    return {
      success: false,
      fromVersion,
      toVersion,
      errors: [errorMessage],
    };
  }
}

// Auto-migration function with enhanced error reporting
export function autoMigrate(
  data: unknown,
  targetVersion: string = "1.0.0",
): MigrationResult {
  try {
    const currentVersion = detectExportVersion(data);

    if (currentVersion === targetVersion) {
      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: targetVersion,
        data,
      };
    }

    return migrateData(data, currentVersion, targetVersion);
  } catch (error) {
    // Enhanced error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes("Unsupported or invalid export format")) {
        return {
          success: false,
          fromVersion: "unknown",
          toVersion: targetVersion,
          errors: [
            "File format not recognized",
            "Expected: Array of meeting objects or versioned export format",
            "Please check that this is a valid Neetings export file",
          ],
        };
      }
    }

    return {
      success: false,
      fromVersion: "unknown",
      toVersion: targetVersion,
      errors: [
        error instanceof Error ? error.message : "Import validation failed",
      ],
    };
  }
}

// Utility functions
export function isMigrationNeeded(
  data: unknown,
  targetVersion: string = "1.0.0",
): boolean {
  try {
    const currentVersion = detectExportVersion(data);
    return currentVersion !== targetVersion;
  } catch {
    return true; // If we can't detect version, assume migration is needed
  }
}

export function getSupportedVersions(): string[] {
  const versions = new Set<string>();
  MIGRATION_PLANS.forEach((plan) => {
    versions.add(plan.fromVersion);
    versions.add(plan.toVersion);
  });
  return Array.from(versions).sort();
}

export function getMigrationInfo(fromVersion: string, toVersion: string): {
  available: boolean;
  path: string[];
  descriptions: string[];
} {
  const path = findMigrationPath(fromVersion, toVersion);
  return {
    available: path.length > 0,
    path: path.map((p) => `${p.fromVersion} -> ${p.toVersion}`),
    descriptions: path.map((p) => p.description),
  };
}
