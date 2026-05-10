import pandas as pd
from sqlalchemy import create_engine
from database import SQLALCHEMY_DATABASE_URL
import os
import math

def load_data():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    query = """
    SELECT id, date, home_team_id, away_team_id, home_score, away_score, winner
    FROM matches
    ORDER BY date ASC
    """
    df = pd.read_sql(query, engine)
    df['date'] = pd.to_datetime(df['date'])
    return df

def calculate_elo_and_features(df):
    print("Calculando IA Nivel Profesional: Elo Rating, H2H y Fatiga...")
    df = df.sort_values('date').copy()
    
    # Estados
    team_stats = {} # 'elo', 'last_date', 'points', 'gs', 'gc'
    h2h_stats = {}
    
    # Constantes Elo
    INITIAL_ELO = 1500
    HOME_ADVANTAGE = 65  # Puntos de ventaja por jugar de local
    K_FACTOR = 20 # Qué tan rápido cambia el Elo
    
    def expected_result(elo_home, elo_away):
        return 1 / (1 + 10 ** ((elo_away - elo_home) / 400))
    
    features = {
        'home_elo': [], 'away_elo': [], 'elo_diff': [],
        'home_rest_days': [], 'away_rest_days': [],
        'home_form': [], 'away_form': [],
        'home_gs_avg': [], 'away_gs_avg': [],
        'home_gc_avg': [], 'away_gc_avg': [],
        'h2h_home_win_rate': [],
    }
    
    for index, row in df.iterrows():
        home_team = row['home_team_id']
        away_team = row['away_team_id']
        match_date = row['date']
        
        # Inicializar
        if home_team not in team_stats:
            team_stats[home_team] = {'elo': INITIAL_ELO, 'last_date': None, 'points': [], 'gs': [], 'gc': []}
        if away_team not in team_stats:
            team_stats[away_team] = {'elo': INITIAL_ELO, 'last_date': None, 'points': [], 'gs': [], 'gc': []}
            
        h_s = team_stats[home_team]
        a_s = team_stats[away_team]
        
        # 1. Elo Rating
        features['home_elo'].append(h_s['elo'])
        features['away_elo'].append(a_s['elo'])
        features['elo_diff'].append((h_s['elo'] + HOME_ADVANTAGE) - a_s['elo'])
        
        # 2. Fatiga (Días de descanso)
        h_rest = (match_date - h_s['last_date']).days if h_s['last_date'] else 14
        a_rest = (match_date - a_s['last_date']).days if a_s['last_date'] else 14
        features['home_rest_days'].append(min(h_rest, 14))
        features['away_rest_days'].append(min(a_rest, 14))
        
        # 3. Rachas
        features['home_form'].append(sum(h_s['points'][-5:]) / 5 if len(h_s['points']) >= 5 else 1.0)
        features['away_form'].append(sum(a_s['points'][-5:]) / 5 if len(a_s['points']) >= 5 else 1.0)
        features['home_gs_avg'].append(sum(h_s['gs'][-5:]) / 5 if len(h_s['gs']) >= 5 else 1.0)
        features['away_gs_avg'].append(sum(a_s['gs'][-5:]) / 5 if len(a_s['gs']) >= 5 else 1.0)
        features['home_gc_avg'].append(sum(h_s['gc'][-5:]) / 5 if len(h_s['gc']) >= 5 else 1.0)
        features['away_gc_avg'].append(sum(a_s['gc'][-5:]) / 5 if len(a_s['gc']) >= 5 else 1.0)
        
        # 4. H2H
        matchup_key = frozenset([home_team, away_team])
        if matchup_key not in h2h_stats:
            h2h_stats[matchup_key] = []
            
        history = h2h_stats[matchup_key][-5:]
        if len(history) == 0:
            features['h2h_home_win_rate'].append(0.33)
        else:
            home_wins = history.count(home_team)
            features['h2h_home_win_rate'].append(home_wins / len(history))
            
        # --- ACTUALIZAR ESTADOS PARA EL FUTURO ---
        
        # Actualizar Elo
        if row['winner'] == 'home':
            actual_home_result = 1.0
        elif row['winner'] == 'away':
            actual_home_result = 0.0
        else:
            actual_home_result = 0.5
            
        exp_home = expected_result(h_s['elo'] + HOME_ADVANTAGE, a_s['elo'])
        
        # Margen de victoria (Goal Difference multiplier)
        gd = abs(row['home_score'] - row['away_score'])
        if gd <= 1:
            g_mult = 1.0
        elif gd == 2:
            g_mult = 1.5
        else:
            g_mult = (11 + gd) / 8.0
            
        h_s['elo'] = h_s['elo'] + K_FACTOR * g_mult * (actual_home_result - exp_home)
        a_s['elo'] = a_s['elo'] + K_FACTOR * g_mult * ((1 - actual_home_result) - (1 - exp_home))
        
        # Actualizar Fechas
        h_s['last_date'] = match_date
        a_s['last_date'] = match_date
        
        # Actualizar Rachas y H2H
        if row['winner'] == 'home':
            h_s['points'].append(3); a_s['points'].append(0)
            h2h_stats[matchup_key].append(home_team)
        elif row['winner'] == 'away':
            h_s['points'].append(0); a_s['points'].append(3)
            h2h_stats[matchup_key].append(away_team)
        else:
            h_s['points'].append(1); a_s['points'].append(1)
            h2h_stats[matchup_key].append(0)
            
        h_s['gs'].append(row['home_score']); h_s['gc'].append(row['away_score'])
        a_s['gs'].append(row['away_score']); a_s['gc'].append(row['home_score'])

    for key, val_list in features.items():
        df[key] = val_list
        
    df['target_1x2'] = df['winner'].map({'home': 0, 'draw': 1, 'away': 2})
    
    total_goals = df['home_score'] + df['away_score']
    df['target_o15'] = (total_goals > 1.5).astype(int)
    df['target_o25'] = (total_goals > 2.5).astype(int)
    
    df['target_btts'] = ((df['home_score'] > 0) & (df['away_score'] > 0)).astype(int)
    
    df['target_dc_1x'] = df['winner'].isin(['home', 'draw']).astype(int)
    df['target_dc_x2'] = df['winner'].isin(['away', 'draw']).astype(int)
    
    return df

if __name__ == "__main__":
    df_raw = load_data()
    print(f"Total de partidos: {len(df_raw)}")
    df_features = calculate_elo_and_features(df_raw)
    
    os.makedirs('data/processed', exist_ok=True)
    df_features.to_csv('data/processed/model_features_v3.csv', index=False)
    print("¡Features calculados y guardados en model_features_v3.csv!")
