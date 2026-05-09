export interface Match {
  home: string;
  away: string;
  time: string;
  conf: number;
  pick: string;
  odds: string;
  league?: string;
  live?: boolean;
}

export const matchesByLeagueAndMatchday: Record<string, Record<number, Match[]>> = {
  'La Liga': {
    1: [
      { home:'Barcelona', away:'Real Madrid', time:'20:00', conf:92, pick:'1', odds:'1.85' },
      { home:'Valencia', away:'Sevilla', time:'16:15', conf:62, pick:'X', odds:'3.80' },
      { home:'Atletico Madrid', away:'Getafe', time:'18:30', conf:78, pick:'1', odds:'2.15' },
    ],
    2: [
      { home:'Real Madrid', away:'Barcelona', time:'21:00', conf:88, pick:'1', odds:'1.95' },
      { home:'Sevilla', away:'Valencia', time:'19:45', conf:71, pick:'2', odds:'2.50' },
      { home:'Atletico Madrid', away:'Real Sociedad', time:'17:15', conf:76, pick:'1', odds:'2.05' },
    ],
    3: [
      { home:'Barcelona', away:'Valencia', time:'20:30', conf:85, pick:'1', odds:'1.72' },
      { home:'Sevilla', away:'Atletico Madrid', time:'18:00', conf:68, pick:'X', odds:'3.25' },
    ],
  },
  'Premier League': {
    1: [
      { home:'Liverpool', away:'Man City', league:'Premier League', time:'17:30', conf:76, pick:'X', odds:'3.40' },
      { home:'Chelsea', away:'Arsenal', league:'Premier League', time:'15:00', conf:71, pick:'1', odds:'2.10' },
      { home:'Man United', away:'Tottenham', time:'13:00', conf:62, pick:'X', odds:'3.60' },
    ],
    2: [
      { home:'Man City', away:'Liverpool', time:'16:00', conf:81, pick:'1', odds:'2.20' },
      { home:'Arsenal', away:'Chelsea', time:'14:30', conf:73, pick:'1', odds:'2.05' },
      { home:'Brighton', away:'Man United', time:'18:45', conf:65, pick:'2', odds:'2.40' },
    ],
    3: [
      { home:'Liverpool', away:'Chelsea', time:'19:45', conf:79, pick:'1', odds:'1.90' },
      { home:'Arsenal', away:'Man City', time:'17:30', conf:74, pick:'2', odds:'2.30' },
    ],
  },
  'Serie A': {
    1: [
      { home:'Juventus', away:'AC Milan', league:'Serie A', time:'18:45', conf:68, pick:'2', odds:'2.90' },
      { home:'Inter Milan', away:'Napoli', time:'20:45', conf:77, pick:'1', odds:'2.10' },
      { home:'AS Roma', away:'Lazio', time:'15:00', conf:64, pick:'X', odds:'3.40' },
    ],
    2: [
      { home:'AC Milan', away:'Juventus', time:'19:45', conf:72, pick:'2', odds:'2.85' },
      { home:'Napoli', away:'Inter Milan', time:'20:30', conf:69, pick:'1', odds:'2.55' },
      { home:'Lazio', away:'AS Roma', time:'17:00', conf:61, pick:'X', odds:'3.55' },
    ],
    3: [
      { home:'Juventus', away:'Napoli', time:'20:00', conf:84, pick:'1', odds:'1.85' },
      { home:'Inter Milan', away:'AC Milan', time:'18:15', conf:76, pick:'1', odds:'2.25' },
    ],
  },
  'Bundesliga': {
    1: [
      { home:'Bayern Munich', away:'Borussia Dortmund', league:'Bundesliga', time:'19:30', conf:89, pick:'1', odds:'1.72' },
      { home:'Bayer Leverkusen', away:'VfB Stuttgart', time:'15:30', conf:75, pick:'1', odds:'1.95' },
      { home:'RB Leipzig', away:'Werder Bremen', time:'17:30', conf:82, pick:'1', odds:'1.65' },
    ],
    2: [
      { home:'Borussia Dortmund', away:'Bayern Munich', time:'18:30', conf:74, pick:'2', odds:'2.75' },
      { home:'VfB Stuttgart', away:'Bayer Leverkusen', time:'16:00', conf:68, pick:'X', odds:'3.30' },
      { home:'Werder Bremen', away:'RB Leipzig', time:'19:30', conf:71, pick:'2', odds:'2.90' },
    ],
    3: [
      { home:'Bayern Munich', away:'Bayer Leverkusen', time:'19:45', conf:87, pick:'1', odds:'1.58' },
      { home:'Borussia Dortmund', away:'VfB Stuttgart', time:'17:00', conf:79, pick:'1', odds:'2.15' },
    ],
  },
  'Ligue 1': {
    1: [
      { home:'PSG', away:'Marseille', league:'Ligue 1', time:'21:00', conf:84, pick:'1', odds:'1.55' },
      { home:'AS Monaco', away:'Lyon', time:'19:00', conf:73, pick:'1', odds:'2.20' },
      { home:'Lens', away:'Nice', time:'17:00', conf:66, pick:'X', odds:'3.15' },
    ],
    2: [
      { home:'Marseille', away:'PSG', time:'20:00', conf:67, pick:'2', odds:'3.50' },
      { home:'Lyon', away:'AS Monaco', time:'19:30', conf:71, pick:'2', odds:'2.65' },
      { home:'Nice', away:'Lens', time:'18:00', conf:69, pick:'1', odds:'2.30' },
    ],
    3: [
      { home:'PSG', away:'Lyon', time:'21:00', conf:86, pick:'1', odds:'1.68' },
      { home:'Marseille', away:'AS Monaco', time:'19:45', conf:74, pick:'1', odds:'2.35' },
    ],
  },
};

