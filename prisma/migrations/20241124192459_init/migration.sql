-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tours" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "shortForm" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiers" (
    "id" TEXT NOT NULL,
    "payouts" DOUBLE PRECISION[],
    "points" DOUBLE PRECISION[],
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "tierId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logoUrl" TEXT,
    "seasonId" TEXT NOT NULL,
    "apiId" TEXT,
    "currentRound" INTEGER,
    "livePlay" BOOLEAN,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "par" INTEGER,
    "front" INTEGER,
    "back" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "golferIds" TEXT[],
    "tournamentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "earnings" DOUBLE PRECISION,
    "makeCut" DOUBLE PRECISION,
    "points" DOUBLE PRECISION,
    "tourCardId" TEXT NOT NULL,
    "position" TEXT,
    "score" DOUBLE PRECISION,
    "strokes" DOUBLE PRECISION,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_rounds" (
    "id" TEXT NOT NULL,
    "position" TEXT,
    "score" DOUBLE PRECISION,
    "strokes" DOUBLE PRECISION,
    "thru" DOUBLE PRECISION,
    "round" INTEGER,
    "teeTime" TIMESTAMP(3),
    "front" DOUBLE PRECISION,
    "back" DOUBLE PRECISION,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_cards" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "owing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earnings" DOUBLE PRECISION,
    "points" DOUBLE PRECISION,
    "position" TEXT,
    "tourId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "golfers" (
    "apiId" TEXT NOT NULL,
    "position" TEXT,
    "playerName" TEXT NOT NULL,
    "score" INTEGER,
    "makeCut" DOUBLE PRECISION,
    "topTen" DOUBLE PRECISION,
    "win" DOUBLE PRECISION,
    "round" INTEGER,
    "group" INTEGER,
    "usage" DOUBLE PRECISION,
    "earnings" DOUBLE PRECISION,
    "tournamentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "golfers_pkey" PRIMARY KEY ("apiId")
);

-- CreateTable
CREATE TABLE "golfer_rounds" (
    "id" TEXT NOT NULL,
    "position" TEXT,
    "score" DOUBLE PRECISION,
    "strokes" DOUBLE PRECISION,
    "thru" DOUBLE PRECISION,
    "round" INTEGER,
    "teeTime" TIMESTAMP(3),
    "front" DOUBLE PRECISION,
    "back" DOUBLE PRECISION,
    "golferId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "golfer_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TourToTournament" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TierToTour" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "seasons_year_key" ON "seasons"("year");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_number_key" ON "seasons"("number");

-- CreateIndex
CREATE UNIQUE INDEX "tours_name_seasonId_key" ON "tours"("name", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_name_key" ON "courses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tour_cards_clerkId_seasonId_key" ON "tour_cards"("clerkId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "golfers_apiId_key" ON "golfers"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "golfers_playerName_tournamentId_key" ON "golfers"("playerName", "tournamentId");

-- CreateIndex
CREATE INDEX "_TourToTournament_B_index" ON "_TourToTournament"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TourToTournament_AB_unique" ON "_TourToTournament"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_TierToTour_AB_unique" ON "_TierToTour"("A", "B");

-- CreateIndex
CREATE INDEX "_TierToTour_B_index" ON "_TierToTour"("B");

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_tourCardId_fkey" FOREIGN KEY ("tourCardId") REFERENCES "tour_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_rounds" ADD CONSTRAINT "team_rounds_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_cards" ADD CONSTRAINT "tour_cards_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_cards" ADD CONSTRAINT "tour_cards_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "golfers" ADD CONSTRAINT "golfers_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "golfer_rounds" ADD CONSTRAINT "golfer_rounds_golferId_fkey" FOREIGN KEY ("golferId") REFERENCES "golfers"("apiId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TourToTournament" ADD CONSTRAINT "_TourToTournament_A_fkey" FOREIGN KEY ("A") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TourToTournament" ADD CONSTRAINT "_TourToTournament_B_fkey" FOREIGN KEY ("B") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TierToTour" ADD CONSTRAINT "_TierToTour_A_fkey" FOREIGN KEY ("A") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TierToTour" ADD CONSTRAINT "_TierToTour_B_fkey" FOREIGN KEY ("B") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
