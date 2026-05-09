from database import engine, Base
import models

def init():
    print("Conectando a PostgreSQL y creando tablas...")
    Base.metadata.create_all(bind=engine)
    print("¡Tablas creadas exitosamente!")

if __name__ == "__main__":
    init()
