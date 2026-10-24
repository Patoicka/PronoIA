/** Logos oficiales de ligas (assets en /public/images/leagues). */
const LEAGUE_LOGOS: Record<string, string> = {
  'Premier League': '/images/leagues/premier-league.png',
  'La Liga': '/images/leagues/la-liga.png',
  'Serie A': '/images/leagues/serie-a.png',
  Bundesliga: '/images/leagues/bundesliga.png',
  'Ligue 1': '/images/leagues/ligue-1.png',
};

export function getLeagueLogo(leagueName: string | undefined | null): string | undefined {
  if (!leagueName) return undefined;
  if (LEAGUE_LOGOS[leagueName]) return LEAGUE_LOGOS[leagueName];

  const key = Object.keys(LEAGUE_LOGOS).find(
    (k) => k.toLowerCase() === leagueName.toLowerCase(),
  );
  return key ? LEAGUE_LOGOS[key] : undefined;
}
