export default function HomePageStandings() {
    return (
      <>
        <div className="mb-4 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
          Tour Standings
        </div>
        <div className="mx-auto grid grid-flow-col grid-cols-2 text-center">
          <a href="#/standings?tour=pgc" key="pgc">
            <div className="border-r border-black pr-2">
              <div className="mb-2 text-lg font-bold">PGC Tour</div>
              <div className="grid grid-flow-row grid-cols-8 text-center">
                <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
                  Rank
                </div>
                <div className="col-span-5 place-self-center font-varela text-base font-bold sm:text-lg">
                  Name
                </div>
                <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
                  Points
                </div>
              </div>
              {/* {standings[0].map((obj) => {
                  return (
                    <div className="grid grid-flow-row grid-cols-8 border-t border-dashed border-t-gray-400 py-1 text-center md:py-2">
                      <div className="md:text-md place-self-center font-varela text-2xs xs:text-xs sm:text-sm lg:text-lg">
                        {obj.ShowRk}
                      </div>
                      <div className="col-span-5 place-self-center font-varela text-sm sm:text-base md:text-lg lg:text-xl [&>:nth-child(1)]:ml-1.5">
                        {obj.TeamName}
                        {littlefucker(obj.TeamName, props.data)}
                      </div>
                      <div className="col-span-2 place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg lg:text-xl">
                        {obj.Points}
                      </div>
                    </div>
                  );
                })} */}
            </div>
          </a>
          <a href="#/standings?tour=dbyd" key="dbyd">
            <div className="pl-2">
              <div className="mb-2 text-lg font-bold">DbyD Tour</div>
              <div className="grid grid-flow-row grid-cols-8 text-center">
                <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
                  Rank
                </div>
                <div className="col-span-5 place-self-center font-varela text-base font-bold sm:text-lg">
                  Name
                </div>
                <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
                  Points
                </div>
              </div>
              {/* {standings[1].map((obj) => {
                  return (
                    <div className="grid grid-flow-row grid-cols-8 border-t border-dashed border-t-gray-400 py-1 text-center md:py-2">
                      <div className="md:text-md place-self-center font-varela text-2xs xs:text-xs sm:text-sm lg:text-lg">
                        {obj.ShowRk}
                      </div>
                      <div className="col-span-5 place-self-center font-varela text-sm sm:text-base md:text-lg lg:text-xl [&>:nth-child(1)]:ml-1.5">
                        {obj.TeamName}
                        {littlefucker(obj.TeamName, props.data)}
                      </div>
                      <div className="col-span-2 place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg lg:text-xl">
                        {obj.Points}
                      </div>
                    </div>
                  );
                })} */}
            </div>
          </a>
        </div>
      </>
    );
  }