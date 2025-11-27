import spacy
from typing import List, Dict, Any, Optional

class LogicParser:
    def __init__(self, nlp):
        self.nlp = nlp
        # Keywords that usually introduce a conclusion
        self.conclusion_indicators = [
            "logo", "portanto", "assim", "consequentemente", "então", "por isso", "dessa forma"
        ]
        # Keywords that usually introduce a premise (explanation)
        self.premise_indicators = [
            "pois", "porque", "visto que", "dado que", "já que", "uma vez que"
        ]

    def analyze(self, text: str) -> Dict[str, Any]:
        doc = self.nlp(text)
        sentences = [sent for sent in doc.sents]
        
        premises = []
        conclusion = None
        logical_connectors = []
        structure_type = "unknown"

        # 1. Identify connectors and split flow
        for i, sent in enumerate(sentences):
            sent_text = sent.text.strip()
            sent_lower = sent_text.lower()
            
            # Check for conclusion indicators at the start of the sentence
            is_conclusion = False
            for indicator in self.conclusion_indicators:
                if sent_lower.startswith(indicator) or f" {indicator} " in f" {sent_lower} ":
                    is_conclusion = True
                    logical_connectors.append(indicator)
                    break
            
            if is_conclusion:
                # If we found a conclusion, this sentence is likely the conclusion
                # and previous ones were premises
                conclusion = {
                    "text": sent_text,
                    "confidence": 0.85,
                    "type": "derived",
                    "sentence_id": i
                }
                # Add all previous sentences as premises if not already added
                for j in range(i):
                    if not any(p['sentence_id'] == j for p in premises):
                        premises.append({
                            "text": sentences[j].text.strip(),
                            "confidence": 0.9,
                            "type": "factual",
                            "sentence_id": j
                        })
                structure_type = "deductive"
            else:
                # Check for premise indicators (explanation flow: Conclusion because Premise)
                # This is harder to split without dependency parsing, but let's try simple split
                is_explanation = False
                for indicator in self.premise_indicators:
                    if f" {indicator} " in sent_lower:
                        is_explanation = True
                        logical_connectors.append(indicator)
                        # Split sentence? For now, treat whole sentence as premise if it's not the conclusion
                        break
                
                if not conclusion:
                    premises.append({
                        "text": sent_text,
                        "confidence": 0.9,
                        "type": "factual",
                        "sentence_id": i
                    })

        # Fallback: If no conclusion identified explicitly, assume the last sentence is the conclusion
        # and others are premises (common structure)
        if conclusion is None and len(sentences) > 0:
            conclusion = {
                "text": sentences[-1].text.strip(),
                "confidence": 0.6, # Lower confidence
                "type": "projection",
                "sentence_id": len(sentences) - 1
            }
            # Remove last sentence from premises if it was added
            premises = [p for p in premises if p['sentence_id'] != len(sentences) - 1]
            structure_type = "implicit_deduction"

        return {
            "raw_input": text,
            "premises": premises,
            "conclusion": conclusion,
            "logical_structure": structure_type,
            "logical_connectors": list(set(logical_connectors)),
            "structure_explanation": f"Detected {structure_type} structure based on connectors: {', '.join(logical_connectors)}" if logical_connectors else "Implicit structure inferred"
        }
