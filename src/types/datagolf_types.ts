
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

export type DatagolfFieldInput = {
  course_name: string;
  current_round: number;
  event_name: string;
  field: DatagolfFieldGolfer[];
};
type DatagolfFieldGolfer = {
  am: number;
  country: string;
  dg_id: number;
  dk_id: string;
  dk_salary: number;
  early_late: number;
  fd_id: string;
  fd_salary: number;
  flag: string;
  pga_number: number;
  player_name: string;
  r1_teetime: string;
  start_hole: number;
  unofficial: number;
  yh_id: string;
  yh_salary: number;
};

export type DatagolfRankingInput = {
  last_updated: string;
  notes: string;
  rankings: DataGolfRankingGolfer[];
};
type DataGolfRankingGolfer = {
  am: number;
  country: string;
  datagolf_rank: number;
  dg_id: number;
  dg_skill_estimate: number;
  owgr_rank: number;
  player_name: string;
  primary_tour: string;
};

export type DatagolfEventInput = {
  calendar_year: number;
  date: string;
  event_id: number;
  event_name: string;
  sg_categories: string;
  traditional_stats: string;
  tour: string;
};
