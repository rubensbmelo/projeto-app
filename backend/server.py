from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from io import BytesIO
from weasyprint import HTML
from jinja2 import Template
import pandas as pd

# Configuração de diretórios e ambiente
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'erp_vendas')]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'sua-chave-secreta-aqui')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

app = FastAPI(title="ERP Sistema de Gestão de Vendas")

# ============= CONFIGURAÇÃO DE CORS =============
origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nome: str
    role: str = "vendedor"  # 'admin' ou 'vendedor'
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    nome: str
    password: str
    role: Optional[str] = "vendedor"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class Cliente(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referencia: str
    nome: str
    cnpj: str
    endereco: str
    cidade: str
    estado: str
    comprador: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClienteCreate(BaseModel):
    nome: str
    cnpj: str
    endereco: str
    cidade: str
    estado: str
    comprador: str
    telefone: Optional[str] = None
    email: Optional[str] = None

class Material(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    codigo: str
    descricao: str
    segmento: str
    peso_unitario: float
    porcentagem_comissao: float
    preco_unitario: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MaterialCreate(BaseModel):
    codigo: str
    descricao: str
    segmento: str
    peso_unitario: float
    porcentagem_comissao: float
    preco_unitario: float

class ItemPedido(BaseModel):
    material_id: str
    quantidade: int
    peso_total: float
    valor_unitario: float
    ipi: float
    subtotal: float

class Pedido(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    numero_oc: str
    cliente_id: str
    itens: List[ItemPedido]
    status: str
    numero_pedido_fabrica: Optional[str] = None
    valor_total: float
    peso_total: float
    data_criacao: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    observacoes: Optional[str] = None

class PedidoCreate(BaseModel):
    cliente_id: str
    itens: List[ItemPedido]
    observacoes: Optional[str] = None

class DashboardStats(BaseModel):
    tonelagem_implantada: float
    comissao_prevista: float
    tonelagem_faturada: float
    comissao_realizada: float
    pedidos_mes_valor: float
    faturado_mes_valor: float
    comissao_mes: float
    comissoes_a_receber: float

# ============= HELPER FUNCTIONS =============

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise credentials_exception
    except jwt.PyJWTError: raise credentials_exception
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None: raise credentials_exception
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return current_user

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate, admin: dict = Depends(get_admin_user)):
    if await db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(
        email=user_data.email, 
        nome=user_data.nome, 
        role=user_data.role, 
        hashed_password=hash_password(user_data.password)
    )
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "nome": user.nome, "role": user.role}}

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user["email"], "nome": user["nome"], "role": user.get("role", "vendedor"), "id": user.get("id")}}

# ============= CLIENTES ENDPOINTS =============

@api_router.get("/clientes", response_model=List[Cliente])
async def listar_clientes(current_user: dict = Depends(get_current_user)):
    clientes = await db.clientes.find({}, {"_id": 0}).to_list(1000)
    return clientes

@api_router.post("/clientes", response_model=Cliente)
async def criar_cliente(cliente_data: ClienteCreate, current_user: dict = Depends(get_current_user)):
    ultimo = await db.clientes.find_one({}, sort=[("created_at", -1)])
    new_num = 1
    if ultimo and "referencia" in ultimo:
        try: new_num = int(ultimo["referencia"].split("-")[1]) + 1
        except: pass
    
    cliente = Cliente(referencia=f"CLI-{new_num:04d}", **cliente_data.model_dump())
    doc = cliente.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.clientes.insert_one(doc)
    return cliente

# ============= MATERIAIS ENDPOINTS =============

@api_router.get("/materiais", response_model=List[Material])
async def listar_materiais(current_user: dict = Depends(get_current_user)):
    return await db.materiais.find({}, {"_id": 0}).to_list(1000)

@api_router.post("/materiais", response_model=Material)
async def criar_material(mat_data: MaterialCreate, admin: dict = Depends(get_admin_user)):
    material = Material(**mat_data.model_dump())
    doc = material.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.materiais.insert_one(doc)
    return material

# ============= PEDIDOS ENDPOINTS =============

@api_router.get("/pedidos", response_model=List[Pedido])
async def listar_pedidos(current_user: dict = Depends(get_current_user)):
    return await db.pedidos.find({}, {"_id": 0}).to_list(1000)

@api_router.post("/pedidos", response_model=Pedido)
async def criar_pedido(pedido_data: PedidoCreate, current_user: dict = Depends(get_current_user)):
    valor_total = sum(item.subtotal for item in pedido_data.itens)
    peso_total = sum(item.peso_total for item in pedido_data.itens)
    
    pedido = Pedido(
        numero_oc=f"OC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        cliente_id=pedido_data.cliente_id,
        itens=pedido_data.itens,
        status="Implantado",
        valor_total=valor_total,
        peso_total=peso_total,
        observacoes=pedido_data.observacoes
    )
    doc = pedido.model_dump()
    doc['data_criacao'] = doc['data_criacao'].isoformat()
    await db.pedidos.insert_one(doc)
    return pedido

# ============= DASHBOARD STATS =============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    inicio_mes = now.replace(day=1, hour=0, minute=0, second=0).isoformat()
    
    pedidos_mes = await db.pedidos.find({"data_criacao": {"$gte": inicio_mes}}).to_list(1000)
    
    return DashboardStats(
        tonelagem_implantada=sum(p["peso_total"] for p in pedidos_mes if p["status"] == "Implantado") / 1000,
        comissao_prevista=0.0,
        tonelagem_faturada=sum(p["peso_total"] for p in pedidos_mes if p["status"] == "Atendido") / 1000,
        comissao_realizada=0.0,
        pedidos_mes_valor=sum(p["valor_total"] for p in pedidos_mes),
        faturado_mes_valor=0.0,
        comissao_mes=0.0,
        comissoes_a_receber=0.0
    )

# INCLUSÃO DAS ROTAS E STARTUP
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)