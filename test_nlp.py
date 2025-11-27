import requests
import json
import time

API_URL = "http://localhost:5000/analyze"

samples = [
    "Desemprego aumentou 5%. Logo, a economia vai colapsar.",
    "Se vacina causa autismo, então não devemos vacinar.",
    "Todos políticos são corruptos. João é político. Logo João é corrupto.",
    "O sol brilha. Logo é dia."
]

def test_api():
    print(f"Testing NLP API at {API_URL}...")
    
    for i, text in enumerate(samples):
        print(f"\n--- Test Case {i+1} ---")
        print(f"Input: {text}")
        
        try:
            response = requests.post(API_URL, json={"text": text})
            if response.status_code == 200:
                result = response.json()
                print("Status: SUCCESS")
                print(f"Structure: {result.get('logical_structure')}")
                print("Premises:")
                for p in result.get('premises', []):
                    print(f"  - {p['text']}")
                print("Conclusion:")
                if result.get('conclusion'):
                    print(f"  - {result['conclusion']['text']}")
                else:
                    print("  - None detected")
            else:
                print(f"Status: FAILED ({response.status_code})")
                print(response.text)
        except Exception as e:
            print(f"Error: {e}")
            print("Make sure the NLP service is running (docker-compose up).")

if __name__ == "__main__":
    test_api()
