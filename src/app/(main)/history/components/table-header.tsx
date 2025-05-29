import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/app/_components/ui/table";

interface Column {
  id: string;
  header: string;
  sortable: boolean;
  isGroup?: boolean;
}

interface TableHeaderComponentProps {
  columns: Column[];
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSortChange: (columnId: string) => void;
}

export function TableHeaderComponent({
  columns,
  sortBy,
  sortDirection,
  onSortChange,
}: TableHeaderComponentProps) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-white">
      <TableRow>
        {columns.map((column) => (
          <TableHead
            key={column.id}
            className={`border-b border-r border-gray-200 p-2 text-center ${
              column.isGroup ? "text-2xs" : "text-sm"
            } font-bold ${
              column.sortable ? "cursor-pointer hover:bg-gray-50" : ""
            } ${column.id === "groupOne" ? "border-l-2 border-l-gray-300" : ""}`}
            onClick={() => column.sortable && onSortChange(column.id)}
          >
            <div className="flex items-center justify-center whitespace-nowrap">
              {column.header}
              {column.sortable && sortBy === column.id && (
                <span className="ml-1 text-gray-400">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              )}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