export const matches: Match[] = [
  ...matchesByLeagueAndMatchday['La Liga'][1].map(m => ({ ...m, league: 'La Liga', live: true })),
  ...matchesByLeagueAndMatchday['Premier League'][1].map(m => ({ ...m, league: 'Premier League' })),
  ...matchesByLeagueAndMatchday['Serie A'][1].map(m => ({ ...m, league: 'Serie A' })),
  ...matchesByLeagueAndMatchday['Bundesliga'][1].map(m => ({ ...m, league: 'Bundesliga' })),
  ...matchesByLeagueAndMatchday['Ligue 1'][1].map(m => ({ ...m, league: 'Ligue 1' })),
];

export const teamStats: Record<string, any> = {
  'Real Madrid': { yellows: 24, reds: 1, corners: 142, tacklesWon: 487, shotsOnTarget: 186, possessionAvg: 62, foulsCommitted: 289, clearances: 412 },
  'Barcelona': { yellows: 28, reds: 2, corners: 138, tacklesWon: 521, shotsOnTarget: 172, possessionAvg: 65, foulsCommitted: 301, clearances: 398 },
  'Sevilla': { yellows: 22, reds: 0, corners: 98, tacklesWon: 445, shotsOnTarget: 124, possessionAvg: 48, foulsCommitted: 267, clearances: 356 },
  'Valencia': { yellows: 20, reds: 1, corners: 85, tacklesWon: 412, shotsOnTarget: 112, possessionAvg: 51, foulsCommitted: 278, clearances: 387 },
  'Atletico Madrid': { yellows: 31, reds: 2, corners: 96, tacklesWon: 498, shotsOnTarget: 118, possessionAvg: 47, foulsCommitted: 312, clearances: 421 },
  'Man City': { yellows: 19, reds: 0, corners: 156, tacklesWon: 412, shotsOnTarget: 198, possessionAvg: 68, foulsCommitted: 245, clearances: 356 },
  'Arsenal': { yellows: 23, reds: 1, corners: 124, tacklesWon: 478, shotsOnTarget: 164, possessionAvg: 59, foulsCommitted: 289, clearances: 398 },
  'Liverpool': { yellows: 25, reds: 1, corners: 112, tacklesWon: 501, shotsOnTarget: 142, possessionAvg: 54, foulsCommitted: 298, clearances: 412 },
  'Chelsea': { yellows: 27, reds: 2, corners: 98, tacklesWon: 434, shotsOnTarget: 118, possessionAvg: 52, foulsCommitted: 301, clearances: 389 },
  'Man United': { yellows: 26, reds: 1, corners: 102, tacklesWon: 421, shotsOnTarget: 126, possessionAvg: 50, foulsCommitted: 315, clearances: 405 },
  'Juventus': { yellows: 24, reds: 1, corners: 115, tacklesWon: 456, shotsOnTarget: 142, possessionAvg: 55, foulsCommitted: 267, clearances: 398 },
  'AC Milan': { yellows: 22, reds: 0, corners: 108, tacklesWon: 489, shotsOnTarget: 138, possessionAvg: 52, foulsCommitted: 278, clearances: 387 },
  'Inter Milan': { yellows: 20, reds: 1, corners: 105, tacklesWon: 512, shotsOnTarget: 135, possessionAvg: 51, foulsCommitted: 271, clearances: 402 },
  'AS Roma': { yellows: 28, reds: 2, corners: 96, tacklesWon: 434, shotsOnTarget: 118, possessionAvg: 49, foulsCommitted: 312, clearances: 376 },
  'Napoli': { yellows: 25, reds: 1, corners: 92, tacklesWon: 421, shotsOnTarget: 112, possessionAvg: 50, foulsCommitted: 298, clearances: 368 },
  'Bayern Munich': { yellows: 16, reds: 0, corners: 168, tacklesWon: 467, shotsOnTarget: 214, possessionAvg: 66, foulsCommitted: 234, clearances: 378 },
  'Borussia Dortmund': { yellows: 21, reds: 1, corners: 135, tacklesWon: 489, shotsOnTarget: 175, possessionAvg: 52, foulsCommitted: 289, clearances: 412 },
  'Bayer Leverkusen': { yellows: 19, reds: 0, corners: 118, tacklesWon: 478, shotsOnTarget: 156, possessionAvg: 54, foulsCommitted: 267, clearances: 398 },
  'VfB Stuttgart': { yellows: 23, reds: 1, corners: 112, tacklesWon: 445, shotsOnTarget: 142, possessionAvg: 48, foulsCommitted: 301, clearances: 421 },
  'RB Leipzig': { yellows: 20, reds: 1, corners: 98, tacklesWon: 512, shotsOnTarget: 128, possessionAvg: 49, foulsCommitted: 278, clearances: 389 },
  'PSG': { yellows: 18, reds: 0, corners: 152, tacklesWon: 421, shotsOnTarget: 198, possessionAvg: 61, foulsCommitted: 256, clearances: 367 },
  'Marseille': { yellows: 26, reds: 1, corners: 126, tacklesWon: 512, shotsOnTarget: 162, possessionAvg: 48, foulsCommitted: 298, clearances: 405 },
  'AS Monaco': { yellows: 22, reds: 1, corners: 114, tacklesWon: 478, shotsOnTarget: 142, possessionAvg: 50, foulsCommitted: 271, clearances: 387 },
  'Lyon': { yellows: 24, reds: 2, corners: 98, tacklesWon: 445, shotsOnTarget: 124, possessionAvg: 47, foulsCommitted: 312, clearances: 398 },
  'Lens': { yellows: 28, reds: 1, corners: 92, tacklesWon: 456, shotsOnTarget: 116, possessionAvg: 46, foulsCommitted: 325, clearances: 412 },
};

