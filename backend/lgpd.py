# ============================================================
# lgpd.py — Soft Delete + Auditoria LGPD para o RepFlow
#
# COMO USAR:
#   1. Copie este arquivo para a pasta backend/
#   2. No seu main.py, adicione no topo:
#        from lgpd import registrar_auditoria, soft_delete, listar_auditoria, router_lgpd
#        app.include_router(router_lgpd)
#   3. No startup(), adicione:
#        await db.auditoria.create_index("colecao")
#        await db.auditoria.create_index("usuario_email")
#        await db.auditoria.create_index("criado_em")
#   4. Substitua os DELETE hard pelos wrappers de soft_delete (exemplos abaixo)
# ============================================================

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# ============================================================
# 1. FUNÇÃO PRINCIPAL — registrar_auditoria
#    Chame isso em QUALQUER ação importante (create, update, delete)
# ============================================================

async def registrar_auditoria(
    db: AsyncIOMotorDatabase,
    *,
    acao: str,               # "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT"
    colecao: str,            # "clientes" | "pedidos" | "materiais" | etc.
    documento_id: str,       # ID do documento afetado
    usuario_email: str,      # email de quem fez a ação
    usuario_role: str,       # "admin" | "vendedor"
    dados_antes: Optional[dict] = None,   # snapshot antes da mudança
    dados_depois: Optional[dict] = None,  # snapshot depois da mudança
    detalhes: Optional[str] = None,       # observação livre
):
    """
    Registra qualquer ação no log de auditoria.
    Salvo na collection 'auditoria' do MongoDB.
    Imutável — nunca deletamos registros de auditoria (LGPD Art. 37).
    """
    # Remove campos sensíveis antes de salvar snapshot
    for campo_sensivel in ["senha_hash", "password", "token"]:
        if dados_antes:
            dados_antes.pop(campo_sensivel, None)
        if dados_depois:
            dados_depois.pop(campo_sensivel, None)

    registro = {
        "acao": acao,
        "colecao": colecao,
        "documento_id": str(documento_id),
        "usuario_email": usuario_email,
        "usuario_role": usuario_role,
        "dados_antes": dados_antes,
        "dados_depois": dados_depois,
        "detalhes": detalhes,
        "criado_em": datetime.now(timezone.utc).isoformat(),
    }

    await db.auditoria.insert_one(registro)
    logger.info(f"📋 Auditoria: {usuario_email} → {acao} em {colecao}/{documento_id}")


# ============================================================
# 2. SOFT DELETE — substitui o DELETE permanente
#    Em vez de apagar, marca o documento com deletado=True
# ============================================================

async def soft_delete(
    db: AsyncIOMotorDatabase,
    *,
    colecao: str,
    documento_id: str,
    usuario_email: str,
    usuario_role: str,
    motivo: Optional[str] = None,
):
    """
    Realiza soft delete: marca o documento como deletado
    sem removê-lo fisicamente do banco.

    Para LGPD: dados ficam retidos pelo prazo legal (5 anos)
    mas são invisíveis para os usuários normais.
    """
    oid = ObjectId(documento_id)

    # Busca o documento atual para snapshot
    doc_atual = await db[colecao].find_one({"_id": oid})
    if not doc_atual:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    if doc_atual.get("deletado"):
        raise HTTPException(status_code=400, detail="Documento já foi deletado")

    # Marca como deletado — NÃO remove do banco
    await db[colecao].update_one(
        {"_id": oid},
        {"$set": {
            "deletado": True,
            "deletado_em": datetime.now(timezone.utc).isoformat(),
            "deletado_por": usuario_email,
            "motivo_delecao": motivo or "Não informado",
        }}
    )

    # Registra na auditoria
    doc_serializado = {k: str(v) if isinstance(v, ObjectId) else v for k, v in doc_atual.items()}
    await registrar_auditoria(
        db,
        acao="DELETE",
        colecao=colecao,
        documento_id=documento_id,
        usuario_email=usuario_email,
        usuario_role=usuario_role,
        dados_antes=doc_serializado,
        detalhes=f"Soft delete — motivo: {motivo or 'Não informado'}",
    )

    logger.info(f"🗑️  Soft delete: {colecao}/{documento_id} por {usuario_email}")
    return {"message": f"Registro deletado com segurança. Retido por 5 anos conforme LGPD."}


