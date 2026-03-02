import openpyxl
from pymongo import MongoClient
from datetime import datetime, timezone
import uuid

MONGO_URI = "mongodb+srv://repflow:Repflow2026@cluster0.ckxkfut.mongodb.net/erp_database?retryWrites=true&w=majority"
DB_NAME   = "erp_database"
ARQUIVO   = "cadastro_produtos.xlsx"

print("Conectando ao MongoDB...")
client = MongoClient(MONGO_URI)
db     = client[DB_NAME]

print(f"Lendo arquivo {ARQUIVO}...")
wb = openpyxl.load_workbook(ARQUIVO)
ws = wb.active

importados = 0
ignorados  = 0
duplicados = 0

print("\nIniciando importacao...\n")

for row in ws.iter_rows(min_row=2, values_only=True):
    codigo    = row[3]
    nome      = row[4]
    peso      = row[5]
    preco_mil = row[6]

    if not codigo and not nome:
        ignorados += 1
        continue

    codigo = str(codigo).strip() if codigo else ""
    nome   = str(nome).strip()   if nome   else ""

    if codigo and db.materiais.find_one({"numero_fe": codigo}):
        print(f"  Duplicado: {codigo} ({nome})")
        duplicados += 1
        continue

    sufixo = codigo.split('-')[-1].strip().upper() if '-' in codigo else ''

    if sufixo == 'CH':
        segmento = "Chapa"
        comissao = 2.0
    else:
        segmento = "Caixa"
        comissao = 3.0

    doc = {
        "id":         str(uuid.uuid4()),
        "numero_fe":  codigo,
        "nome":       nome,
        "segmento":   segmento,
        "peso":       float(peso)      if peso      else 0.0,
        "preco_mil":  float(preco_mil) if preco_mil else 0.0,
        "comissao":   comissao,
        "unidade":    "CX" if segmento == "Caixa" else "CH",
        "criado_em":  datetime.now(timezone.utc).isoformat(),
        "criado_por": "importacao_inicial",
    }

    db.materiais.insert_one(doc)
    print(f"  OK: {codigo} -- {nome} [{segmento} {comissao}%]")
    importados += 1

print(f"\n  Importados:  {importados}")
print(f"  Duplicados:  {duplicados}")
print(f"  Ignorados:   {ignorados}")
print("Importacao concluida!")
client.close()