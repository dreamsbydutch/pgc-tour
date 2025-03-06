export type DatagolfTournament = {
  course: string;
  course_key: string;
  event_id: number;
  event_name: string;
  location: string;
  start_date: string;
};

export type DatagolfFieldInput = {
  course_name: string;
  current_round: number;
  event_name: string;
  field: DatagolfFieldGolfer[];
};
export type DatagolfFieldGolfer = {
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
  r2_teetime: string;
  r3_teetime: string;
  r4_teetime: string;
  start_hole: number;
  unofficial: number;
  yh_id: string;
  yh_salary: number;
  ranking_data: DataGolfRankingGolfer | undefined;
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

export type DataGolfLiveTournament = {
  data: DatagolfLiveGolfer[];
  info: DatagolfLiveInfo;
};

type DatagolfLiveInfo = {
  current_round: number;
  dead_heat_rules: string;
  event_name: string;
  last_update: string;
};
export type DatagolfLiveGolfer = {
  R1: number | null;
  R2: number | null;
  R3: number | null;
  R4: number | null;
  country: string;
  course: string;
  current_pos: string;
  current_score: number;
  dg_id: number;
  end_hole: number;
  make_cut: number;
  player_name: string;
  round: number;
  thru: number;
  today: number;
  top_10: number;
  top_20: number;
  top_5: number;
  win: number;
};

export type DatagolfCourseInputData = {
  courses: {
    course_code: string;
    course_key: string;
    rounds: { holes: GolfHole[]; round_num: number }[];
  }[];
  current_round: number;
  event_name: string;
  last_update: string;
};

type GolfHole = {
  afternoon_wave: {
    avg_score: number;
    birdies: number;
    bogeys: number;
    doubles_or_worse: number;
    eagles_or_better: number;
    pars: number;
    players_thru: number;
  };
  hole: number;
  morning_wave: {
    avg_score: number;
    birdies: number;
    bogeys: number;
    doubles_or_worse: number;
    eagles_or_better: number;
    pars: number;
    players_thru: number;
  };
  par: number;
  total: {
    avg_score: number;
    birdies: number;
    bogeys: number;
    doubles_or_worse: number;
    eagles_or_better: number;
    pars: number;
    players_thru: number;
  };
  yardage: number;
};
