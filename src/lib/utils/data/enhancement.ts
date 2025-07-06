/**
 * Data Enhancement Utilities
 *
 * Generic utilities for enriching data with relationships and computed properties.
 * Provides reusable patterns for data transformation and relationship management.
 *
 * @fileoverview Generic relationship enrichment patterns
 */

/**
 * Generic relationship enrichment function
 * Enriches entities with related data from multiple sources
 */
export function enrichWithRelations<
  TEntity extends Record<string, any>,
  TRelation extends Record<string, any> = Record<string, any>,
>(
  entities: TEntity[],
  relations: Array<{
    name: string;
    data: TRelation[];
    entityKey: string;
    relationKey: string;
    type: "one-to-one" | "one-to-many" | "many-to-many";
    required?: boolean;
  }>,
  options: {
    includeEmpty?: boolean;
    flattenSingleResults?: boolean;
  } = {},
): Array<TEntity & Record<string, any>> {
  const { includeEmpty = true, flattenSingleResults = false } = options;

  return entities
    .map((entity) => {
      const enriched: Record<string, any> = { ...entity };

      relations.forEach(
        ({ name, data, entityKey, relationKey, type, required = false }) => {
          const matches = data.filter(
            (relation) => relation[relationKey] === entity[entityKey],
          );

          switch (type) {
            case "one-to-one":
              enriched[name] = matches[0] || null;
              break;
            case "one-to-many":
              enriched[name] = matches;
              if (flattenSingleResults && matches.length === 1) {
                enriched[name] = matches[0];
              }
              break;
            case "many-to-many":
              enriched[name] = matches;
              break;
          }

          // Handle required relationships
          if (
            required &&
            (!enriched[name] ||
              (Array.isArray(enriched[name]) && enriched[name].length === 0))
          ) {
            return null; // Mark for filtering
          }
        },
      );

      return enriched as TEntity & Record<string, any>;
    })
    .filter((entity) => includeEmpty || entity !== null) as Array<
    TEntity & Record<string, any>
  >;
}

/**
 * Creates a lookup map for efficient relationship resolution
 * Useful for large datasets where repeated lookups are expensive
 */
export function createRelationshipLookup<T extends Record<string, any>>(
  data: T[],
  keyProperty: keyof T,
  type: "single" | "multiple" = "single",
): Map<any, T | T[]> {
  const lookup = new Map();

  data.forEach((item) => {
    const key = item[keyProperty];

    if (type === "single") {
      lookup.set(key, item);
    } else {
      if (!lookup.has(key)) {
        lookup.set(key, []);
      }
      lookup.get(key).push(item);
    }
  });

  return lookup;
}

/**
 * Enriches entities using pre-built lookup maps for performance
 */
export function enrichWithLookups<TEntity extends Record<string, any>>(
  entities: TEntity[],
  lookups: Array<{
    name: string;
    lookup: Map<any, any>;
    entityKey: string;
    defaultValue?: any;
  }>,
): Array<TEntity & Record<string, any>> {
  return entities.map((entity) => {
    const enriched: Record<string, any> = { ...entity };

    lookups.forEach(({ name, lookup, entityKey, defaultValue }) => {
      const key = entity[entityKey];
      enriched[name] = lookup.get(key) || defaultValue || null;
    });

    return enriched as TEntity & Record<string, any>;
  });
}

/**
 * Computes derived properties for entities
 * Useful for adding calculated fields based on existing data
 */
export function enrichWithComputedProperties<T extends Record<string, any>>(
  entities: T[],
  computations: Array<{
    name: string;
    compute: (entity: T) => any;
    condition?: (entity: T) => boolean;
    defaultValue?: any;
  }>,
): Array<T & Record<string, any>> {
  return entities.map((entity) => {
    const enriched: Record<string, any> = { ...entity };

    computations.forEach(({ name, compute, condition, defaultValue }) => {
      if (condition && !condition(entity)) {
        enriched[name] = defaultValue;
        return;
      }

      try {
        enriched[name] = compute(entity);
      } catch (error) {
        console.warn(`Failed to compute property ${name} for entity:`, error);
        enriched[name] = defaultValue;
      }
    });

    return enriched as T & Record<string, any>;
  });
}

