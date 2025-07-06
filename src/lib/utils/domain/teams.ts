/**
 * Team processing utilities for golf tournament application
 * Handles team data enrichment, grouping, and relationship management
 */

import type { BaseTeam, TeamWithRelations } from "@/lib/types";

/**
 * Enriches teams with related data from multiple sources
 * @param teams - Base team data
 * @param members - Member data to attach to teams
 * @param scores - Score data to attach to teams
 * @param options - Configuration options for enrichment
 * @returns Teams enriched with relations
 */
export function enrichTeamsWithRelations<
  T extends BaseTeam,
  M extends Record<string, any> = Record<string, any>,
  S extends Record<string, any> = Record<string, any>,
  R extends Record<string, unknown> = Record<string, unknown>,
>(
  teams: T[],
  relations: {
    members?: M[];
    scores?: S[];
    [key: string]: unknown[] | undefined;
  } = {},
  options: {
    memberKey?: string;
    scoreKey?: string;
    teamKey?: string;
    includeEmpty?: boolean;
  } = {},
): TeamWithRelations<T, R>[] {
  const {
    memberKey = "teamId",
    scoreKey = "teamId",
    teamKey = "id",
    includeEmpty = true,
  } = options;

  return teams
    .map((team) => {
      const enrichedTeam = { ...team } as TeamWithRelations<T, R>;

      // Attach members if provided
      if (relations.members) {
        (enrichedTeam as any).members = relations.members.filter(
          (member) => member[memberKey] === team[teamKey],
        );
      }

      // Attach scores if provided
      if (relations.scores) {
        (enrichedTeam as any).scores = relations.scores.filter(
          (score) => score[scoreKey] === team[teamKey],
        );
      }

      // Attach other relations dynamically
      Object.entries(relations).forEach(([relationName, relationData]) => {
        if (
          relationName !== "members" &&
          relationName !== "scores" &&
          relationData
        ) {
          const relationKey = `${relationName.slice(0, -1)}Id` as keyof any;
          (enrichedTeam as any)[relationName] = relationData.filter(
            (item: any) => item[relationKey] === team[teamKey],
          );
        }
      });

      return enrichedTeam;
    })
    .filter((team) => {
      if (includeEmpty) return true;

      // Only include teams that have at least one relation with data
      return Object.values(relations).some(
        (relationData) => relationData && relationData.length > 0,
      );
    });
}

/**
 * Groups teams by a specified property with optional transformation
 * @param teams - Teams to group
 * @param groupBy - Property to group by (can be nested using dot notation)
 * @param transform - Optional transformation function for group keys
 * @returns Grouped teams as a Map
 */
export function groupTeamsByProperty<T extends Record<string, any>, K = string>(
  teams: T[],
  groupBy: string,
  transform?: (value: any) => K,
): Map<K, T[]> {
  const groups = new Map<K, T[]>();

  teams.forEach((team) => {
    // Handle nested property access (e.g., 'member.tier')
    const value = groupBy.split(".").reduce((obj, key) => obj?.[key], team);
    const groupKey = transform ? transform(value) : (value as unknown as K);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(team);
  });

  return groups;
}

/**
 * Filters teams based on multiple criteria with AND/OR logic
 * @param teams - Teams to filter
 * @param criteria - Filter criteria
 * @param logic - Whether to use AND or OR logic between criteria
 * @returns Filtered teams
 */
export function filterTeamsByCriteria<T extends Record<string, any>>(
  teams: T[],
  criteria: Array<{
    property: string;
    operator:
      | "eq"
      | "neq"
      | "gt"
      | "lt"
      | "gte"
      | "lte"
      | "includes"
      | "excludes";
    value: any;
  }>,
  logic: "AND" | "OR" = "AND",
): T[] {
  return teams.filter((team) => {
    const results = criteria.map(({ property, operator, value }) => {
      const teamValue = property
        .split(".")
        .reduce((obj, key) => obj?.[key], team);

      switch (operator) {
        case "eq":
          return teamValue === value;
        case "neq":
          return teamValue !== value;
        case "gt":
          return teamValue > value;
        case "lt":
          return teamValue < value;
        case "gte":
          return teamValue >= value;
        case "lte":
          return teamValue <= value;
        case "includes":
          return Array.isArray(teamValue)
            ? teamValue.includes(value)
            : String(teamValue).includes(value);
        case "excludes":
          return Array.isArray(teamValue)
            ? !teamValue.includes(value)
            : !String(teamValue).includes(value);
        default:
          return false;
      }
    });

    return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
  });
}

/**
 * Sorts teams by multiple properties with configurable direction
 * @param teams - Teams to sort
 * @param sortConfig - Array of sort configurations
 * @returns Sorted teams (new array)
 */
export function sortTeamsByProperties<T extends Record<string, any>>(
  teams: T[],
  sortConfig: Array<{
    property: string;
    direction: "asc" | "desc";
    nullsLast?: boolean;
  }>,
): T[] {
  return [...teams].sort((a, b) => {
    for (const { property, direction, nullsLast = true } of sortConfig) {
      const aValue = property.split(".").reduce((obj, key) => obj?.[key], a);
      const bValue = property.split(".").reduce((obj, key) => obj?.[key], b);

      // Handle null/undefined values
      if (aValue == null && bValue == null) continue;
      if (aValue == null) return nullsLast ? 1 : -1;
      if (bValue == null) return nullsLast ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;

      if (comparison !== 0) {
        return direction === "asc" ? comparison : -comparison;
      }
    }
    return 0;
  });
}

/**
 * Calculates team statistics from member or score data
 * @param teams - Teams with relations
 * @param config - Configuration for statistics calculation
 * @returns Teams with calculated statistics
 */
export function calculateTeamStatistics<T extends Record<string, any>>(
  teams: T[],
  config: {
    scoreProperty?: string;
    memberProperty?: string;
    statisticsToCalculate: Array<"sum" | "average" | "min" | "max" | "count">;
    targetProperty?: string;
  },
): Array<T & { statistics: Record<string, number> }> {
  const {
    scoreProperty = "scores",
    memberProperty = "members",
    statisticsToCalculate,
    targetProperty = "score",
  } = config;

  return teams.map((team) => {
    const data = team[scoreProperty] || team[memberProperty] || [];
    const values = Array.isArray(data)
      ? data
          .map((item) =>
            targetProperty.split(".").reduce((obj, key) => obj?.[key], item),
          )
          .filter((val) => val != null)
      : [];

    const statistics: Record<string, number> = {};

    statisticsToCalculate.forEach((stat) => {
      switch (stat) {
        case "sum":
          statistics.sum = values.reduce((acc, val) => acc + Number(val), 0);
          break;
        case "average":
          statistics.average =
            values.length > 0
              ? statistics.sum ||
                values.reduce((acc, val) => acc + Number(val), 0) /
                  values.length
              : 0;
          break;
        case "min":
          statistics.min =
            values.length > 0 ? Math.min(...values.map(Number)) : 0;
          break;
        case "max":
          statistics.max =
            values.length > 0 ? Math.max(...values.map(Number)) : 0;
          break;
        case "count":
          statistics.count = values.length;
          break;
      }
    });

    return { ...team, statistics };
  });
}
