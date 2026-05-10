import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

def train_and_evaluate(X, y, target_name, is_multiclass=False):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, shuffle=False)
    
    print(f"Entrenando especialista: {target_name}...")
    model = xgb.XGBClassifier(
        objective='multi:softprob' if is_multiclass else 'binary:logistic',
        num_class=3 if is_multiclass else None,
        n_estimators=200,
        learning_rate=0.01,
        max_depth=4,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0 # Silenciar warnings
    )
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    # Guardar modelo
    os.makedirs('data/processed/models', exist_ok=True)
    joblib.dump(model, f'data/processed/models/xgb_{target_name}.pkl')
    return acc

def train_all():
    print("Cargando dataset Multi-Mercado V3.0...")
    df = pd.read_csv('data/processed/model_features_v3.csv')
    df = df.dropna()
    df = df.iloc[2500:] # Excluir calentamiento de Elo
    
    features = [
        'home_elo', 'away_elo', 'elo_diff',
        'home_rest_days', 'away_rest_days',
        'home_form', 'away_form', 
        'home_gs_avg', 'away_gs_avg',
        'home_gc_avg', 'away_gc_avg',
        'h2h_home_win_rate'
    ]
    
    X = df[features]
    
    targets = {
        '1x2': ('target_1x2', True),
        'over15': ('target_o15', False),
        'over25': ('target_o25', False),
        'btts': ('target_btts', False),
        'dc_1x': ('target_dc_1x', False),
        'dc_x2': ('target_dc_x2', False)
    }
    
    results = {}
    print("\n--- INICIANDO ENTRENAMIENTO MULTI-MODELO ---")
    for name, (col, is_multi) in targets.items():
        acc = train_and_evaluate(X, df[col], name, is_multi)
        results[name] = acc
        
    print("\n=== RESUMEN DE PRECISIÓN POR MERCADO ===")
    for name, acc in results.items():
        print(f"Mercado '{name}': {acc*100:.2f}%")
        
    print("\n¡Todos los modelos guardados en data/processed/models/!")

if __name__ == "__main__":
    train_all()