/**
 * Flattens nested relationships into a single level
 * Useful for creating flat data structures from hierarchical ones
 */
export function flattenRelationships<T extends Record<string, any>>(
  entities: T[],
  config: {
    relationship: string;
    prefix?: string;
    includeOriginal?: boolean;
    propertiesToFlatten?: string[];
  },
): Array<T & Record<string, any>> {
  const {
    relationship,
    prefix = "",
    includeOriginal = false,
    propertiesToFlatten,
  } = config;

  return entities.map((entity) => {
    const flattened: Record<string, any> = includeOriginal
      ? { ...entity }
      : { ...entity };
    const relationData = entity[relationship];

    if (relationData && typeof relationData === "object") {
      const propsToProcess = propertiesToFlatten || Object.keys(relationData);

      propsToProcess.forEach((prop) => {
        if (relationData[prop] !== undefined) {
          const flatKey = prefix ? `${prefix}${prop}` : prop;
          flattened[flatKey] = relationData[prop];
        }
      });

      if (!includeOriginal) {
        delete flattened[relationship];
      }
    }

    return flattened as T & Record<string, any>;
  });
}

/**
 * Groups entities by relationship values
 * Creates hierarchical structures based on related data
 */
export function groupByRelationship<T extends Record<string, any>>(
  entities: T[],
  config: {
    groupBy: string;
    relationshipPath?: string;
    transform?: (value: any) => string;
    includeEmpty?: boolean;
  },
): Map<string, T[]> {
  const { groupBy, relationshipPath, transform, includeEmpty = true } = config;
  const groups = new Map<string, T[]>();

  entities.forEach((entity) => {
    let value: any;

    if (relationshipPath) {
      // Navigate through relationship (e.g., 'user.profile.tier')
      value = relationshipPath
        .split(".")
        .reduce((obj, key) => obj?.[key], entity);
      value = value?.[groupBy];
    } else {
      value = entity[groupBy];
    }

    if (!includeEmpty && (value === null || value === undefined)) {
      return;
    }

    const groupKey = transform ? transform(value) : String(value || "unknown");

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(entity);
  });

  return groups;
}

/**
 * Validates relationship integrity
 * Checks for orphaned records and missing relationships
 */
export function validateRelationshipIntegrity<T extends Record<string, any>>(
  entities: T[],
  relationships: Array<{
    name: string;
    entityKey: string;
    relatedData: Array<Record<string, any>>;
    relatedKey: string;
    required: boolean;
  }>,
): {
  valid: boolean;
  errors: Array<{ entity: T; relationship: string; error: string }>;
  orphaned: Array<{
    relationship: string;
    records: Array<Record<string, any>>;
  }>;
} {
  const errors: Array<{ entity: T; relationship: string; error: string }> = [];
  const orphaned: Array<{
    relationship: string;
    records: Array<Record<string, any>>;
  }> = [];

  // Check for missing required relationships
  entities.forEach((entity) => {
    relationships.forEach(
      ({ name, entityKey, relatedData, relatedKey, required }) => {
        const entityValue = entity[entityKey];
        const hasRelation = relatedData.some(
          (item) => item[relatedKey] === entityValue,
        );

        if (required && !hasRelation) {
          errors.push({
            entity,
            relationship: name,
            error: `Missing required relationship: no ${name} found for ${String(entityKey)}=${entityValue}`,
          });
        }
      },
    );
  });

  // Check for orphaned records
  relationships.forEach(({ name, relatedData, relatedKey, entityKey }) => {
    const entityValues = new Set(entities.map((e) => e[entityKey]));
    const orphanedRecords = relatedData.filter(
      (item) => !entityValues.has(item[relatedKey]),
    );

    if (orphanedRecords.length > 0) {
      orphaned.push({
        relationship: name,
        records: orphanedRecords,
      });
    }
  });

  return {
    valid: errors.length === 0 && orphaned.length === 0,
    errors,
    orphaned,
  };
}
