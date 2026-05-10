import os
import requests
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY")

# Usaremos la URL directa de API-Sports
BASE_URL = "https://v3.football.api-sports.io"
HEADERS = {
    'x-apisports-key': API_KEY
}

def test_connection():
    if not API_KEY or API_KEY == "pega_tu_clave_aqui":
        print("[ERROR] API Key no configurada en el archivo .env")
        return False
        
    url = f"{BASE_URL}/status"
    try:
        response = requests.get(url, headers=HEADERS)
        data = response.json()
        
        if data.get("errors"):
            print("[ERROR] de Autenticacion:", data["errors"])
            return False
            
        print("[EXITO] Conexion exitosa a API-Football!")
        print("Peticiones restantes hoy:", data["response"]["requests"]["limit_day"] - data["response"]["requests"]["current"])
        return True
    except Exception as e:
        print("[ERROR] conectando a la API:", str(e))
        return False

if __name__ == "__main__":
    test_connection()
