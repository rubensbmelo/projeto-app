from pymongo import MongoClient

MONGO_URI = "mongodb+srv://repflow:Repflow2026@cluster0.ckxkfut.mongodb.net/erp_database?retryWrites=true&w=majority"

client = MongoClient(MONGO_URI)
db = client["erp_database"]

# Testa inserindo um documento de teste
result = db.teste.insert_one({"teste": "conexao ok"})
print("✅ Inserido com ID:", result.inserted_id)

# Remove o documento de teste
db.teste.delete_one({"_id": result.inserted_id})
print("✅ Conexão e permissões OK! Pode rodar o importar_clientes.py")
client.close()