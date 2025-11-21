# Auto-Job-Hunter

A comprehensive automated job hunting system powered by AI agents.

## Documentation

- **[Documentation Overview](./DOCUMENTATION.md)**: Detailed guide on the system architecture, schema, and workflows.
- **[Folder Structure](./FOLDER_STRUCTURE.md)**: Explanation of the project's directory layout and rules.
- **[System Architecture](./SYSTEM_ARCHITECTURE.md)**: High-level architecture diagram and component breakdown.
- **[LangGraph Design](./LANGGRAPH_DESIGN.md)**: Design of the AI agent workflows.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
