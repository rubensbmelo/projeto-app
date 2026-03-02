from pymongo import MongoClient

MONGO_URI = "mongodb+srv://repflow:Repflow2026@cluster0.ckxkfut.mongodb.net/erp_database?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["erp_database"]

result = db.materiais.update_many(
    {"criado_por": "importacao_inicial"},
    [{"$set": {
        "peso_unit": "$peso",
        "preco_unit": "$preco_mil",
        "descricao": "$nome",
        "codigo": "$numero_fe"
    }}]
)

print(f"Corrigidos: {result.modified_count} materiais")
client.close()