# 🚀 Sistema de Gestão de Vendas 2026 (SAP-Style)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

Este é um ecossistema ERP simplificado projetado com a estética corporativa "SAP-Style". O sistema permite o controle de clientes, materiais e uma gestão robusta de pedidos com níveis de acesso diferenciados.

## 🏗️ Estrutura do Projeto

- **/frontend**: Aplicação React.js utilizando Tailwind CSS e Shadcn/UI.
- **/backend**: API REST de alta performance desenvolvida em Python com FastAPI.

## ✨ Funcionalidades Principais

* **Dashboard**: Visão geral dos indicadores de venda e peso total.
* **Gestão de Clientes**: Cadastro, listagem e edição de parceiros comerciais.
* **Controle de Pedidos**: Fluxo dinâmico com cálculo de peso em tempo real.
* **Segurança RBAC**: Diferenciação entre usuários Administradores e Visualizadores.
* **Trava Contábil**: Bloqueio de edição para pedidos com Nota Fiscal (NF) emitida.

## 🛠️ Tecnologias Utilizadas

### Frontend
* **React.js**: Biblioteca principal para a interface.
* **Lucide Icons**: Conjunto de ícones vetoriais.
* **Tailwind CSS**: Estilização baseada em utilitários para o design SAP.
* **Axios**: Cliente HTTP para comunicação com o backend.
* **Sonner**: Gerenciamento de notificações (Toasts).

### Backend
* **Python 3.10+**: Linguagem base do servidor.
* **FastAPI**: Framework web moderno e veloz.
* **Pydantic**: Validação de dados e tipagem rigorosa.
* **Uvicorn**: Servidor ASGI para execução da API.

---

## 🚀 Como Executar o Projeto

### 1. Configurando o Backend (FastAPI)
```bash
cd backend
# Criar e ativar ambiente virtual
python -m venv venv
.\venv\Scripts\activate # Windows
source venv/bin/activate # Linux/Mac

# Instalar dependências
pip install fastapi uvicorn pydantic

# Iniciar o servidor
uvicorn main:app --reload --port 8000# Here are your Instructions

2. Configurando o Frontend (React)
Bash
cd frontend
# Instalar dependências
npm install

# Iniciar a aplicação
npm start

🔒 Variáveis de Ambiente
No diretório frontend, crie um arquivo .env com a seguinte configuração:
REACT_APP_BACKEND_URL=http://127.0.0.1:8000

🧠 Arquitetura Visual do Sistema
Plaintext
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|  Frontend (React) | <---> |  Backend (Python) | <---> |    Banco de Dados |
|                   |       |    (FastAPI)      |       |      (SQLite)     |
|                   |       |                   |       |                   |
+-------------------+       +-------------------+       +-------------------+
       ^     |                     ^     |
       |     v                     |     v
       |   Navegação (Router)      |   Validação (Pydantic)
       |                           |
       +---------------------------+
             Interface do Usuário


🙏 Agradecimentos e IA
Este sistema foi desenvolvido com o auxílio estratégico de Inteligência Artificial. A IA foi utilizada para:

Esclarecimento de dúvidas técnicas e lógica de programação.

Sugestões de arquitetura e otimização de performance.

Refinamento da interface visual (SAP-Style).

Geração de documentação e automação de testes.

Esta colaboração permitiu um desenvolvimento ágil, focado em boas práticas de engenharia de software e segurança de dados.

© 2026 - Desenvolvido por Rubens Melo
