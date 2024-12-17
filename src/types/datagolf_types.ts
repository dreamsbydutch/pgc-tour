import { z } from "zod";

export type DatagolfTournament = {
  course: string;
  course_key: string;
  event_id: number;
  event_name: string;
  latitude: number;
  longitude: number;
  location: string;
  start_date: string;
};
