from fastapi import FastAPI
from pydantic import BaseModel
import spacy

from logic_parser import LogicParser

app = FastAPI(title="Pé no Chão NLP Engine")

# Load model at startup
nlp = spacy.load("pt_core_news_lg")
parser = LogicParser(nlp)

class AnalysisRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "NLP Engine is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/analyze")
def analyze_text(request: AnalysisRequest):
    result = parser.analyze(request.text)
    return result
