export interface TeamPrediction {
  expectedGoals: number;
  corners: number;
  cards: number;
  possession: number;
  shots: number;
}

export interface PlayerPrediction {
  playerName: string;
  team: string;
  market: string;
  line: string;
  odds: string;
  prob: number;
}

export interface MultiMarkets {
  win1: number;
  draw: number;
  win2: number;
  over15: number;
  over25: number;
  btts: number;
  dc1x: number;
  dcx2: number;
}

export interface ExtMarkets {
  xg_home: number;
  xg_away: number;
  goals_home_over05: number;
  goals_home_over15: number;
  goals_home_over25: number;
  goals_away_over05: number;
  goals_away_over15: number;
  goals_away_over25: number;
  goals_over35: number;
  // Cuotas estimadas goles por equipo
  odd_gh_over05?: number;
  odd_gh_over15?: number;
  odd_gh_over25?: number;
  odd_ga_over05?: number;
  odd_ga_over15?: number;
  odd_ga_over25?: number;
  corners_home_avg: number;
  corners_away_avg: number;
  corners_total_avg: number;
  corners_over85: number;
  corners_over95: number;
  corners_over105: number;
  // Cuotas estimadas corners
  odd_corners_over85?: number;
  odd_corners_over95?: number;
  odd_corners_over105?: number;
  cards_home_avg: number;
  cards_away_avg: number;
  cards_total_avg: number;
  cards_over25: number;
  cards_over35: number;
  cards_over45: number;
  // Cuotas estimadas tarjetas
  odd_cards_over25?: number;
  odd_cards_over35?: number;
  odd_cards_over45?: number;
}

export interface PlayerStat {
  id: number;
  name: string;
  position: string;
  nationality: string;
  team: string;
  team_id: number;
  goals: number;
  assists: number;
  played: number;
  goals_pg: number;
  assists_pg: number;
  shots_pg: number;
  shots_ot_pg: number;
  fouls_pg: number;
  cards_pg: number;
  prob_goal: number;
  prob_shot15: number;
  prob_shot25: number;
  prob_card: number;
}

export interface Match {
  home: string;
  away: string;
  homeLogo?: string;
  awayLogo?: string;
  time: string;
  conf: number;
  pick: string;
  odds: string;
  league?: string;
  live?: boolean;
  matchday?: number;
  totalMatchdays?: number;
  stage?: string;
  stageLabel?: string;
  sortDate?: string;
  analysis?: string;
  contextSummary?: string;
  extMarkets?: ExtMarkets;
  leagueId?: number;
  oddsRaw?: { home: number; draw: number; away: number; bookmaker: string };
  totalsRaw?: Record<string, number>;
  bttsRaw?: Record<string, number>;
  featuresSource?: string;
  homePred?: TeamPrediction;
  awayPred?: TeamPrediction;
  playerPreds?: PlayerPrediction[];
  multiMarkets?: MultiMarkets;
}

const teamLogos: Record<string, string> = {
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'Sevilla': 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
  'Valencia': 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg',
  'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'Man City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Man United': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'Juventus': 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg',
  'AC Milan': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'Inter Milan': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'AS Roma': 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg',
  'Napoli': 'https://upload.wikimedia.org/wikipedia/commons/2/28/S.S.C._Napoli_logo.svg',
  'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'Bayer Leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  'VfB Stuttgart': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg',
  'RB Leipzig': 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg',
  'PSG': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'Marseille': 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
  'AS Monaco': 'https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg',
  'Lyon': 'https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais.svg',
  'Lens': 'https://upload.wikimedia.org/wikipedia/en/c/cc/RC_Lens_logo.svg',
};

export const getTeamLogo = (teamName: string) => {
  return teamLogos[teamName] || 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Globe.svg'; // Placeholder genérico
};

const defaultContext = "Un partido muy disputado donde ambos equipos buscarán imponer sus condiciones desde el inicio.";

const defaultPred = {
  homePred: { expectedGoals: 1.8, corners: 6, cards: 2, possession: 55, shots: 12 },
  awayPred: { expectedGoals: 1.1, corners: 4, cards: 3, possession: 45, shots: 8 }
};

const defaultPlayerPreds = [
  { playerName: 'Delantero Estrella', team: 'Local', market: 'Tiros a puerta +1.5', line: '1.5', odds: '1.85', prob: 65 },
  { playerName: 'Mediocampista', team: 'Visitante', market: 'Tarjetas recibidas', line: '0.5', odds: '2.10', prob: 45 },
];

