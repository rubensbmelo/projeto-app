from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId
import os
from dotenv import load_dotenv

# 1. Carregar configurações
load_dotenv()

app = FastAPI(title="ERP Vendas 2026 - Sistema Integrado")

# 2. Configuração de CORS
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

# 4. Schemas Atualizados

class MaterialSchema(BaseModel):
    nome: str
    codigo: Optional[str] = ""
    descricao: Optional[str] = ""
    segmento: Optional[str] = ""
    preco_unit: float = 0.0
    peso_unit: float = 0.0
    comissao: float = 0.0

class ClienteSchema(BaseModel):
    nome: str
    cnpj: str
    endereco: Optional[str] = ""
    cidade: str
    estado: Optional[str] = ""
    comprador: Optional[str] = ""
    telefone: Optional[str] = ""
    email: Optional[str] = ""

class ItemPedido(BaseModel):
    material_id: str
    quantidade: int
    peso_calculado: float

class PedidoSchema(BaseModel):
    cliente_id: str
    itens: List[ItemPedido]
    status: str = "Pendente"

# --- ROTA DE AUTENTICAÇÃO ---

@app.post("/api/auth/login")
async def login(data: dict = Body(...)):
    email = data.get("email")
    password = data.get("password")
    if email == "admin@admin.com" and password == "123456":
        return {
            "access_token": "token-secret-12345",
            "token_type": "bearer",
            "user": {"nome": "Administrador", "email": email, "role": "admin"}
        }
    raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

@app.get("/api/auth/me")
async def get_me():
    return {"nome": "Administrador", "email": "admin@admin.com", "role": "admin"}

# --- 5. Rotas de MATERIAIS ---

@app.get("/api/materiais")
async def listar_materiais():
    materiais = await db.materiais.find().to_list(length=100)
    for m in materiais:
        m["id"] = str(m.pop("_id"))
    return materiais

@app.post("/api/materiais")
async def criar_material(material: MaterialSchema):
    result = await db.materiais.insert_one(material.dict())
    return {"id": str(result.inserted_id), "message": "Material salvo!"}

# --- 6. Rotas de PEDIDOS ---

@app.get("/api/pedidos")
async def listar_pedidos():
    pedidos = await db.pedidos.find().to_list(length=100)
    for p in pedidos:
        p["id"] = str(p.pop("_id"))
    return pedidos

@app.post("/api/pedidos")
async def criar_pedido(pedido: PedidoSchema):
    result = await db.pedidos.insert_one(pedido.dict())
    return {"id": str(result.inserted_id), "message": "Pedido registrado!"}

# --- 7. Rotas de CLIENTES (Completas) ---

@app.get("/api/clientes")
async def listar_clientes():
    clientes = await db.clientes.find().to_list(length=100)
    for c in clientes:
        c["id"] = str(c.pop("_id"))
    return clientes

@app.post("/api/clientes")
async def criar_cliente(cliente: ClienteSchema):
    result = await db.clientes.insert_one(cliente.dict())
    return {"id": str(result.inserted_id), "message": "Cliente cadastrado!"}

@app.put("/api/clientes/{cliente_id}")
async def atualizar_cliente(cliente_id: str, cliente: ClienteSchema):
    await db.clientes.update_one({"_id": ObjectId(cliente_id)}, {"$set": cliente.dict()})
    return {"message": "Cliente atualizado!"}

@app.delete("/api/clientes/{cliente_id}")
async def deletar_cliente(cliente_id: str):
    await db.clientes.delete_one({"_id": ObjectId(cliente_id)})
    return {"message": "Cliente removido!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)