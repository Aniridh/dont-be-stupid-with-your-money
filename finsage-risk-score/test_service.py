#!/usr/bin/env python3
"""
Test script for FinSage Risk Scoring Service
"""

import requests
import json
import time

def test_risk_scoring():
    """Test the risk scoring endpoint"""
    
    # Test data
    test_cases = [
        {
            "ticker": "AAPL",
            "rsi": 65.5,
            "pe": 25.2,
            "peg": 1.1,
            "sentiment": 0.3,
            "atr": 2.5
        },
        {
            "ticker": "MSFT",
            "rsi": 45.0,
            "pe": 18.5,
            "peg": 0.9,
            "sentiment": -0.2,
            "atr": 1.8
        },
        {
            "ticker": "NVDA",
            "rsi": 80.0,
            "pe": 45.0,
            "peg": 2.5,
            "sentiment": 0.8,
            "atr": 5.2
        }
    ]
    
    base_url = "http://localhost:8080"
    
    print("🧪 Testing FinSage Risk Scoring Service")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📊 Test Case {i}: {test_case['ticker']}")
        print(f"Input: {json.dumps(test_case, indent=2)}")
        
        try:
            response = requests.post(f"{base_url}/score", json=test_case)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Response: {json.dumps(result, indent=2)}")
                
                # Validate response structure
                required_fields = ["ticker", "risk_score", "timestamp", "latency_ms", "model_version"]
                if all(field in result for field in required_fields):
                    print("✅ Response structure valid")
                else:
                    print("❌ Response structure invalid")
                    
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection failed - is the service running?")
            print("Run: python app.py")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Testing complete")

if __name__ == "__main__":
    test_risk_scoring()
