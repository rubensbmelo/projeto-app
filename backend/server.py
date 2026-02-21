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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from weasyprint import HTML
from jinja2 import Template
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Create the main app
app = FastAPI(title="ERP Sistema de Gestão de Vendas")

# Create API router
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nome: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    nome: str
    password: str

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
    referencia: str  # Auto-generated: CLI-0001, CLI-0002, etc
    nome: str
    cnpj: str
    endereco: str
    cidade: str
    estado: str
    comprador: str  # Nome do responsável pelas compras
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
    segmento: str  # CAIXA, CHAPA, CORTE VINCO, SIMPLEX
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
    ipi: float  # 3.25%
    subtotal: float

class Pedido(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    numero_oc: str
    cliente_id: str
    itens: List[ItemPedido]
    status: str  # Digitado, Implantado, Atendido, Atendido Parcial
    numero_pedido_fabrica: Optional[str] = None
    valor_total: float
    peso_total: float
    data_criacao: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    observacoes: Optional[str] = None

class PedidoCreate(BaseModel):
    cliente_id: str
    itens: List[ItemPedido]
    observacoes: Optional[str] = None

class PedidoUpdate(BaseModel):
    numero_pedido_fabrica: Optional[str] = None
    status: Optional[str] = None
    observacoes: Optional[str] = None

class NotaFiscal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    numero_nf: str
    pedido_id: str
    valor_total: float
    data_emissao: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    numero_parcelas: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotaFiscalCreate(BaseModel):
    numero_nf: str
    pedido_id: str
    valor_total: float
    numero_parcelas: int
    data_primeira_parcela: str  # DD/MM/YYYY

class Vencimento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nota_fiscal_id: str
    parcela: int
    valor: float
    data_vencimento: datetime
    status: str  # Pendente, Pago, Atrasado
    data_pagamento: Optional[datetime] = None
    comissao_calculada: float

class VencimentoUpdate(BaseModel):
    status: str
    data_pagamento: Optional[str] = None  # DD/MM/YYYY

class DashboardStats(BaseModel):
    tonelagem_implantada: float  # TON de pedidos implantados no mês
    comissao_prevista: float
    tonelagem_faturada: float  # TON de notas fiscais do mês
    comissao_realizada: float
    pedidos_mes_valor: float  # Valor R$ de pedidos criados no mês
    faturado_mes_valor: float  # Valor R$ de NFs emitidas no mês
    comissao_mes: float  # Comissões com vencimento no mês atual
    comissoes_a_receber: float  # Total de comissões pendentes (global)

# ============= HELPER FUNCTIONS =============

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return user

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def gerar_numero_oc():
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"OC-{timestamp}"

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Create user
    hashed = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        nome=user_data.nome,
        hashed_password=hashed
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"email": user.email, "nome": user.nome, "id": user.id}
    }

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"email": user["email"], "nome": user["nome"], "id": user["id"]}
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"email": current_user["email"], "nome": current_user["nome"], "id": current_user["id"]}

# ============= CLIENTES ENDPOINTS =============

@api_router.get("/clientes", response_model=List[Cliente])
async def listar_clientes(current_user: dict = Depends(get_current_user)):
    clientes = await db.clientes.find({}, {"_id": 0}).to_list(1000)
    for cliente in clientes:
        if isinstance(cliente.get('created_at'), str):
            cliente['created_at'] = datetime.fromisoformat(cliente['created_at'])
    return clientes

@api_router.post("/clientes", response_model=Cliente)
async def criar_cliente(cliente_data: ClienteCreate, current_user: dict = Depends(get_current_user)):
    # Generate automatic sequential reference
    ultimo_cliente = await db.clientes.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    if ultimo_cliente and ultimo_cliente.get("referencia"):
        # Extract number from last reference (CLI-0001 -> 1)
        try:
            last_num = int(ultimo_cliente["referencia"].split("-")[1])
            new_num = last_num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    referencia = f"CLI-{new_num:04d}"  # CLI-0001, CLI-0002, etc
    
    cliente = Cliente(referencia=referencia, **cliente_data.model_dump())
    doc = cliente.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.clientes.insert_one(doc)
    return cliente