export const matchesByLeagueAndMatchday: Record<string, Record<number, Match[]>> = {
  'La Liga': {
    1: [
      { home:'Barcelona', away:'Real Madrid', time:'20:00', conf:92, pick:'1', odds:'1.85', contextSummary: 'Este partido es el Clásico Español por lo que tendrá un ritmo alto. Se esperan goles de ambos lados pero una ligera ventaja local por el factor estadio.', homePred: { expectedGoals: 2.1, corners: 7, cards: 3, possession: 58, shots: 15 }, awayPred: { expectedGoals: 1.5, corners: 5, cards: 4, possession: 42, shots: 11 }, playerPreds: [
        { playerName: 'Robert Lewandowski', team: 'Barcelona', market: 'Tiros a puerta +1.5', line: '1.5', odds: '1.95', prob: 68 },
        { playerName: 'Vinícius Jr.', team: 'Real Madrid', market: 'Tiros totales +2.5', line: '2.5', odds: '1.75', prob: 72 },
        { playerName: 'Jude Bellingham', team: 'Real Madrid', market: 'Faltas recibidas +1.5', line: '1.5', odds: '1.60', prob: 80 }
      ], multiMarkets: { win1: 45.2, draw: 25.1, win2: 29.7, over15: 77.6, over25: 54.8, btts: 54.3, dc1x: 71.1, dcx2: 66.5 } },
      { home:'Valencia', away:'Sevilla', time:'16:15', conf:62, pick:'X', odds:'3.80', contextSummary: 'Partido trabado en el mediocampo. Históricamente empatan mucho en este estadio.', ...defaultPred, playerPreds: defaultPlayerPreds, multiMarkets: { win1: 35.0, draw: 40.0, win2: 25.0, over15: 65.0, over25: 42.0, btts: 48.0, dc1x: 75.0, dcx2: 65.0 } },
      { home:'Atletico Madrid', away:'Getafe', time:'18:30', conf:78, pick:'1', odds:'2.15', contextSummary: 'Derbi madrileño. Juego defensivo por parte del visitante, pero el Atleti tiene ventaja clara en el xG.', ...defaultPred, playerPreds: defaultPlayerPreds },
    ],
  },
  'Premier League': {
    1: [
      { home:'Liverpool', away:'Man City', league:'Premier League', time:'17:30', conf:76, pick:'X', odds:'3.40', contextSummary: 'Choque de titanes en Anfield. El City dominará la posesión pero las transiciones del Liverpool equilibran la balanza.', homePred: { expectedGoals: 1.7, corners: 5, cards: 2, possession: 45, shots: 10 }, awayPred: { expectedGoals: 1.8, corners: 6, cards: 2, possession: 55, shots: 12 }, playerPreds: [
        { playerName: 'Erling Haaland', team: 'Man City', market: 'Anotará en cualquier momento', line: '0.5', odds: '2.10', prob: 55 },
        { playerName: 'Mohamed Salah', team: 'Liverpool', market: 'Tiros a puerta +0.5', line: '0.5', odds: '1.45', prob: 85 }
      ] },
      { home:'Chelsea', away:'Arsenal', league:'Premier League', time:'15:00', conf:71, pick:'1', odds:'2.10', contextSummary: defaultContext, ...defaultPred, playerPreds: defaultPlayerPreds },
      { home:'Man United', away:'Tottenham', time:'13:00', conf:62, pick:'X', odds:'3.60', contextSummary: defaultContext, ...defaultPred, playerPreds: defaultPlayerPreds },
    ],
  },
  'Serie A': {
    1: [
      { home:'Juventus', away:'AC Milan', league:'Serie A', time:'18:45', conf:68, pick:'2', odds:'2.90', contextSummary: defaultContext, ...defaultPred, playerPreds: defaultPlayerPreds },
      { home:'Inter Milan', away:'Napoli', time:'20:45', conf:77, pick:'1', odds:'2.10', contextSummary: defaultContext, ...defaultPred, playerPreds: defaultPlayerPreds },
    ],
  },
  'Bundesliga': {
    1: [
      { home:'Bayern Munich', away:'Borussia Dortmund', league:'Bundesliga', time:'19:30', conf:89, pick:'1', odds:'1.72', contextSummary: 'Der Klassiker. Bayern llega en excelente forma ofensiva y promedia más de 2 goles por partido en casa contra el Dortmund.', homePred: { expectedGoals: 2.8, corners: 8, cards: 1, possession: 62, shots: 18 }, awayPred: { expectedGoals: 0.9, corners: 3, cards: 2, possession: 38, shots: 7 }, playerPreds: defaultPlayerPreds },
    ],
  },
  'Ligue 1': {
    1: [
      { home:'PSG', away:'Marseille', league:'Ligue 1', time:'21:00', conf:84, pick:'1', odds:'1.55', contextSummary: defaultContext, ...defaultPred, playerPreds: defaultPlayerPreds },
    ],
  },
};

export const matches: Match[] = [
  ...(matchesByLeagueAndMatchday['La Liga'][1] || []).map(m => ({ ...m, league: 'La Liga', live: true })),
  ...(matchesByLeagueAndMatchday['Premier League'][1] || []).map(m => ({ ...m, league: 'Premier League' })),
  ...(matchesByLeagueAndMatchday['Serie A'][1] || []).map(m => ({ ...m, league: 'Serie A' })),
  ...(matchesByLeagueAndMatchday['Bundesliga'][1] || []).map(m => ({ ...m, league: 'Bundesliga' })),
  ...(matchesByLeagueAndMatchday['Ligue 1'][1] || []).map(m => ({ ...m, league: 'Ligue 1' })),
];

