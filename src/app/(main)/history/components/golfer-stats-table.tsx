import { useState } from "react";
import { useMainStore } from "@/src/lib/store/store";
import { api } from "@/src/trpc/react";
import { Table, TableBody } from "@/src/app/_components/ui/table";

import { TableHeaderComponent } from "./table-header";
import { TablePagination } from "./table-pagination";
import { GolferRow } from "./golfer-row";
import { useGolferData } from "./use-golfer-data";
import { useSortedData } from "./use-sorted-data";

export function GolferStatsTable() {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  // State for sorting
  const [sortBy, setSortBy] = useState("apps");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Get the data from the API
  const { data: golfersData, isLoading } = api.golfer.getAll.useQuery();

  // Get tournament data from the store
  const nextTournament = useMainStore((state) => state.nextTournament);
  const currentTournament = useMainStore((state) => state.currentTournament);
  const pastTournament = (
    useMainStore((state) => state.pastTournaments) ?? []
  ).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )[0];

  // Process golfer data
  const allGolfersEver = useGolferData(golfersData); // Define table columns
  const columns = [
    { id: "name", header: "Golfer", sortable: true, isGroup: false },
    { id: "apps", header: "App", sortable: true, isGroup: false },
    { id: "wins", header: "Wins", sortable: true, isGroup: false },
    { id: "top5s", header: "Top 5", sortable: true, isGroup: false },
    { id: "top10s", header: "Top 10", sortable: true, isGroup: false },
    { id: "cutsMade", header: "Cuts Made", sortable: true, isGroup: false },
    { id: "avgUsage", header: "Avg Usage", sortable: true, isGroup: false },
    { id: "groupOne", header: "Group 1", sortable: true, isGroup: true },
    { id: "groupTwo", header: "Group 2", sortable: true, isGroup: true },
    { id: "groupThree", header: "Group 3", sortable: true, isGroup: true },
    { id: "groupFour", header: "Group 4", sortable: true, isGroup: true },
    { id: "groupFive", header: "Group 5", sortable: true, isGroup: true },
  ];

  // Handle sort column click
  const handleSortClick = (columnId: string) => {
    // If clicking the same column, toggle direction
    if (sortBy === columnId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new column, set it as the sort column and default to descending
      setSortBy(columnId);
      setSortDirection("desc");
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Sort and paginate the data
  const sortedResult = useSortedData({
    data: allGolfersEver,
    sortBy,
    sortDirection,
    pageSize,
    currentPage,
  });

  // Ensure sortedResult is an object with the expected properties
  const {
    currentPageData = [],
    totalItems = 0,
    totalPages = 1,
    startIndex = 0,
    endIndex = 0,
  } = typeof sortedResult === "object" && sortedResult !== null
    ? sortedResult
    : {};

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10);
    setPageSize(newPageSize);
    // Adjust current page to maintain approximate position
    const currentFirstItem = (currentPage - 1) * pageSize + 1;
    const newPage = Math.max(
      1,
      Math.min(
        Math.ceil(currentFirstItem / newPageSize),
        Math.ceil(totalItems / newPageSize),
      ),
    );
    setCurrentPage(newPage);
  };
  return (
    <div className="">
      <h1 className="text-center font-yellowtail text-5xl">
        All-Time Golfer Statistics
      </h1>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue-500 border-t-transparent"></div>
          <span className="ml-2">Loading data...</span>
        </div>
      ) : (
        <>
          {/* Add a wrapper div with overflow handling */}
          <div className="overflow-x-auto">
            <Table className="mx-2 w-full table-auto border-collapse">
              <TableHeaderComponent
                columns={columns}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={handleSortClick}
              />

              <TableBody>
                {currentPageData.map((golfer) => (
                  <GolferRow
                    key={golfer.name}
                    golfer={golfer}
                    golfersData={
                      (golfersData ?? []).map((g) => ({
                        ...g,
                        group: g.group === null ? 0 : g.group,
                      }))
                    }
                    nextTournament={nextTournament}
                    currentTournament={currentTournament}
                    pastTournament={pastTournament ?? null}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls at the bottom */}
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
}
