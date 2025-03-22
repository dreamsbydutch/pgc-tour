export function LeaderboardHeaderRow() {
  if (typeof window === "undefined")
    return (
      <div className="mx-auto grid max-w-4xl grid-flow-row grid-cols-10 text-center">
        <div className="col-span-2 place-self-center font-varela text-sm font-bold">
          Rank
        </div>
        <div className="col-span-4 place-self-center font-varela text-base font-bold">
          Name
        </div>
        <div className="col-span-2 place-self-center font-varela text-sm font-bold">
          Score
        </div>
        <div className="col-span-1 place-self-center font-varela text-2xs">
          Today
        </div>
        <div className="col-span-1 place-self-center font-varela text-2xs">
          Thru
        </div>
      </div>
    );
  const width = window.innerWidth;
  return width < 650 ? (
    <div className="mx-auto grid max-w-4xl grid-flow-row grid-cols-10 text-center">
      <div className="col-span-2 place-self-center font-varela text-sm font-bold">
        Rank
      </div>
      <div className="col-span-4 place-self-center font-varela text-base font-bold">
        Name
      </div>
      <div className="col-span-2 place-self-center font-varela text-sm font-bold">
        Score
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs">
        Today
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs">
        Thru
      </div>
    </div>
  ) : (
    <div className="grid-cols-16 mx-auto grid max-w-4xl grid-flow-row text-center">
      <div className="col-span-3 place-self-center font-varela text-sm font-bold">
        Rank
      </div>
      <div className="col-span-5 place-self-center font-varela text-base font-bold">
        Name
      </div>
      <div className="col-span-2 place-self-center font-varela text-sm font-bold">
        Score
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs">
        Today
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs">
        Thru
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs">
        R1
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs">
        R2
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs">
        R3
      </div>
      <div className="col-span-1 place-self-center font-varela text-2xs">
        R4
      </div>
    </div>
  );
}
