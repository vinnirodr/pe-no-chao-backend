# Pé no Chão - Verificação Lógica de Informações

Ferramenta web acessível que combate desinformação no Brasil através de análise lógica matemática e fact-checking automático.

## Estrutura do Projeto

- **frontend/**: React + Vite + Tailwind (Port 3000)
- **backend/**: Node.js + Express (Port 3001)
- **nlp/**: Python + FastAPI + spaCy (Port 5000)
- **postgres**: Banco de dados (Port 5432)
- **redis**: Cache e Fila (Port 6379)

## Pré-requisitos

- Docker e Docker Compose instalados.

## Como Rodar

1. Clone o repositório.
2. Na raiz do projeto, execute:

```bash
docker-compose up --build
```

3. Acesse:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - NLP API: http://localhost:5000/docs

## Desenvolvimento

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### NLP
```bash
cd nlp
pip install -r requirements.txt
python -m spacy download pt_core_news_lg
uvicorn app:app --reload
```