@api_router.put("/clientes/{cliente_id}", response_model=Cliente)
async def atualizar_cliente(cliente_id: str, cliente_data: ClienteCreate, current_user: dict = Depends(get_current_user)):
    doc = cliente_data.model_dump()
    result = await db.clientes.update_one({"id": cliente_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    updated = await db.clientes.find_one({"id": cliente_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/clientes/{cliente_id}")
async def deletar_cliente(cliente_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.clientes.delete_one({"id": cliente_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente deletado com sucesso"}

# ============= MATERIAIS ENDPOINTS =============

@api_router.get("/materiais", response_model=List[Material])
async def listar_materiais(current_user: dict = Depends(get_current_user)):
    materiais = await db.materiais.find({}, {"_id": 0}).to_list(1000)
    for material in materiais:
        if isinstance(material.get('created_at'), str):
            material['created_at'] = datetime.fromisoformat(material['created_at'])
    return materiais

@api_router.post("/materiais", response_model=Material)
async def criar_material(material_data: MaterialCreate, current_user: dict = Depends(get_current_user)):
    material = Material(**material_data.model_dump())
    doc = material.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.materiais.insert_one(doc)
    return material

@api_router.put("/materiais/{material_id}", response_model=Material)
async def atualizar_material(material_id: str, material_data: MaterialCreate, current_user: dict = Depends(get_current_user)):
    doc = material_data.model_dump()
    result = await db.materiais.update_one({"id": material_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    
    updated = await db.materiais.find_one({"id": material_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/materiais/{material_id}")
async def deletar_material(material_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.materiais.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    return {"message": "Material deletado com sucesso"}

# ============= PEDIDOS ENDPOINTS =============

@api_router.get("/pedidos", response_model=List[Pedido])
async def listar_pedidos(current_user: dict = Depends(get_current_user)):
    pedidos = await db.pedidos.find({}, {"_id": 0}).sort("data_criacao", -1).to_list(1000)
    for pedido in pedidos:
        if isinstance(pedido.get('data_criacao'), str):
            pedido['data_criacao'] = datetime.fromisoformat(pedido['data_criacao'])
    return pedidos

@api_router.post("/pedidos", response_model=Pedido)
async def criar_pedido(pedido_data: PedidoCreate, current_user: dict = Depends(get_current_user)):
    # Calculate totals
    valor_total = 0
    peso_total = 0
    
    for item in pedido_data.itens:
        valor_total += item.subtotal
        peso_total += item.peso_total
    
    pedido = Pedido(
        numero_oc=gerar_numero_oc(),
        cliente_id=pedido_data.cliente_id,
        itens=pedido_data.itens,
        status="Digitado",
        valor_total=valor_total,
        peso_total=peso_total,
        observacoes=pedido_data.observacoes
    )
    
    doc = pedido.model_dump()
    doc['data_criacao'] = doc['data_criacao'].isoformat()
    await db.pedidos.insert_one(doc)
    return pedido

@api_router.put("/pedidos/{pedido_id}", response_model=Pedido)
async def atualizar_pedido(pedido_id: str, pedido_data: PedidoUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in pedido_data.model_dump().items() if v is not None}
    
    if update_data:
        result = await db.pedidos.update_one({"id": pedido_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    updated = await db.pedidos.find_one({"id": pedido_id}, {"_id": 0})
    if isinstance(updated.get('data_criacao'), str):
        updated['data_criacao'] = datetime.fromisoformat(updated['data_criacao'])
    return updated

@api_router.get("/pedidos/{pedido_id}/pdf")
async def gerar_pdf_pedido(pedido_id: str, current_user: dict = Depends(get_current_user)):
    # Get pedido
    pedido = await db.pedidos.find_one({"id": pedido_id}, {"_id": 0})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    # Get cliente
    cliente = await db.clientes.find_one({"id": pedido["cliente_id"]}, {"_id": 0})
    
    # Get materiais details
    itens_detalhados = []
    for item in pedido["itens"]:
        material = await db.materiais.find_one({"id": item["material_id"]}, {"_id": 0})
        itens_detalhados.append({
            "descricao": material["descricao"],
            "codigo": material["codigo"],
            "quantidade": item["quantidade"],
            "peso_total": item["peso_total"],
            "valor_unitario": item["valor_unitario"],
            "ipi": item["ipi"],
            "subtotal": item["subtotal"]
        })
    
    # Generate HTML
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0f172a; padding-bottom: 20px; }
            .header h1 { color: #0f172a; margin: 0; }
            .info-section { margin: 20px 0; }
            .info-row { display: flex; margin: 5px 0; }
            .label { font-weight: bold; width: 150px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #0f172a; color: white; padding: 10px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>ORDEM DE COMPRA</h1>
            <p>{{ numero_oc }}</p>
        </div>
        
        <div class="info-section">
            <h3>Dados do Cliente</h3>
            <div class="info-row"><span class="label">Referência:</span> {{ cliente_referencia }}</div>
            <div class="info-row"><span class="label">Nome:</span> {{ cliente_nome }}</div>
            <div class="info-row"><span class="label">CNPJ:</span> {{ cliente_cnpj }}</div>
            <div class="info-row"><span class="label">Endereço:</span> {{ cliente_endereco }}</div>
        </div>
        
        <div class="info-section">
            <h3>Dados do Pedido</h3>
            <div class="info-row"><span class="label">Data:</span> {{ data_pedido }}</div>
            <div class="info-row"><span class="label">Status:</span> {{ status }}</div>
            {% if numero_fabrica %}
            <div class="info-row"><span class="label">N° Fábrica:</span> {{ numero_fabrica }}</div>
            {% endif %}
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Quantidade</th>
                    <th>Peso Total (kg)</th>
                    <th>Valor Unit.</th>
                    <th>IPI</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                {% for item in itens %}
                <tr>
                    <td>{{ item.codigo }}</td>
                    <td>{{ item.descricao }}</td>
                    <td style="text-align: center;">{{ item.quantidade }}</td>
                    <td style="text-align: right;">{{ "%.2f"|format(item.peso_total) }}</td>
                    <td style="text-align: right;">R$ {{ "%.2f"|format(item.valor_unitario) }}</td>
                    <td style="text-align: right;">R$ {{ "%.2f"|format(item.ipi) }}</td>
                    <td style="text-align: right;">R$ {{ "%.2f"|format(item.subtotal) }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
        
        <div class="total">
            <p>Peso Total: {{ "%.2f"|format(peso_total) }} kg</p>
            <p>Valor Total: R$ {{ "%.2f"|format(valor_total) }}</p>
        </div>
        
        {% if observacoes %}
        <div class="info-section">
            <h3>Observações</h3>
            <p>{{ observacoes }}</p>
        </div>
        {% endif %}
    </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(
        numero_oc=pedido["numero_oc"],
        cliente_referencia=cliente["referencia"],
        cliente_nome=cliente["nome"],
        cliente_cnpj=cliente["cnpj"],
        cliente_endereco=f"{cliente['endereco']}, {cliente['cidade']} - {cliente['estado']}",
        data_pedido=datetime.fromisoformat(pedido["data_criacao"]).strftime("%d/%m/%Y"),
        status=pedido["status"],
        numero_fabrica=pedido.get("numero_pedido_fabrica", ""),
        itens=itens_detalhados,
        peso_total=pedido["peso_total"],
        valor_total=pedido["valor_total"],
        observacoes=pedido.get("observacoes", "")
    )
    
    # Generate PDF
    pdf_bytes = HTML(string=html_content).write_pdf()
    
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ordem-compra-{pedido['numero_oc']}.pdf"}
    )

# ============= NOTAS FISCAIS ENDPOINTS =============

@api_router.get("/notas-fiscais", response_model=List[NotaFiscal])
async def listar_notas_fiscais(current_user: dict = Depends(get_current_user)):
    notas = await db.notas_fiscais.find({}, {"_id": 0}).sort("data_emissao", -1).to_list(1000)
    for nota in notas:
        if isinstance(nota.get('data_emissao'), str):
            nota['data_emissao'] = datetime.fromisoformat(nota['data_emissao'])
        if isinstance(nota.get('created_at'), str):
            nota['created_at'] = datetime.fromisoformat(nota['created_at'])
    return notas

@api_router.post("/notas-fiscais", response_model=NotaFiscal)
async def criar_nota_fiscal(nota_data: NotaFiscalCreate, current_user: dict = Depends(get_current_user)):
    # Get pedido to calculate commissions
    pedido = await db.pedidos.find_one({"id": nota_data.pedido_id}, {"_id": 0})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    nota = NotaFiscal(
        numero_nf=nota_data.numero_nf,
        pedido_id=nota_data.pedido_id,
        valor_total=nota_data.valor_total,
        numero_parcelas=nota_data.numero_parcelas
    )
    
    doc = nota.model_dump()
    doc['data_emissao'] = doc['data_emissao'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notas_fiscais.insert_one(doc)
    
    # Create vencimentos (parcelas)
    valor_parcela = nota_data.valor_total / nota_data.numero_parcelas
    data_base = datetime.strptime(nota_data.data_primeira_parcela, "%d/%m/%Y")
    
    # Calculate total commission for this order
    comissao_total = 0
    for item in pedido["itens"]:
        material = await db.materiais.find_one({"id": item["material_id"]}, {"_id": 0})
        comissao_item = item["subtotal"] * (material["porcentagem_comissao"] / 100)
        comissao_total += comissao_item
    
    comissao_parcela = comissao_total / nota_data.numero_parcelas
    
    for i in range(nota_data.numero_parcelas):
        data_vencimento = data_base + timedelta(days=30 * i)
        vencimento = Vencimento(
            nota_fiscal_id=nota.id,
            parcela=i + 1,
            valor=valor_parcela,
            data_vencimento=data_vencimento,
            status="Pendente",
            comissao_calculada=comissao_parcela
        )
        
        venc_doc = vencimento.model_dump()
        venc_doc['data_vencimento'] = venc_doc['data_vencimento'].isoformat()
        await db.vencimentos.insert_one(venc_doc)
    
    # Update pedido status
    await db.pedidos.update_one({"id": nota_data.pedido_id}, {"$set": {"status": "Atendido"}})
    
    return nota

@api_router.get("/vencimentos", response_model=List[Vencimento])
async def listar_vencimentos(current_user: dict = Depends(get_current_user)):
    vencimentos = await db.vencimentos.find({}, {"_id": 0}).sort("data_vencimento", 1).to_list(1000)
    for venc in vencimentos:
        if isinstance(venc.get('data_vencimento'), str):
            venc['data_vencimento'] = datetime.fromisoformat(venc['data_vencimento'])
        if venc.get('data_pagamento') and isinstance(venc['data_pagamento'], str):
            venc['data_pagamento'] = datetime.fromisoformat(venc['data_pagamento'])
    return vencimentos

@api_router.put("/vencimentos/{vencimento_id}")
async def atualizar_vencimento(vencimento_id: str, venc_data: VencimentoUpdate, current_user: dict = Depends(get_current_user)):
    update_doc = {"status": venc_data.status}
    if venc_data.data_pagamento:
        update_doc["data_pagamento"] = datetime.strptime(venc_data.data_pagamento, "%d/%m/%Y").isoformat()
    
    result = await db.vencimentos.update_one({"id": vencimento_id}, {"$set": update_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vencimento não encontrado")
    
    return {"message": "Vencimento atualizado com sucesso"}

# ============= DASHBOARD & COMISSÕES =============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Get current month range
    now = datetime.now(timezone.utc)
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Last day of current month
    if now.month == 12:
        last_day_of_month = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        last_day_of_month = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Tonelagem de pedidos implantados no mês atual (KG -> TON)
    pedidos_implantados = await db.pedidos.find({
        "status": "Implantado",
        "data_criacao": {"$gte": first_day_of_month.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    tonelagem_implantada = 0
    comissao_prevista = 0
    
    for pedido in pedidos_implantados:
        tonelagem_implantada += pedido["peso_total"] / 1000  # Convert KG to TON
        for item in pedido["itens"]:
            material = await db.materiais.find_one({"id": item["material_id"]}, {"_id": 0})
            if material:
                comissao_prevista += item["subtotal"] * (material["porcentagem_comissao"] / 100)
    
    # Tonelagem faturada (notas fiscais do mês)
    notas_mes = await db.notas_fiscais.find({
        "data_emissao": {"$gte": first_day_of_month.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    tonelagem_faturada = 0
    for nota in notas_mes:
        pedido = await db.pedidos.find_one({"id": nota["pedido_id"]}, {"_id": 0})
        if pedido:
            tonelagem_faturada += pedido["peso_total"] / 1000  # Convert KG to TON
    
    # Comissão realizada (vencimentos pagos)
    vencimentos_pagos = await db.vencimentos.find({"status": "Pago"}, {"_id": 0}).to_list(1000)
    comissao_realizada = sum(v["comissao_calculada"] for v in vencimentos_pagos)
    
    # CARD 1: Pedidos do Mês (R$) - Valor total de pedidos criados no mês
    pedidos_mes = await db.pedidos.find({
        "data_criacao": {"$gte": first_day_of_month.isoformat()}
    }, {"_id": 0}).to_list(1000)
    pedidos_mes_valor = sum(p["valor_total"] for p in pedidos_mes)
    
    # CARD 2: Faturado no Mês (R$) - Valor total de NFs emitidas no mês
    faturado_mes_valor = sum(nota["valor_total"] for nota in notas_mes)
    
    # CARD 3: Comissão do Mês (R$) - Comissões com vencimento no mês atual
    vencimentos_mes = await db.vencimentos.find({
        "data_vencimento": {
            "$gte": first_day_of_month.isoformat(),
            "$lt": last_day_of_month.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    comissao_mes = sum(v["comissao_calculada"] for v in vencimentos_mes)
    
    # CARD 4: Comissões a Receber (R$) - Total de comissões pendentes (global)
    vencimentos_pendentes = await db.vencimentos.find({
        "status": {"$in": ["Pendente", "Atrasado"]}
    }, {"_id": 0}).to_list(1000)
    comissoes_a_receber = sum(v["comissao_calculada"] for v in vencimentos_pendentes)
    
    return DashboardStats(
        tonelagem_implantada=tonelagem_implantada,
        comissao_prevista=comissao_prevista,
        tonelagem_faturada=tonelagem_faturada,
        comissao_realizada=comissao_realizada,
        pedidos_mes_valor=pedidos_mes_valor,
        faturado_mes_valor=faturado_mes_valor,
        comissao_mes=comissao_mes,
        comissoes_a_receber=comissoes_a_receber
    )

# ============= EXPORT EXCEL =============

@api_router.get("/export/pedidos")
async def export_pedidos_excel(current_user: dict = Depends(get_current_user)):
    pedidos = await db.pedidos.find({}, {"_id": 0}).to_list(1000)
    
    # Prepare data
    data = []
    for pedido in pedidos:
        cliente = await db.clientes.find_one({"id": pedido["cliente_id"]}, {"_id": 0})
        data.append({
            "OC": pedido["numero_oc"],
            "Cliente": cliente["nome"] if cliente else "",
            "Status": pedido["status"],
            "Valor Total": pedido["valor_total"],
            "Peso Total": pedido["peso_total"],
            "Data": datetime.fromisoformat(pedido["data_criacao"]).strftime("%d/%m/%Y"),
            "N° Fábrica": pedido.get("numero_pedido_fabrica", "")
        })
    
    df = pd.DataFrame(data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Pedidos', index=False)
    
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=pedidos.xlsx"}
    )

@api_router.get("/export/comissoes")
async def export_comissoes_excel(current_user: dict = Depends(get_current_user)):
    vencimentos = await db.vencimentos.find({}, {"_id": 0}).to_list(1000)
    
    data = []
    for venc in vencimentos:
        nota = await db.notas_fiscais.find_one({"id": venc["nota_fiscal_id"]}, {"_id": 0})
        if nota:
            pedido = await db.pedidos.find_one({"id": nota["pedido_id"]}, {"_id": 0})
            if pedido:
                cliente = await db.clientes.find_one({"id": pedido["cliente_id"]}, {"_id": 0})
                data.append({
                    "NF": nota["numero_nf"],
                    "Cliente": cliente["nome"] if cliente else "",
                    "Parcela": venc["parcela"],
                    "Valor Parcela": venc["valor"],
                    "Vencimento": datetime.fromisoformat(venc["data_vencimento"]).strftime("%d/%m/%Y"),
                    "Status": venc["status"],
                    "Comissão": venc["comissao_calculada"],
                    "Pagamento": datetime.fromisoformat(venc["data_pagamento"]).strftime("%d/%m/%Y") if venc.get("data_pagamento") else ""
                })
    
    df = pd.DataFrame(data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Comissões', index=False)
    
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=comissoes.xlsx"}
    )

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()