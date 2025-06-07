"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/app/_components/ui/table";
import type { DataTableProps } from "../../types";

/**
 * DataTable Component
 *
 * A reusable table component for displaying structured data.
 * Provides consistent styling and layout for all rulebook tables.
 */
export function DataTable({
  headers,
  data,
  className,
  headerClassNames = [],
  cellClassNames = [],
}: DataTableProps) {
  if (!data.length || !headers.length) {
    return (
      <div className="mt-4 text-center font-varela text-sm text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <Table className={cn("mx-auto w-3/4 text-center font-varela", className)}>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead
              key={`header-${index}`}
              className={cn(
                "text-center text-xs font-bold",
                index > 0 && "border-l",
                headerClassNames[index],
              )}
            >
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <TableCell
                key={`cell-${rowIndex}-${cellIndex}`}
                className={cn(
                  "text-center text-xs",
                  cellIndex > 0 && "border-l",
                  cellClassNames[cellIndex],
                )}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
