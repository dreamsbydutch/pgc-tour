function ProjectedPlayoffs(props) {
  var { width } = useWindowDimensions();
  let distributions = useDistributions();
  distributions = distributions.distributions?.filter(
    (obj) => obj.key === "PlayoffStart",
  )[0];
  if (!distributions) return <LoadingSpinner />;
  const playoffStandings = [
    props.data.standings.filter(
      (obj) =>
        +(obj.ShowRk[0] === "T" ? obj.ShowRk.slice(1) : obj.ShowRk) <= 15,
    ),
    props.data.standings.filter(
      (obj) =>
        +(obj.ShowRk[0] === "T" ? obj.ShowRk.slice(1) : obj.ShowRk) > 15 &&
        +(obj.ShowRk[0] === "T" ? obj.ShowRk.slice(1) : obj.ShowRk) <= 30,
    ),
  ].map((obj) => {
    return obj.map((a) => {
      a.DistRk = [
        obj.filter((b) => +b.Points > +a.Points).length + 1,
        obj.filter((b) => +b.Points === +a.Points).length,
      ];
      return a;
    });
  });
  return (
    <>
      <div className="my-4">
        <div className="flex">
          <div className="mx-auto my-3 font-yellowtail text-6xl text-yellow-700">
            Gold Playoff
          </div>
        </div>
        <div className="grid grid-flow-row grid-cols-9 text-center">
          <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
            Rank
          </div>
          <div className="col-span-4 place-self-center font-varela text-base font-bold sm:text-lg">
            Name
          </div>
          <div className="place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
            Tour
          </div>
          <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
            {width < 400 ? "Points" : "Cup Points"}
          </div>
          <div className="place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
            Starting Strokes
          </div>
        </div>
        {playoffStandings[0].map((obj) => (
          <PlayoffItem
            info={obj}
            key={obj.RawRk}
            data={props.data}
            distribution={distributions}
          />
        ))}
      </div>
      <div className="mb-4 mt-8">
        <div className="flex">
          <div className="mx-auto my-3 font-yellowtail text-6xl text-zinc-700">
            Silver Playoff
          </div>
        </div>
        <div className="grid grid-flow-row grid-cols-9 text-center">
          <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
            Rank
          </div>
          <div className="col-span-4 place-self-center font-varela text-base font-bold sm:text-lg">
            Name
          </div>
          <div className="place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
            Tour
          </div>
          <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
            {width < 400 ? "Points" : "Cup Points"}
          </div>
          <div className="place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
            Starting Strokes
          </div>
        </div>
        {playoffStandings[1].map((obj) => (
          <PlayoffItem
            info={obj}
            key={obj.RawRk}
            data={props.data}
            distribution={distributions}
          />
        ))}
      </div>
    </>
  );
}

function PlayoffItem(props) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div onClick={() => setShowInfo(!showInfo)}>
      <div className="grid grid-flow-row grid-cols-9 border-t border-dashed border-t-gray-400 py-1 text-center md:py-2">
        <div className="md:text-md place-self-center font-varela text-2xs xs:text-xs sm:text-sm lg:text-lg">
          {props.info.DistRk[0]} {getRkChange(props.info.FullRkChange)}
        </div>
        <div className="md:text:xl col-span-4 place-self-center font-varela text-base sm:text-lg lg:text-2xl [&>:nth-child(1)]:ml-1.5">
          {props.info.TeamName}
          {littlefucker(props.info.TeamName, props.data)}
        </div>
        <div className="place-self-center font-varela text-xs 2xs:text-xs sm:text-sm md:text-base lg:text-xl">
          {props.info.TourID === "1" ? "PGC" : "DbyD"}
        </div>
        <div className="col-span-2 place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg lg:text-xl">
          {props.info.Points}
        </div>
        <div className="place-self-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {calcDistribution(
            props.distribution,
            props.info.DistRk[0],
            props.info.DistRk[1],
          )}
        </div>
      </div>
      {showInfo ? (
        <StandingsItemInfo
          info={props.info}
          tourneys={props.data.allTourneys}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
