import { api } from "@/trpc/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../lib/components/ui/table";

export default async function AdminDashboard() {
  const currentTourney = (await api.tournament.getInfo()).next;
  const tourCards = await api.tourCard.getBySeason({
    seasonId: currentTourney?.seasonId ?? "",
  });
  const teams = await api.team.getByTournament({
    tournamentId: currentTourney?.id ?? "",
  });
  const missingTeams = tourCards?.filter(
    (obj) => teams.filter((a) => a.tourCardId === obj.id).length === 0,
  );
  const tours = await api.tour.getActive();

  return (
    <>
      <div className="text-center font-varela">
        <div className="text-2xl font-bold">Email List</div>
        {missingTeams?.map((tourCard) => (
          <div key={tourCard.id}>
            <div className="text-center text-sm">{tourCard.member.email}</div>
          </div>
        ))}
      </div>
      <Table className="mx-auto w-3/4 text-center font-varela">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center text-xs font-bold">
              Email
            </TableHead>
            <TableHead className="text-center text-xs font-bold">
              Position
            </TableHead>
            <TableHead className="text-center text-xs font-bold">
              Name
            </TableHead>
            <TableHead className="text-center text-xs font-bold">
              Tour
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tourCards
            ?.filter(
              (obj) =>
                teams.filter((a) => a.tourCardId === obj.id).length === 0,
            )
            .sort((a, b) => a.tourId.localeCompare(b.tourId))
            .map((tourCard) => (
              <TableRow key={tourCard.id}>
                <TableCell className="text-sm">
                  {tourCard.member.email}
                </TableCell>
                <TableCell className="text-sm">{tourCard.position}</TableCell>
                <TableCell className="text-sm">
                  {tourCard.displayName}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {tours.find((t) => t.id === tourCard.tourId)?.name}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <div className="text-center font-varela">
        <div className="text-2xl font-bold">All Emails</div>
        {tourCards?.map((tourCard) => (
          <div key={tourCard.id}>
            <div className="text-center text-sm">{tourCard.member.email}</div>
          </div>
        ))}
      </div>
    </>
  );
}