export const teamStats: Record<string, any> = {
  'Real Madrid': { winPct: 78, drawPct: 15, lossPct: 7, yellows: 24, reds: 1, corners: 142, tacklesWon: 487, shotsOnTarget: 186, possessionAvg: 62, foulsCommitted: 289, clearances: 412 },
  'Barcelona': { winPct: 75, drawPct: 11, lossPct: 14, yellows: 28, reds: 2, corners: 138, tacklesWon: 521, shotsOnTarget: 172, possessionAvg: 65, foulsCommitted: 301, clearances: 398 },
  'Man City': { winPct: 82, drawPct: 14, lossPct: 4, yellows: 19, reds: 0, corners: 156, tacklesWon: 412, shotsOnTarget: 198, possessionAvg: 68, foulsCommitted: 245, clearances: 356 },
  'Liverpool': { winPct: 68, drawPct: 18, lossPct: 14, yellows: 25, reds: 1, corners: 112, tacklesWon: 501, shotsOnTarget: 142, possessionAvg: 54, foulsCommitted: 298, clearances: 412 },
  'Bayern Munich': { winPct: 85, drawPct: 7, lossPct: 8, yellows: 16, reds: 0, corners: 168, tacklesWon: 467, shotsOnTarget: 214, possessionAvg: 66, foulsCommitted: 234, clearances: 378 },
  // Valores default para el resto...
};

// Se rellena el resto con valores aproximados para evitar errores
Object.keys(teamLogos).forEach(team => {
  if (!teamStats[team]) {
    teamStats[team] = { winPct: 50, drawPct: 25, lossPct: 25, yellows: 20, reds: 1, corners: 100, tacklesWon: 450, shotsOnTarget: 130, possessionAvg: 50, foulsCommitted: 280, clearances: 390 };
  }
});

export const teamPlayers: Record<string, any[]> = {
  'Real Madrid': [
    { name: 'Karim Benzema', goals: 18, assists: 8, yellows: 2, reds: 0, matches: 24 },
    { name: 'Vinícius Jr.', goals: 12, assists: 6, yellows: 4, reds: 0, matches: 22 },
  ],
  'Barcelona': [
    { name: 'Robert Lewandowski', goals: 19, assists: 7, yellows: 3, reds: 0, matches: 23 },
    { name: 'Pedri', goals: 4, assists: 6, yellows: 2, reds: 0, matches: 22 },
  ],
};

export const standings: Record<string, any[]> = {
  'La Liga': [
    { pos:1, team:'Real Madrid', played:28, wins:22, draws:4, losses:2, gf:68, ga:28, gd:40, pts:70 },
    { pos:2, team:'Barcelona', played:28, wins:21, draws:3, losses:4, gf:65, ga:31, gd:34, pts:66 },
    { pos:3, team:'Atletico Madrid', played:28, wins:13, draws:7, losses:8, gf:45, ga:38, gd:7, pts:46 },
  ],
  'Premier League': [
    { pos:1, team:'Man City', played:28, wins:23, draws:4, losses:1, gf:72, ga:22, gd:50, pts:73 },
    { pos:2, team:'Arsenal', played:28, wins:21, draws:3, losses:4, gf:68, ga:28, gd:40, pts:66 },
    { pos:3, team:'Liverpool', played:28, wins:19, draws:5, losses:4, gf:62, ga:32, gd:30, pts:62 },
  ],
  'Bundesliga': [
    { pos:1, team:'Bayern Munich', played:28, wins:24, draws:2, losses:2, gf:76, ga:25, gd:51, pts:74 },
    { pos:2, team:'Borussia Dortmund', played:28, wins:21, draws:3, losses:4, gf:68, ga:32, gd:36, pts:66 },
  ]
};

export const leaguesList = [
  { name:'Mundial 2026', flag:'🏆', id:'mundial-2026' },
];

export const leagues = [
  { name:'La Liga', flag:'🇪🇸', count:4, acc:82, total:45 },
  { name:'Premier League', flag:'🏴', count:3, acc:75, total:38 },
  { name:'Serie A', flag:'🇮🇹', count:3, acc:71, total:32 },
  { name:'Bundesliga', flag:'🇩🇪', count:2, acc:68, total:28 },
  { name:'Ligue 1', flag:'🇫🇷', count:2, acc:79, total:24 },
];

export const perf = [
  { name:'La Liga', pct:82 },
  { name:'Premier', pct:75 },
  { name:'Serie A', pct:71 },
  { name:'Bundesliga', pct:68 },
];

export const monthlyData = [
  { month:'Enero', roi:+8.2, predictions:45, wins:35 },
  { month:'Febrero', roi:+12.5, predictions:52, wins:40 },
  { month:'Marzo', roi:+14.5, predictions:59, wins:46 },
];
