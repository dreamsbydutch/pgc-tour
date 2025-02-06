"use server";

import { fetchDataGolf } from "@/src/lib/utils";
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

  existingCourses.map(async (obj) => {
    const location = seedLocations.find(
      (a) => a.city === obj.location.split(", ")[0],
    );

    await api.course.update({
      name: obj.name,
      longitude: location?.lng,
      latitude: location?.lat,
    });
  });
}

const seedLocations = [
  { city: "Kiawah Island", region: "SC", lat: 32.6082, lng: -80.0848 },
  { city: "Liverpool", region: "ENG", lat: 53.4, lng: -2.9833 },
  { city: "Troon", region: "SCT", lat: 55.5333, lng: -4.6667 },
  { city: "Wilmington", region: "DE", lat: 39.7392, lng: -75.5398 },
  { city: "Bay Hill", region: "FL", lat: 28.4636, lng: -81.5072 },
  { city: "Jersey City", region: "NJ", lat: 40.7178, lng: -74.0437 },
  { city: "Louisville", region: "KY", lat: 38.2527, lng: -85.7585 },
  { city: "McKinney", region: "TX", lat: 33.1976, lng: -96.6398 },
  { city: "Scottsdale", region: "AZ", lat: 33.4942, lng: -111.9261 },
  { city: "Castle Rock", region: "CO", lat: 39.3725, lng: -104.8561 },
  { city: "Memphis", region: "TN", lat: 35.1495, lng: -90.049 },
  { city: "Baltimore", region: "MD", lat: 39.2904, lng: -76.6122 },
  { city: "San Diego", region: "CA", lat: 32.7157, lng: -117.1611 },
  { city: "Avondale", region: "LA", lat: 29.8894, lng: -90.0973 },
  { city: "Atlanta", region: "GA", lat: 33.749, lng: -84.388 },
  { city: "Dublin", region: "OH", lat: 40.0992, lng: -83.1146 },
  { city: "Los Angeles", region: "CA", lat: 34.0522, lng: -118.2437 },
  { city: "Naucalpan", region: "MEX", lat: 19.4769, lng: -99.2392 },
  { city: "Charlotte", region: "NC", lat: 35.2271, lng: -80.8431 },
  { city: "Augusta", region: "GA", lat: 33.4735, lng: -82.0105 },
  { city: "Hilton Head Island", region: "SC", lat: 32.2163, lng: -80.7526 },
  { city: "Ponte Vedra Beach", region: "FL", lat: 30.2583, lng: -81.3874 },
  { city: "San Antonio", region: "TX", lat: 29.4241, lng: -98.4936 },
  { city: "Tulsa", region: "OK", lat: 36.1539, lng: -95.9928 },
  { city: "Detroit", region: "MI", lat: 42.3314, lng: -83.0458 },
  { city: "Pacific Palisades", region: "CA", lat: 34.0375, lng: -118.5145 },
  { city: "Fife", region: "SCT", lat: 56.19, lng: -3.02 },
  { city: "Potomac", region: "MD", lat: 39.038, lng: -77.2075 },
  { city: "Pinehurst", region: "NC", lat: 35.1944, lng: -79.4628 },
  { city: "Rochester", region: "NY", lat: 43.1566, lng: -77.6088 },
  { city: "Kent", region: "ENG", lat: 51.2786, lng: 0.5204 },
  { city: "Olympia Fields", region: "IL", lat: 41.5483, lng: -87.7412 },
  { city: "Toronto", region: "ON", lat: 43.7001, lng: -79.4163 },
  { city: "Caledon", region: "ON", lat: 43.8581, lng: -79.7663 },
  { city: "Portrush", region: "NIR", lat: 55.19, lng: -6.65 },
  { city: "Houston", region: "TX", lat: 29.7604, lng: -95.3698 },
  { city: "Philadelphia", region: "PA", lat: 39.9526, lng: -75.1652 },
  { city: "Oakmont", region: "PA", lat: 40.5292, lng: -79.8444 },
  { city: "Ancaster", region: "ON", lat: 43.255, lng: -80.0167 },
  { city: "Brookline", region: "MA", lat: 42.3318, lng: -71.1212 },
  { city: "Hartford", region: "CT", lat: 41.7637, lng: -72.6851 },
  { city: "North Berwick", region: "SCT", lat: 56.0575, lng: -2.7181 },
];
