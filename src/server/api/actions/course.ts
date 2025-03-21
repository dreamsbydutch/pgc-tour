"use server";

import { api } from "@/trpcLocal/server";

export async function seedCourses() {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  courses.forEach(addCourseToDB);
}

const addCourseToDB = async (course: SeedCourse) => {
  const existingCourse = await api.course.getByName({ name: course.name });
  if (existingCourse) return;
  await api.course.create({
    apiId: course.apiId,
    name: course.name,
    location: course.location,
    par: +course.par,
    front: +course.front,
    back: +course.back,
  });
  return;
};

type SeedCourse = {
  apiId: string;
  name: string;
  location: string;
  par: number;
  front: number;
  back: number;
};

const courses: SeedCourse[] = [
  {
    apiId: "874",
    name: "Hamilton Golf & Country Club",
    location: "Ancaster, ON",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "503",
    name: "TPC River Highlands",
    location: "Hartford, CT",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "004",
    name: "Torrey Pines Golf Course (South Course)",
    location: "San Diego, CA",
    par: 71,
    front: 35,
    back: 36,
  },
  {
    apiId: "510",
    name: "TPC Scottsdale (Stadium Course)",
    location: "Scottsdale, AZ",
    par: 71,
    front: 35,
    back: 36,
  },
  {
    apiId: "023",
    name: "Muirfield Village Golf Club",
    location: "Dublin, OH",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "671",
    name: "Valhalla Golf Club",
    location: "Louisville, KY",
    par: 71,
    front: 35,
    back: 36,
  },
  {
    apiId: "921",
    name: "TPC Craig Ranch",
    location: "McKinney, TX",
    par: 36,
    front: 35,
    back: 71,
  },
  {
    apiId: "977",
    name: "The Renaissance Club",
    location: "North Berwick, Scotland",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "714",
    name: "TPC Louisiana",
    location: "Avondale, LA",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "014",
    name: "Augusta National Golf Club",
    location: "Augusta, GA",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "770",
    name: "TPC San Antonio (Oaks Course)",
    location: "San Antonio, TX",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "012",
    name: "Harbour Town Golf Links",
    location: "Hilton Head Island, SC",
    par: 71,
    front: 36,
    back: 35,
  },
  {
    apiId: "528",
    name: "Pinehurst Resort & Country Club (Course No. 2)",
    location: "Pinehurst, NC",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "872",
    name: "Quail Hollow Club",
    location: "Charlotte, NC",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "009",
    name: "Arnold Palmer's Bay Hill Club & Lodge",
    location: "Bay Hill, FL",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "500",
    name: "The Riviera Country Club",
    location: "Pacific Palisades, CA",
    par: 71,
    front: 35,
    back: 36,
  },
  {
    apiId: "709",
    name: "Royal Troon",
    location: "Troon, United Kingdom",
    par: 71,
    front: 35,
    back: 36,
  },
  {
    apiId: "876",
    name: "Detroit Golf Club",
    location: "Detroit, MI",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "513",
    name: "TPC Southwind",
    location: "Memphis, TN",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "011",
    name: "TPC Sawgrass (THE PLAYERS Stadium Course)",
    location: "Ponte Vedra Beach, FL",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "",
    name: "Caves Valley Golf Club",
    location: "Baltimore, MD",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "",
    name: "Castle Pines Golf Club",
    location: "Castle Rock, CO",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "",
    name: "Olympia Fields Country Club",
    location: "Olympia Fields, IL",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "Wilmington Country Club",
    location: "Wilmington, DE",
    par: 71,
    front: 35,
    back: 36,
  },
  {
    apiId: "",
    name: "Oakdale Golf & Country Club",
    location: "Toronto, ON",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "",
    name: "East Lake Golf Club",
    location: "Atlanta, GA",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "TPC Potomac at Avenel Farm",
    location: "Potomac, MD",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "Kiawah Island Golf Resort",
    location: "Kiawah Island, SC",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "",
    name: "Oak Hill Country Club",
    location: "Rochester, NY",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "Southern Hills Country Club",
    location: "Tulsa, OK",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "Liberty National Golf Club",
    location: "Jersey City, NJ",
    par: 71,
    front: 36,
    back: 35,
  },
  {
    apiId: "",
    name: "St. Andrews Links (Old Course)",
    location: "Fife, SCO",
    par: 72,
    front: 36,
    back: 36,
  },
  {
    apiId: "",
    name: "Royal St George's Golf Club",
    location: "Kent, ENG",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "Royal Liverpool",
    location: "Liverpool, ENG",
    par: 71,
    front: 35,
    back: 36,
  },
  {
    apiId: "",
    name: "The Country Club",
    location: "Brookline, MA",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "The Los Angeles Country Club",
    location: "Los Angeles, CA",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "Club de Golf Chapultepec",
    location: "Naucalpan, MEX",
    par: 71,
    front: 35,
    back: 36,
  },
  {
    apiId: "",
    name: "Memorial Park Golf Course",
    location: "Houston, TX",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "The Philadelphia Cricket Club (Wassahickon Course)",
    location: "Philadelphia, PA",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "TPC Toronto at Osprey Valley (North Course)",
    location: "Caledon, ON",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "Oakmont Country Club",
    location: "Oakmont, PA",
    par: 70,
    front: 35,
    back: 35,
  },
  {
    apiId: "",
    name: "Royal Portrush Golf Club",
    location: "Portrush, NIR",
    par: 71,
    front: 36,
    back: 35,
  },
];

export async function seedCoursesFromDataGolf() {
  const existingCourses = await api.course.getAll();

  await Promise.all(
    existingCourses.map(async (obj) => {

      await api.course.update({
        name: obj.name,
      });
    }),
  );
}

