"""
RepFlow — Script de Importação de Clientes
==========================================
Uso: python importar_clientes.py
"""

import openpyxl
from pymongo import MongoClient
from datetime import datetime, timezone
import uuid

# ── Configuração ─────────────────────────────────────────
MONGO_URI = "mongodb+srv://repflow:Repflow2026@cluster0.ckxkfut.mongodb.net/erp_database?retryWrites=true&w=majority"
DB_NAME   = "erp_database"
ARQUIVO   = "dados_clientes.xlsx"

# ── Conexão ───────────────────────────────────────────────
print("🔌 Conectando ao MongoDB...")
client = MongoClient(MONGO_URI)
db     = client[DB_NAME]

# ── Leitura do Excel ──────────────────────────────────────
print(f"📂 Lendo arquivo {ARQUIVO}...")
wb = openpyxl.load_workbook(ARQUIVO)
ws = wb.active

importados  = 0
ignorados   = 0
duplicados  = 0

print("\n📋 Iniciando importação...\n")

for row in ws.iter_rows(min_row=2, values_only=True):
    nome_fantasia = row[0]
    razao_social  = row[1]
    cnpj          = row[2]
    comprador     = row[3]
    cidade        = row[4]
    estado        = row[5]

    if not razao_social and not cnpj:
        ignorados += 1
        continue

    if cnpj and db.clientes.find_one({"cnpj": str(cnpj).strip()}):
        print(f"  ⚠️  Duplicado — {razao_social} ({cnpj})")
        duplicados += 1
        continue

    doc = {
        "id":             str(uuid.uuid4()),
        "nome_fantasia":  str(nome_fantasia).strip()  if nome_fantasia else "",
        "razao_social":   str(razao_social).strip()   if razao_social  else "",
        "cnpj":           str(cnpj).strip()           if cnpj          else "",
        "comprador":      str(comprador).strip()      if comprador     else "",
        "cidade":         str(cidade).strip()         if cidade        else "",
        "uf":             str(estado).strip()         if estado        else "",
        "email":          "",
        "telefone":       "",
        "endereco":       "",
        "criado_em":      datetime.now(timezone.utc).isoformat(),
        "criado_por":     "importacao_inicial",
    }

    db.clientes.insert_one(doc)
    print(f"  ✅ {doc['nome_fantasia'] or doc['razao_social']} — {doc['cidade']}/{doc['uf']}")
    importados += 1

print(f"""
══════════════════════════════════
  ✅ Importados:  {importados}
  ⚠️  Duplicados:  {duplicados}
  ⬜ Ignorados:   {ignorados}
══════════════════════════════════
Importação concluída!
""")

client.close()