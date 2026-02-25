import asyncio
import os
import bcrypt
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Carregar variáveis do .env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_admin():
    try:
        # Puxa as configurações do seu arquivo .env
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]

        email = "admin@admin.com"
        senha_limpa = "admin123"
        nome = "Administrador"

        # Verifica se já existe
        existing = await db.users.find_one({"email": email})
        if existing:
            print(f"🟡 O usuário {email} já existe!")
            return

        # Criptografa a senha exatamente como o seu server.py faz
        hashed_password = bcrypt.hashpw(senha_limpa.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Monta o documento do usuário
        user_doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "nome": nome,
            "hashed_password": hashed_password,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Insere no MongoDB
        await db.users.insert_one(user_doc)
        print(f"✅ Sucesso! Usuário Admin criado.")
        print(f"📧 Email: {email}")
        print(f"🔑 Senha: {senha_limpa}")

    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())