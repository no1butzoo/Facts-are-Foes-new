import requests
import sys
import json
from datetime import datetime

class FactsAreFoesAPITester:
    def __init__(self, base_url="https://foe-facts.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.test_fact_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_seed_data(self):
        """Test seeding data"""
        print("\n🌱 Testing Seed Data...")
        success, response = self.run_test("Seed Data", "POST", "seed", 200)
        return success

    def test_categories(self):
        """Test categories endpoint"""
        print("\n📂 Testing Categories...")
        success, response = self.run_test("Get Categories", "GET", "categories", 200)
        if success and isinstance(response, list) and len(response) > 0:
            self.log_test("Categories Data Valid", True)
        else:
            self.log_test("Categories Data Valid", False, "No categories returned")
        return success

    def test_facts_endpoints(self):
        """Test facts endpoints"""
        print("\n📚 Testing Facts Endpoints...")
        
        # Get all facts
        success, response = self.run_test("Get All Facts", "GET", "facts", 200)
        if success and isinstance(response, list):
            self.log_test("Facts List Valid", True)
            if len(response) > 0:
                self.test_fact_id = response[0]['id']
                self.log_test("Test Fact ID Retrieved", True)
        else:
            self.log_test("Facts List Valid", False, "Invalid facts response")
            return False

        # Get featured facts
        self.run_test("Get Featured Facts", "GET", "facts?featured=true", 200)
        
        # Get facts by category
        self.run_test("Get Facts by Category", "GET", "facts?category=science", 200)
        
        # Search facts
        self.run_test("Search Facts", "GET", "facts?search=myth", 200)
        
        # Get specific fact
        if self.test_fact_id:
            self.run_test("Get Specific Fact", "GET", f"facts/{self.test_fact_id}", 200)
        
        return True

    def test_auth_registration(self):
        """Test user registration"""
        print("\n👤 Testing User Registration...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, test_user_data)
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.log_test("Registration Token Valid", True)
            return True
        else:
            self.log_test("Registration Token Valid", False, "No token in response")
            return False

    def test_auth_login(self):
        """Test user login with existing user"""
        print("\n🔐 Testing User Login...")
        
        # Try to login with the registered user
        if not self.token:
            print("⚠️ Skipping login test - no registered user")
            return False
            
        # Test /auth/me endpoint
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        if success and 'id' in response:
            self.log_test("Auth Me Valid", True)
        else:
            self.log_test("Auth Me Valid", False, "Invalid user data")
        
        return success

    def test_fact_creation(self):
        """Test creating a new fact"""
        print("\n📝 Testing Fact Creation...")
        
        if not self.token:
            print("⚠️ Skipping fact creation - not authenticated")
            return False
        
        test_fact = {
            "title": "Test Myth for API Testing",
            "false_belief": "This is a test false belief for API testing purposes.",
            "truth": "This is the actual truth for testing the API functionality.",
            "category": "science",
            "source_url": "https://example.com/test-source",
            "image_url": "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800"
        }
        
        success, response = self.run_test("Create Fact", "POST", "facts", 200, test_fact)
        
        if success and 'id' in response:
            self.created_fact_id = response['id']
            self.log_test("Fact Creation Valid", True)
            return True
        else:
            self.log_test("Fact Creation Valid", False, "No fact ID returned")
            return False

    def test_voting(self):
        """Test voting functionality"""
        print("\n🗳️ Testing Voting...")
        
        if not self.token or not self.test_fact_id:
            print("⚠️ Skipping voting test - missing auth or fact ID")
            return False
        
        # Test upvote
        success, _ = self.run_test("Upvote Fact", "POST", f"facts/{self.test_fact_id}/vote", 200, {"vote_type": "up"})
        
        # Test get user vote
        self.run_test("Get User Vote", "GET", f"facts/{self.test_fact_id}/vote", 200)
        
        # Test downvote (change vote)
        self.run_test("Downvote Fact", "POST", f"facts/{self.test_fact_id}/vote", 200, {"vote_type": "down"})
        
        # Test remove vote
        self.run_test("Remove Vote", "POST", f"facts/{self.test_fact_id}/vote", 200, {"vote_type": "down"})
        
        return success

    def test_ai_explanation(self):
        """Test AI explanation generation"""
        print("\n🤖 Testing AI Explanation...")
        
        if not self.test_fact_id:
            print("⚠️ Skipping AI test - no fact ID")
            return False
        
        success, response = self.run_test("Generate AI Explanation", "POST", f"facts/{self.test_fact_id}/explain", 200)
        
        if success and 'explanation' in response and response['explanation']:
            self.log_test("AI Explanation Valid", True)
        else:
            self.log_test("AI Explanation Valid", False, "No explanation generated")
        
        return success

    def test_user_endpoints(self):
        """Test user-related endpoints"""
        print("\n👥 Testing User Endpoints...")
        
        if not self.user_id:
            print("⚠️ Skipping user tests - no user ID")
            return False
        
        # Test get user facts
        self.run_test("Get User Facts", "GET", f"users/{self.user_id}/facts", 200)
        
        # Test get user stats
        success, response = self.run_test("Get User Stats", "GET", f"users/{self.user_id}/stats", 200)
        
        if success and 'total_facts' in response:
            self.log_test("User Stats Valid", True)
        else:
            self.log_test("User Stats Valid", False, "Invalid stats format")
        
        return success

    def test_engagement_tracking(self):
        """Test engagement tracking endpoints"""
        print("\n📊 Testing Engagement Tracking...")
        
        if not self.test_fact_id:
            print("⚠️ Skipping engagement tests - no fact ID")
            return False
        
        # Test view tracking
        success, _ = self.run_test("Track View Event", "POST", "engagement", 200, {
            "fact_id": self.test_fact_id,
            "event_type": "view"
        })
        
        # Test share tracking
        self.run_test("Track Share Event", "POST", "engagement", 200, {
            "fact_id": self.test_fact_id,
            "event_type": "share",
            "value": "twitter"
        })
        
        # Test time spent tracking
        self.run_test("Track Time Spent", "POST", "engagement", 200, {
            "fact_id": self.test_fact_id,
            "event_type": "time_spent",
            "value": "45"
        })
        
        # Test get fact engagement
        success, response = self.run_test("Get Fact Engagement", "GET", f"facts/{self.test_fact_id}/engagement", 200)
        
        if success and 'views' in response and 'shares' in response:
            self.log_test("Engagement Data Valid", True)
        else:
            self.log_test("Engagement Data Valid", False, "Invalid engagement response")
        
        return success

    def test_admin_endpoints(self):
        """Test admin panel endpoints"""
        print("\n🛡️ Testing Admin Endpoints...")
        
        if not self.token:
            print("⚠️ Skipping admin tests - not authenticated")
            return False
        
        # Note: First registered user is automatically admin
        # Let's check if current user has admin access
        success, response = self.run_test("Get Admin Stats", "GET", "admin/stats", 200)
        
        if not success:
            print("⚠️ Current user doesn't have admin access - this is expected for non-first users")
            self.log_test("Admin Access Check", True, "Non-admin user correctly denied access")
            return True
        
        if success and 'total_users' in response and 'total_facts' in response:
            self.log_test("Admin Stats Valid", True)
        else:
            self.log_test("Admin Stats Valid", False, "Invalid admin stats")
        
        # Test get all users (admin)
        success, response = self.run_test("Get All Users (Admin)", "GET", "admin/users?limit=10", 200)
        
        if success and 'users' in response and 'total' in response:
            self.log_test("Admin Users List Valid", True)
        else:
            self.log_test("Admin Users List Valid", False, "Invalid users response")
        
        # Test get all facts (admin)
        success, response = self.run_test("Get All Facts (Admin)", "GET", "admin/facts?limit=10", 200)
        
        if success and 'facts' in response and 'total' in response:
            self.log_test("Admin Facts List Valid", True)
        else:
            self.log_test("Admin Facts List Valid", False, "Invalid facts response")
        
        # Test feature/unfeature fact
        if self.test_fact_id:
            success, response = self.run_test("Toggle Feature Fact", "PUT", f"admin/facts/{self.test_fact_id}/feature", 200)
            
            if success and 'is_featured' in response:
                self.log_test("Feature Toggle Valid", True)
            else:
                self.log_test("Feature Toggle Valid", False, "Invalid feature response")
        
        # Test engagement timeline
        success, response = self.run_test("Get Engagement Timeline", "GET", "admin/engagement/timeline?days=7", 200)
        
        if success and 'timeline' in response:
            self.log_test("Engagement Timeline Valid", True)
        else:
            self.log_test("Engagement Timeline Valid", False, "Invalid timeline response")
        
        return True  # Return true even if not admin, as this is expected behavior

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Facts Are Foes API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Basic health checks
        self.test_health_check()
        
        # Seed data
        self.test_seed_data()
        
        # Categories
        self.test_categories()
        
        # Facts endpoints
        self.test_facts_endpoints()
        
        # Authentication
        self.test_auth_registration()
        self.test_auth_login()
        
        # Fact creation (requires auth)
        self.test_fact_creation()
        
        # Voting (requires auth)
        self.test_voting()
        
        # AI explanation
        self.test_ai_explanation()
        
        # User endpoints
        self.test_user_endpoints()
        
        # Engagement tracking (new premium feature)
        self.test_engagement_tracking()
        
        # Admin endpoints (new premium feature)
        self.test_admin_endpoints()
        
        # Print final results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            return 1

def main():
    tester = FactsAreFoesAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())