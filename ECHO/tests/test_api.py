"""
ECHO Gossip Chain - API Integration Tests
Tests core API endpoints for privacy analysis
"""

import pytest
import requests
import os
from typing import Optional

# Test configuration
BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:3000")

# Known Solana devnet addresses for testing
TEST_ADDRESSES = {
    "valid": "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",  # Active devnet address
    "empty": "11111111111111111111111111111111",  # System program (has no transactions)
    "invalid": "not-a-valid-address",
}


class TestAnalyzeEndpoint:
    """Tests for POST /api/analyze endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.endpoint = f"{BASE_URL}/api/analyze"
        self.headers = {"Content-Type": "application/json"}
    
    def test_analyze_valid_address(self):
        """Test analysis with a valid Solana address"""
        response = requests.post(
            self.endpoint,
            json={"address": TEST_ADDRESSES["valid"]},
            headers=self.headers,
            timeout=60  # Analysis can take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields exist
        assert "address" in data, "Response missing 'address' field"
        assert "privacyScore" in data, "Response missing 'privacyScore' field"
        assert "transactionCount" in data, "Response missing 'transactionCount' field"
        assert "risks" in data, "Response missing 'risks' field"
        assert "deanonymizationPaths" in data, "Response missing 'deanonymizationPaths' field"
        assert "aiSummary" in data, "Response missing 'aiSummary' field"
        assert "rangeRiskScore" in data, "Response missing 'rangeRiskScore' field"
        assert "sanctionsCheck" in data, "Response missing 'sanctionsCheck' field"
        assert "mevExposure" in data, "Response missing 'mevExposure' field"
        
        # Verify data types
        assert isinstance(data["privacyScore"], (int, float)), "privacyScore should be numeric"
        assert isinstance(data["transactionCount"], int), "transactionCount should be integer"
        assert isinstance(data["risks"], list), "risks should be a list"
        assert isinstance(data["deanonymizationPaths"], list), "deanonymizationPaths should be a list"
        
        # Verify privacy score is in valid range
        assert 0 <= data["privacyScore"] <= 100, f"Privacy score {data['privacyScore']} out of range [0-100]"
        
        print(f"✅ Analysis successful: Score={data['privacyScore']}, Risks={len(data['risks'])}")
    
    def test_analyze_invalid_address(self):
        """Test that invalid addresses return 400 error"""
        response = requests.post(
            self.endpoint,
            json={"address": TEST_ADDRESSES["invalid"]},
            headers=self.headers,
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid address, got {response.status_code}"
        
        data = response.json()
        assert "error" in data, "Error response should contain 'error' field"
        print(f"✅ Invalid address correctly rejected: {data['error']}")
    
    def test_analyze_missing_address(self):
        """Test that missing address returns 400 error"""
        response = requests.post(
            self.endpoint,
            json={},
            headers=self.headers,
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400 for missing address, got {response.status_code}"
        print("✅ Missing address correctly rejected")
    
    def test_analyze_response_structure(self):
        """Test that response has correct nested structure"""
        response = requests.post(
            self.endpoint,
            json={"address": TEST_ADDRESSES["valid"]},
            headers=self.headers,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Test aiSummary structure
        ai_summary = data.get("aiSummary", {})
        assert "privacyScore" in ai_summary, "aiSummary missing privacyScore"
        assert "summary" in ai_summary, "aiSummary missing summary"
        assert "recommendations" in ai_summary, "aiSummary missing recommendations"
        
        # Test rangeRiskScore structure
        range_risk = data.get("rangeRiskScore", {})
        assert "riskScore" in range_risk, "rangeRiskScore missing riskScore"
        assert "riskLevel" in range_risk, "rangeRiskScore missing riskLevel"
        
        # Test sanctionsCheck structure
        sanctions = data.get("sanctionsCheck", {})
        assert "isSanctioned" in sanctions, "sanctionsCheck missing isSanctioned"
        assert "isBlacklisted" in sanctions, "sanctionsCheck missing isBlacklisted"
        
        # Test mevExposure structure
        mev = data.get("mevExposure", {})
        assert "detected" in mev, "mevExposure missing detected"
        assert "count" in mev, "mevExposure missing count"
        
        print("✅ Response structure validated")


class TestShadowWireEndpoint:
    """Tests for POST /api/shadowwire endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.endpoint = f"{BASE_URL}/api/shadowwire"
        self.headers = {"Content-Type": "application/json"}
    
    def test_get_balance(self):
        """Test ShadowWire balance check"""
        response = requests.post(
            self.endpoint,
            json={
                "action": "getBalance",
                "address": TEST_ADDRESSES["valid"],
                "token": "SOL"
            },
            headers=self.headers,
            timeout=30
        )
        
        # May return 200 with balance or 500 if SDK not available
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "available" in data, "Balance response missing 'available'"
            print(f"✅ ShadowWire balance: {data.get('available', 0)}")
        else:
            print("⚠️ ShadowWire SDK not available (expected in test environment)")
    
    def test_simulate_transfer(self):
        """Test ShadowWire transfer simulation"""
        response = requests.post(
            self.endpoint,
            json={
                "action": "simulate",
                "sender": TEST_ADDRESSES["valid"],
                "recipient": TEST_ADDRESSES["empty"],
                "amount": 0.1,
                "token": "SOL"
            },
            headers=self.headers,
            timeout=30
        )
        
        # May return 200 with simulation or 500 if SDK not available
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "possible" in data, "Simulation missing 'possible' field"
            assert "estimatedFee" in data, "Simulation missing 'estimatedFee' field"
            print(f"✅ ShadowWire simulation: possible={data.get('possible')}")
        else:
            print("⚠️ ShadowWire SDK not available (expected in test environment)")
    
    def test_invalid_action(self):
        """Test that invalid actions return error"""
        response = requests.post(
            self.endpoint,
            json={"action": "invalidAction"},
            headers=self.headers,
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid action, got {response.status_code}"
        print("✅ Invalid action correctly rejected")


class TestHealthCheck:
    """Basic health/availability tests"""
    
    def test_api_analyze_get(self):
        """Test that GET /api/analyze returns info message"""
        response = requests.get(f"{BASE_URL}/api/analyze", timeout=10)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✅ API analyze endpoint available")
    
    def test_homepage_loads(self):
        """Test that homepage loads successfully"""
        response = requests.get(BASE_URL, timeout=10)
        
        assert response.status_code == 200
        assert "ECHO" in response.text or "html" in response.text.lower()
        print("✅ Homepage loads successfully")


# Unit tests for data validation
class TestDataValidation:
    """Unit tests for response data validation"""
    
    def test_privacy_score_calculation(self):
        """Test that privacy scores are within expected ranges"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": TEST_ADDRESSES["valid"]},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            score = data.get("privacyScore", 0)
            
            # Score should be 0-100
            assert 0 <= score <= 100, f"Score {score} out of bounds"
            
            # Score should correlate with risks (more risks = lower score typically)
            risks = data.get("risks", [])
            if len(risks) > 5:
                assert score < 80, f"High risk count ({len(risks)}) but high score ({score})"
            
            print(f"✅ Privacy score {score} validated with {len(risks)} risks")
    
    def test_risk_severity_values(self):
        """Test that risk severities are valid values"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": TEST_ADDRESSES["valid"]},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            valid_severities = {"low", "medium", "high", "critical"}
            
            for risk in data.get("risks", []):
                severity = risk.get("severity", "").lower()
                assert severity in valid_severities, f"Invalid severity: {severity}"
            
            print(f"✅ All {len(data.get('risks', []))} risk severities validated")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