# ============================================================
# 3. FILTRO PADRÃO — exclui deletados das listagens
#    Use em todos os find() para esconder registros deletados
# ============================================================

FILTRO_ATIVO = {"$or": [{"deletado": {"$exists": False}}, {"deletado": False}]}

# Exemplo de uso no seu main.py:
#
#   # ANTES:
#   clientes = await db.clientes.find().to_list(length=500)
#
#   # DEPOIS (com soft delete):
#   from lgpd import FILTRO_ATIVO
#   clientes = await db.clientes.find(FILTRO_ATIVO).to_list(length=500)


# ============================================================
# 4. ROUTER LGPD — endpoints de auditoria e conformidade
# ============================================================

router_lgpd = APIRouter(prefix="/api/lgpd", tags=["LGPD"])


# 4.1 Listar log de auditoria (somente admin)
@router_lgpd.get("/auditoria")
async def listar_auditoria(
    colecao: Optional[str] = None,
    usuario_email: Optional[str] = None,
    acao: Optional[str] = None,
    limite: int = 100,
    # Injetado via Depends no main.py — veja instrução abaixo
):
    """
    Retorna o log de auditoria com filtros opcionais.

    NOTA: Para proteger com autenticação, no main.py use:
        @app.get("/api/lgpd/auditoria")
        async def auditoria(admin=Depends(apenas_admin)):
            ...
    e remova este endpoint do router.
    """
    filtro = {}
    if colecao:
        filtro["colecao"] = colecao
    if usuario_email:
        filtro["usuario_email"] = usuario_email
    if acao:
        filtro["acao"] = acao.upper()

    registros = await db_global.auditoria.find(filtro).sort(
        "criado_em", -1
    ).to_list(length=limite)

    return [
        {**{k: str(v) if isinstance(v, ObjectId) else v for k, v in r.items()}}
        for r in registros
    ]


# 4.2 Relatório de titulares (LGPD Art. 18)
@router_lgpd.get("/titular/{cnpj}")
async def relatorio_titular(cnpj: str):
    """
    Retorna todos os dados de um titular (cliente) armazenados no sistema.
    Exigido pela LGPD Art. 18 — direito de acesso do titular.
    """
    cliente = await db_global.clientes.find_one({"cnpj": cnpj})
    if not cliente:
        raise HTTPException(status_code=404, detail="Titular não encontrado")

    cliente_id = str(cliente["_id"])

    pedidos = await db_global.pedidos.find(
        {"cliente_id": cliente_id}
    ).to_list(length=1000)

    orcamentos = await db_global.orcamentos.find(
        {"cliente_id": cliente_id}
    ).to_list(length=1000)

    notas = await db_global.notas_fiscais.find(
        {"cliente_id": cliente_id}
    ).to_list(length=1000)

    def limpa(docs):
        return [
            {k: str(v) if isinstance(v, ObjectId) else v for k, v in d.items()}
            for d in docs
        ]

    return {
        "titular": {k: str(v) if isinstance(v, ObjectId) else v for k, v in cliente.items()},
        "pedidos": limpa(pedidos),
        "orcamentos": limpa(orcamentos),
        "notas_fiscais": limpa(notas),
        "total_registros": len(pedidos) + len(orcamentos) + len(notas),
        "gerado_em": datetime.now(timezone.utc).isoformat(),
    }


# 4.3 Anonimizar titular (LGPD Art. 18 — direito ao esquecimento)
@router_lgpd.post("/titular/{cnpj}/anonimizar")
async def anonimizar_titular(cnpj: str):
    """
    Anonimiza dados pessoais de um titular.
    NÃO apaga pedidos/financeiro (obrigação fiscal 5 anos),
    apenas substitui dados pessoais por tokens anônimos.
    Exigido pela LGPD Art. 18 — direito ao esquecimento.
    """
    cliente = await db_global.clientes.find_one({"cnpj": cnpj})
    if not cliente:
        raise HTTPException(status_code=404, detail="Titular não encontrado")

    token = f"ANONIMIZADO-{cnpj[-4:]}"

    await db_global.clientes.update_one(
        {"cnpj": cnpj},
        {"$set": {
            "nome": token,
            "email": f"{token}@removido.lgpd",
            "telefone": "REMOVIDO",
            "comprador": "REMOVIDO",
            "endereco": "REMOVIDO",
            "anonimizado": True,
            "anonimizado_em": datetime.now(timezone.utc).isoformat(),
        }}
    )

    return {
        "message": f"Dados pessoais anonimizados com sucesso.",
        "cnpj": cnpj,
        "nota": "Dados financeiros (pedidos, NFs) mantidos por obrigação fiscal (5 anos).",
    }