export const teamPlayers: Record<string, any[]> = {
  'Real Madrid': [
    { name: 'Karim Benzema', goals: 18, assists: 8, yellows: 2, reds: 0, matches: 24 },
    { name: 'Vinícius Jr.', goals: 12, assists: 6, yellows: 4, reds: 0, matches: 22 },
    { name: 'Federico Valverde', goals: 3, assists: 5, yellows: 3, reds: 0, matches: 20 },
    { name: 'Toni Kroos', goals: 2, assists: 4, yellows: 1, reds: 0, matches: 19 },
    { name: 'Luka Modrić', goals: 1, assists: 3, yellows: 2, reds: 0, matches: 18 },
  ],
  'Barcelona': [
    { name: 'Robert Lewandowski', goals: 19, assists: 7, yellows: 3, reds: 0, matches: 23 },
    { name: 'Ousmane Dembélé', goals: 8, assists: 5, yellows: 2, reds: 0, matches: 21 },
    { name: 'Pedri', goals: 4, assists: 6, yellows: 2, reds: 0, matches: 22 },
    { name: 'Gavi', goals: 3, assists: 4, yellows: 3, reds: 0, matches: 20 },
    { name: 'Sergi Busquets', goals: 0, assists: 2, yellows: 1, reds: 0, matches: 19 },
  ],
  // We can add the others based on HTML...
  'Man City': [
    { name: 'Erling Haaland', goals: 24, assists: 6, yellows: 2, reds: 0, matches: 21 },
    { name: 'Bernardo Silva', goals: 7, assists: 5, yellows: 2, reds: 0, matches: 20 },
    { name: 'Jack Grealish', goals: 5, assists: 8, yellows: 3, reds: 0, matches: 19 },
    { name: 'Phil Foden', goals: 8, assists: 7, yellows: 1, reds: 0, matches: 18 },
    { name: 'Rodri', goals: 2, assists: 3, yellows: 2, reds: 0, matches: 22 },
  ],
  'Arsenal': [
    { name: 'Bukayo Saka', goals: 9, assists: 7, yellows: 2, reds: 0, matches: 20 },
    { name: 'Emile Smith Rowe', goals: 6, assists: 4, yellows: 1, reds: 0, matches: 18 },
    { name: 'Gabriel Jesus', goals: 7, assists: 5, yellows: 3, reds: 0, matches: 19 },
    { name: 'Martin Ødegaard', goals: 4, assists: 6, yellows: 2, reds: 0, matches: 21 },
    { name: 'Thomas Partey', goals: 1, assists: 2, yellows: 2, reds: 0, matches: 17 },
  ],
  'Liverpool': [
    { name: 'Mohamed Salah', goals: 11, assists: 6, yellows: 1, reds: 0, matches: 20 },
    { name: 'Luis Díaz', goals: 8, assists: 4, yellows: 2, reds: 0, matches: 19 },
    { name: 'Darwin Núñez', goals: 6, assists: 2, yellows: 4, reds: 1, matches: 16 },
    { name: 'Cody Gakpo', goals: 4, assists: 3, yellows: 1, reds: 0, matches: 15 },
    { name: 'Dominic Szoboszlai', goals: 2, assists: 3, yellows: 2, reds: 0, matches: 14 },
  ],
  'Bayern Munich': [
    { name: 'Serge Gnabry', goals: 10, assists: 5, yellows: 1, reds: 0, matches: 18 },
    { name: 'Kingsley Coman', goals: 7, assists: 6, yellows: 2, reds: 0, matches: 16 },
    { name: 'Leroy Sané', goals: 8, assists: 4, yellows: 2, reds: 0, matches: 17 },
    { name: 'Thomas Müller', goals: 5, assists: 7, yellows: 1, reds: 0, matches: 19 },
    { name: 'Joshua Kimmich', goals: 1, assists: 3, yellows: 2, reds: 0, matches: 20 },
  ],
  'PSG': [
    { name: 'Kylian Mbappé', goals: 20, assists: 8, yellows: 2, reds: 0, matches: 22 },
    { name: 'Neymar', goals: 9, assists: 10, yellows: 3, reds: 0, matches: 18 },
    { name: 'Marco Verratti', goals: 1, assists: 2, yellows: 1, reds: 0, matches: 17 },
    { name: 'Achraf Hakimi', goals: 3, assists: 4, yellows: 2, reds: 0, matches: 19 },
    { name: 'Marquinhos', goals: 0, assists: 0, yellows: 2, reds: 0, matches: 21 },
  ],
  'Juventus': [
    { name: 'Dusan Vlahovic', goals: 14, assists: 3, yellows: 3, reds: 0, matches: 20 },
    { name: 'Juan Cuadrado', goals: 2, assists: 5, yellows: 2, reds: 0, matches: 18 },
    { name: 'Weston McKennie', goals: 3, assists: 2, yellows: 3, reds: 0, matches: 16 },
    { name: 'Manuel Locatelli', goals: 1, assists: 1, yellows: 2, reds: 0, matches: 17 },
    { name: 'Leonardo Bonucci', goals: 0, assists: 0, yellows: 1, reds: 0, matches: 19 },
  ],
  'Inter Milan': [
    { name: 'Lautaro Martínez', goals: 12, assists: 4, yellows: 2, reds: 0, matches: 19 },
    { name: 'Romelu Lukaku', goals: 8, assists: 3, yellows: 3, reds: 0, matches: 15 },
    { name: 'Nicolo Barella', goals: 2, assists: 4, yellows: 2, reds: 0, matches: 18 },
    { name: 'Denzel Dumfries', goals: 3, assists: 2, yellows: 2, reds: 0, matches: 17 },
    { name: 'Alessandro Bastoni', goals: 0, assists: 0, yellows: 1, reds: 0, matches: 20 },
  ],
};

