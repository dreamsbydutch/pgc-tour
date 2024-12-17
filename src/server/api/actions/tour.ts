"use server";

import { api } from "@/trpcLocal/server";

const seedData = [
  {
    name: "PGC Tour",
    logoUrl:
      "https://utfs.io/f/28aac2b3-cd67-4f96-a588-9079a83ffe6f-s01vad.png",
    seasonYear: 2021,
    shortForm: "PGC",
  },
  {
    name: "PGC Tour",
    logoUrl:
      "https://utfs.io/f/28aac2b3-cd67-4f96-a588-9079a83ffe6f-s01vad.png",
    seasonYear: 2022,
    shortForm: "PGC",
  },
  {
    name: "PGC Tour",
    logoUrl:
      "https://utfs.io/f/28aac2b3-cd67-4f96-a588-9079a83ffe6f-s01vad.png",
    seasonYear: 2023,
    shortForm: "PGC",
  },
  {
    name: "PGC Tour",
    logoUrl:
      "https://utfs.io/f/28aac2b3-cd67-4f96-a588-9079a83ffe6f-s01vad.png",
    seasonYear: 2024,
    shortForm: "PGC",
  },
  {
    name: "Dreams by Dutch Tour",
    logoUrl:
      "https://utfs.io/f/94GU8p0EVxqP9mbbh90EVxqPipmohMFN5SvwtcUB1LK20lz3",
    seasonYear: 2024,
    shortForm: "DbyD",
  },
  {
    name: "Coach Carter Golf Tour",
    logoUrl:
      "https://utfs.io/f/94GU8p0EVxqPEDIUm4Nhk31M5UWcLwSAlRgNKpBjf94CadIX",
    seasonYear: 2025,
    shortForm: "CCG",
  },
  {
    name: "Dreams by Dutch Tour",
    logoUrl:
      "https://utfs.io/f/94GU8p0EVxqP9mbbh90EVxqPipmohMFN5SvwtcUB1LK20lz3",
    seasonYear: 2025,
    shortForm: "DbyD",
  },
];

type TourDataType = {
  name: string;
  logoUrl: string;
  seasonYear: number;
  shortForm: string;
};

export async function seedTours() {
  seedData.map(async (tourData: TourDataType) => {
    return await api.tour.create({
      name: tourData.name,
      logoUrl: tourData.logoUrl,
      seasonYear: tourData.seasonYear,
      shortForm: tourData.shortForm,
    });
  });
}