# ============================================================
# 5. db_global — referência ao banco (preenchida no main.py)
# ============================================================
# No seu main.py, após definir `db`, adicione:
#
#   import lgpd
#   lgpd.db_global = db
#
db_global = None  # será preenchido pelo main.py


# ============================================================
# 6. EXEMPLOS — como adaptar seus endpoints existentes
# ============================================================

"""
=== EXEMPLO 1: Deletar cliente com soft delete + auditoria ===

# ANTES (no seu main.py):
@app.delete("/api/clientes/{cliente_id}")
async def deletar_cliente(cliente_id: str, admin=Depends(apenas_admin)):
    result = await db.clientes.delete_one({"_id": to_object_id(cliente_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente removido!"}

# DEPOIS:
from lgpd import soft_delete, registrar_auditoria

@app.delete("/api/clientes/{cliente_id}")
async def deletar_cliente(cliente_id: str, motivo: str = "", admin=Depends(apenas_admin)):
    return await soft_delete(
        db,
        colecao="clientes",
        documento_id=cliente_id,
        usuario_email=admin["email"],
        usuario_role=admin["role"],
        motivo=motivo,
    )


=== EXEMPLO 2: Criar pedido com auditoria ===

# DEPOIS de criar o pedido, adicione:
await registrar_auditoria(
    db,
    acao="CREATE",
    colecao="pedidos",
    documento_id=str(result.inserted_id),
    usuario_email=usuario["email"],
    usuario_role=usuario["role"],
    dados_depois=doc,
    detalhes=f"Pedido {doc['numero_oc']} criado para {doc['cliente_nome']}",
)


=== EXEMPLO 3: Atualizar material com snapshot antes/depois ===

@app.put("/api/materiais/{material_id}")
async def atualizar_material(material_id: str, material: MaterialSchema, usuario=Depends(verificar_token)):
    # Busca estado anterior para auditoria
    antes = await db.materiais.find_one({"_id": to_object_id(material_id)})
    antes_serial = {k: str(v) if isinstance(v, ObjectId) else v for k, v in (antes or {}).items()}

    doc = material.dict()
    doc["atualizado_em"] = datetime.now(timezone.utc).isoformat()
    doc["atualizado_por"] = usuario["email"]
    result = await db.materiais.update_one(
        {"_id": to_object_id(material_id)},
        {"$set": doc}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    # Auditoria com snapshot antes e depois
    await registrar_auditoria(
        db,
        acao="UPDATE",
        colecao="materiais",
        documento_id=material_id,
        usuario_email=usuario["email"],
        usuario_role=usuario["role"],
        dados_antes=antes_serial,
        dados_depois=doc,
        detalhes=f"Material {doc.get('numero_fe', '')} atualizado",
    )
    return {"message": "Material atualizado!"}


=== EXEMPLO 4: Listar clientes excluindo deletados ===

from lgpd import FILTRO_ATIVO

@app.get("/api/clientes")
async def listar_clientes(usuario=Depends(verificar_token)):
    clientes = await db.clientes.find(FILTRO_ATIVO).to_list(length=500)
    return [serialize(c) for c in clientes]


=== EXEMPLO 5: Startup com índices de auditoria ===

@app.on_event("startup")
async def startup():
    # ... seus índices existentes ...

    # Índices de auditoria LGPD
    await db.auditoria.create_index("colecao")
    await db.auditoria.create_index("usuario_email")
    await db.auditoria.create_index("criado_em")
    await db.auditoria.create_index([("colecao", 1), ("documento_id", 1)])

    # Inicializa referência do banco no módulo LGPD
    import lgpd
    lgpd.db_global = db
"""