export const standings: Record<string, any[]> = {
  'La Liga': [
    { pos:1, team:'Real Madrid', played:28, wins:22, draws:4, losses:2, gf:68, ga:28, gd:40, pts:70 },
    { pos:2, team:'Barcelona', played:28, wins:21, draws:3, losses:4, gf:65, ga:31, gd:34, pts:66 },
    { pos:3, team:'Sevilla', played:28, wins:17, draws:6, losses:5, gf:52, ga:35, gd:17, pts:57 },
    { pos:4, team:'Valencia', played:28, wins:14, draws:8, losses:6, gf:48, ga:32, gd:16, pts:50 },
    { pos:5, team:'Atletico Madrid', played:28, wins:13, draws:7, losses:8, gf:45, ga:38, gd:7, pts:46 },
  ],
  'Premier League': [
    { pos:1, team:'Man City', played:28, wins:23, draws:4, losses:1, gf:72, ga:22, gd:50, pts:73 },
    { pos:2, team:'Arsenal', played:28, wins:21, draws:3, losses:4, gf:68, ga:28, gd:40, pts:66 },
    { pos:3, team:'Liverpool', played:28, wins:19, draws:5, losses:4, gf:62, ga:32, gd:30, pts:62 },
    { pos:4, team:'Chelsea', played:28, wins:16, draws:6, losses:6, gf:55, ga:38, gd:17, pts:54 },
    { pos:5, team:'Man United', played:28, wins:14, draws:8, losses:6, gf:50, ga:42, gd:8, pts:50 },
  ],
  'Serie A': [
    { pos:1, team:'Juventus', played:28, wins:21, draws:4, losses:3, gf:64, ga:29, gd:35, pts:67 },
    { pos:2, team:'AC Milan', played:28, wins:20, draws:3, losses:5, gf:62, ga:34, gd:28, pts:63 },
    { pos:3, team:'Inter Milan', played:28, wins:18, draws:6, losses:4, gf:58, ga:31, gd:27, pts:60 },
    { pos:4, team:'AS Roma', played:28, wins:16, draws:5, losses:7, gf:52, ga:36, gd:16, pts:53 },
    { pos:5, team:'Napoli', played:28, wins:15, draws:4, losses:9, gf:48, ga:40, gd:8, pts:49 },
  ],
  'Bundesliga': [
    { pos:1, team:'Bayern Munich', played:28, wins:24, draws:2, losses:2, gf:76, ga:25, gd:51, pts:74 },
    { pos:2, team:'Borussia Dortmund', played:28, wins:21, draws:3, losses:4, gf:68, ga:32, gd:36, pts:66 },
    { pos:3, team:'Bayer Leverkusen', played:28, wins:19, draws:4, losses:5, gf:62, ga:38, gd:24, pts:61 },
    { pos:4, team:'VfB Stuttgart', played:28, wins:17, draws:6, losses:5, gf:58, ga:35, gd:23, pts:57 },
    { pos:5, team:'RB Leipzig', played:28, wins:16, draws:5, losses:7, gf:54, ga:40, gd:14, pts:53 },
  ],
  'Ligue 1': [
    { pos:1, team:'PSG', played:28, wins:23, draws:4, losses:1, gf:75, ga:23, gd:52, pts:73 },
    { pos:2, team:'Marseille', played:28, wins:19, draws:6, losses:3, gf:62, ga:28, gd:34, pts:63 },
    { pos:3, team:'AS Monaco', played:28, wins:18, draws:5, losses:5, gf:58, ga:34, gd:24, pts:59 },
    { pos:4, team:'Lyon', played:28, wins:16, draws:4, losses:8, gf:52, ga:40, gd:12, pts:52 },
    { pos:5, team:'Lens', played:28, wins:15, draws:3, losses:10, gf:48, ga:45, gd:3, pts:48 },
  ],
};

export const leaguesList = [
  { name:'La Liga', flag:'🇪🇸', id:'la-liga' },
  { name:'Premier League', flag:'🏴', id:'premier-league' },
  { name:'Serie A', flag:'🇮🇹', id:'serie-a' },
  { name:'Bundesliga', flag:'🇩🇪', id:'bundesliga' },
  { name:'Ligue 1', flag:'🇫🇷', id:'ligue-1' },
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
