import pandas as pd
from sqlalchemy import create_engine
from database import SQLALCHEMY_DATABASE_URL

def run_etl():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    print("1. Cargando Competiciones...")
    df_comp = pd.read_csv('data/competitions.csv')
    df_comp_db = df_comp[['competition_id', 'name', 'country_name', 'type']].rename(
        columns={'competition_id': 'id', 'country_name': 'country'}
    )
    df_comp_db.to_sql('competitions', engine, if_exists='append', index=False)
    
    print("2. Cargando Equipos y Valores de Mercado...")
    df_clubs = pd.read_csv('data/clubs.csv')
    df_clubs_db = df_clubs[['club_id', 'name', 'stadium_name', 'total_market_value']].rename(
        columns={'club_id': 'id', 'total_market_value': 'market_value'}
    )
    df_clubs_db['market_value'] = df_clubs_db['market_value'].fillna(0.0)
    df_clubs_db.to_sql('teams', engine, if_exists='append', index=False)
    
    print("3. Cargando Partidos (Histórico Completo Top 5 Ligas Europeas)...")
    df_games = pd.read_csv('data/games.csv')
    
    # GB1=Premier League, ES1=La Liga, IT1=Serie A, L1=Bundesliga, FR1=Ligue 1
    top_5_leagues = ['GB1', 'ES1', 'IT1', 'L1', 'FR1']
    df_games = df_games[(df_games['competition_id'].isin(top_5_leagues))].copy()
    
    seasons_data = df_games[['competition_id', 'season']].drop_duplicates()
    seasons_db = pd.DataFrame({
        'competition_id': seasons_data['competition_id'],
        'year': seasons_data['season'].astype(str)
    }).reset_index(drop=True)
    seasons_db['id'] = range(1, len(seasons_db) + 1)
    seasons_db.to_sql('seasons', engine, if_exists='append', index=False)
    
    season_map = dict(zip(zip(seasons_db['competition_id'], seasons_db['year']), seasons_db['id']))
    df_games['season_id'] = df_games.apply(lambda row: season_map[(row['competition_id'], str(row['season']))], axis=1)

    df_matches_db = pd.DataFrame()
    df_matches_db['id'] = df_games['game_id']
    df_matches_db['season_id'] = df_games['season_id']
    df_matches_db['home_team_id'] = df_games['home_club_id']
    df_matches_db['away_team_id'] = df_games['away_club_id']
    df_matches_db['date'] = pd.to_datetime(df_games['date']).dt.date
    df_matches_db['home_score'] = df_games['home_club_goals']
    df_matches_db['away_score'] = df_games['away_club_goals']
    
    def determine_winner(row):
        if row['home_score'] > row['away_score']: return 'home'
        if row['home_score'] < row['away_score']: return 'away'
        return 'draw'
        
    df_matches_db['winner'] = df_matches_db.apply(determine_winner, axis=1)
    df_matches_db.to_sql('matches', engine, if_exists='append', index=False)
    
    print(f"¡ETL Completado! {len(df_matches_db)} partidos procesados.")

if __name__ == "__main__":
    run_etl()
