from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

# ============================================================
# 1. Configurações
# ============================================================
load_dotenv()

app = FastAPI(title="ERP Vendas 2026 - Sistema Integrado")

# ============================================================
# 2. CORS — restrito ao seu frontend no Vercel
# ============================================================
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://projeto-app-pink.vercel.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 3. Conexão com MongoDB Atlas
# ============================================================
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URL)
db = client.erp_database

# ============================================================
# 4. Segurança — JWT + Bcrypt
# ============================================================
SECRET_KEY = os.getenv("SECRET_KEY", "TROQUE-ISSO-POR-UMA-CHAVE-SECRETA-FORTE-NO-ENV")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def verificar_senha(senha_plain: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha_plain, senha_hash)


def gerar_hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)


def criar_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """Dependência que protege rotas — valida o JWT em cada requisição."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {"email": email, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")


def apenas_admin(usuario=Depends(verificar_token)):
    """Dependência extra para rotas exclusivas de administrador."""
    if usuario.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return usuario


# ============================================================
# 5. Usuário padrão — criado no startup se não existir
#    Troque a senha via variável de ambiente ADMIN_PASSWORD
# ============================================================
@app.on_event("startup")
async def criar_usuario_padrao():
    senha_env = os.getenv("ADMIN_PASSWORD", "TroqueEssaSenha@2026")
    usuario_existente = await db.usuarios.find_one({"email": "rubensbmelo@hotmail.com"})
    if not usuario_existente:
        await db.usuarios.insert_one({
            "nome": "Administrador",
            "email": "rubensbmelo@hotmail.com",
            "senha_hash": gerar_hash_senha(senha_env),
            "role": "admin"
        })
        print("✅ Usuário admin criado com senha do .env")


# ============================================================
# 6. Schemas (Modelos de Dados)
# ============================================================

class LoginSchema(BaseModel):
    email: str
    password: str


class MaterialSchema(BaseModel):
    nome: str
    numero_fe: Optional[str] = ""
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
    cliente_id: Optional[str] = ""
    cliente_nome: str
    item_nome: str
    itens: Optional[List[ItemPedido]] = []
    status: str = "PENDENTE"
    valor_total: float = 0.0
    peso_total: float = 0.0
    data_entrega: Optional[str] = ""
    numero_fabrica: Optional[str] = ""
    numero_oc: Optional[str] = ""
    condicao_pagamento: Optional[str] = ""


# ============================================================
# 7. Helper para converter ObjectId com segurança
# ============================================================
def to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail=f"ID inválido: {id_str}")


# ============================================================
# 8. Rotas de AUTENTICAÇÃO
# ============================================================

@app.post("/api/auth/login")
async def login(data: LoginSchema):
    usuario = await db.usuarios.find_one({"email": data.email})
    if not usuario or not verificar_senha(data.password, usuario["senha_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    token = criar_token({"sub": usuario["email"], "role": usuario["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "nome": usuario["nome"],
            "email": usuario["email"],
            "role": usuario["role"]
        }
    }


@app.get("/api/auth/me")
async def get_me(usuario=Depends(verificar_token)):
    """Retorna dados do usuário logado — rota protegida."""
    return usuario


# ============================================================
# 9. Rotas de MATERIAIS (protegidas)
# ============================================================

@app.get("/api/materiais")
async def listar_materiais(usuario=Depends(verificar_token)):
    materiais = await db.materiais.find().to_list(length=500)
    for m in materiais:
        m["id"] = str(m.pop("_id"))
    return materiais


@app.post("/api/materiais")
async def criar_material(material: MaterialSchema, usuario=Depends(verificar_token)):
    result = await db.materiais.insert_one(material.dict())
    return {"id": str(result.inserted_id), "message": "Material salvo!"}


@app.put("/api/materiais/{material_id}")
async def atualizar_material(material_id: str, material: MaterialSchema, usuario=Depends(verificar_token)):
    await db.materiais.update_one(
        {"_id": to_object_id(material_id)},
        {"$set": material.dict()}
    )
    return {"message": "Material atualizado!"}


@app.delete("/api/materiais/{material_id}")
async def deletar_material(material_id: str, usuario=Depends(apenas_admin)):
    """Apenas admins podem deletar materiais."""
    await db.materiais.delete_one({"_id": to_object_id(material_id)})
    return {"message": "Material removido!"}


# ============================================================
# 10. Rotas de PEDIDOS (protegidas)
# ============================================================

@app.get("/api/pedidos")
async def listar_pedidos(usuario=Depends(verificar_token)):
    pedidos = await db.pedidos.find().to_list(length=500)
    for p in pedidos:
        p["id"] = str(p.pop("_id"))
    return pedidos


@app.post("/api/pedidos")
async def criar_pedido(pedido: PedidoSchema, usuario=Depends(verificar_token)):
    result = await db.pedidos.insert_one(pedido.dict())
    return {"id": str(result.inserted_id), "message": "Pedido registrado!"}


@app.put("/api/pedidos/{pedido_id}")
async def atualizar_pedido(pedido_id: str, pedido: PedidoSchema, usuario=Depends(verificar_token)):
    await db.pedidos.update_one(
        {"_id": to_object_id(pedido_id)},
        {"$set": pedido.dict()}
    )
    return {"message": "Pedido atualizado com sucesso!"}


@app.delete("/api/pedidos/{pedido_id}")
async def deletar_pedido(pedido_id: str, usuario=Depends(apenas_admin)):
    """Apenas admins podem deletar pedidos."""
    await db.pedidos.delete_one({"_id": to_object_id(pedido_id)})
    return {"message": "Pedido removido!"}


# ============================================================
# 11. Rotas de CLIENTES (protegidas)
# ============================================================

@app.get("/api/clientes")
async def listar_clientes(usuario=Depends(verificar_token)):
    clientes = await db.clientes.find().to_list(length=100)
    for c in clientes:
        c["id"] = str(c.pop("_id"))
    return clientes


@app.post("/api/clientes")
async def criar_cliente(cliente: ClienteSchema, usuario=Depends(verificar_token)):
    result = await db.clientes.insert_one(cliente.dict())
    return {"id": str(result.inserted_id), "message": "Cliente cadastrado!"}


@app.put("/api/clientes/{cliente_id}")
async def atualizar_cliente(cliente_id: str, cliente: ClienteSchema, usuario=Depends(verificar_token)):
    await db.clientes.update_one(
        {"_id": to_object_id(cliente_id)},
        {"$set": cliente.dict()}
    )
    return {"message": "Cliente atualizado!"}


@app.delete("/api/clientes/{cliente_id}")
async def deletar_cliente(cliente_id: str, usuario=Depends(apenas_admin)):
    """Apenas admins podem deletar clientes."""
    await db.clientes.delete_one({"_id": to_object_id(cliente_id)})
    return {"message": "Cliente removido!"}


# ============================================================
# 12. Inicialização
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
