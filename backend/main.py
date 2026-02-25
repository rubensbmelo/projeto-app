from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
import os
from dotenv import load_dotenv

# 1. Carregar configurações do arquivo .env
load_dotenv()

app = FastAPI(title="ERP Vendas 2026 - Sistema Integrado")

# 2. Configuração de CORS - Libera o acesso para o seu React (Vercel e Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Conexão com o MongoDB Atlas
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    MONGODB_URL = "mongodb://localhost:27017"

client = AsyncIOMotorClient(MONGODB_URL)
db = client.erp_database 

# 4. Schemas (Estrutura dos Dados)

class MaterialSchema(BaseModel):
    nome: str
    peso_padrao: float

class ClienteSchema(BaseModel):
    nome: str
    cnpj: str
    cidade: str

class ItemPedido(BaseModel):
    material_id: str
    quantidade: int
    peso_calculado: float

class PedidoSchema(BaseModel):
    cliente_id: str
    itens: List[ItemPedido]
    status: str = "Pendente"

# --- NOVO: ROTA DE AUTENTICAÇÃO QUE ESTAVA FALTANDO ---

@app.post("/api/auth/login")
async def login(data: dict = Body(...)):
    email = data.get("email")
    password = data.get("password")

    # Logica de autenticação simples para teste
    # Você pode substituir por uma busca no banco futuramente
    if email == "admin@admin.com" and password == "123456":
        return {
            "access_token": "token-secret-12345",
            "token_type": "bearer",
            "user": {
                "nome": "Administrador",
                "email": email,
                "role": "admin"
            }
        }
    
    # Se as credenciais estiverem erradas
    raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

@app.get("/api/auth/me")
async def get_me():
    # Rota usada pelo seu AuthContext para validar se o usuário ainda está logado
    return {
        "nome": "Administrador",
        "email": "admin@admin.com",
        "role": "admin"
    }

# ---------------------------------------------------

# 5. Rotas de MATERIAIS

@app.get("/api/materiais")
async def listar_materiais():
    materiais = await db.materiais.find().to_list(length=100)
    for m in materiais:
        m["id"] = str(m.pop("_id"))
    return materiais

@app.post("/api/materiais")
async def criar_material(material: MaterialSchema):
    material_dict = material.dict()
    result = await db.materiais.insert_one(material_dict)
    return {"id": str(result.inserted_id), "message": "Material salvo no MongoDB!"}

# 6. Rotas de PEDIDOS

@app.get("/api/pedidos")
async def listar_pedidos():
    pedidos = await db.pedidos.find().to_list(length=100)
    for p in pedidos:
        p["id"] = str(p.pop("_id"))
    return pedidos

@app.post("/api/pedidos")
async def criar_pedido(pedido: PedidoSchema):
    pedido_dict = pedido.dict()
    result = await db.pedidos.insert_one(pedido_dict)
    return {"id": str(result.inserted_id), "message": "Pedido registrado com sucesso!"}

# 7. Rotas de CLIENTES

@app.get("/api/clientes")
async def listar_clientes():
    clientes = await db.clientes.find().to_list(length=100)
    for c in clientes:
        c["id"] = str(c.pop("_id"))
    return clientes

@app.post("/api/clientes")
async def criar_cliente(cliente: ClienteSchema):
    cliente_dict = cliente.dict()
    result = await db.clientes.insert_one(cliente_dict)
    return {"id": str(result.inserted_id), "message": "Cliente cadastrado!"}

# Iniciar o servidor
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)