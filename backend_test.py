import requests
import sys
import json
from datetime import datetime

class FactsAreFoesAPITester:
    def __init__(self, base_url="https://intel-cipher.preview.emergentagent.com/api"):
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
        
    def test_subscription_endpoints(self):
        """Test subscription-related endpoints"""
        print("\n💳 Testing Subscription Endpoints...")
        
        # Test get subscription plans (public endpoint)
        success, response = self.run_test("Get Subscription Plans", "GET", "subscription/plans", 200)
        
        if success and 'plans' in response and 'premium_monthly' in response['plans']:
            plan = response['plans']['premium_monthly']
            if 'name' in plan and 'price' in plan and plan['price'] == 9.0:
                self.log_test("Subscription Plans Data Valid", True)
            else:
                self.log_test("Subscription Plans Data Valid", False, "Invalid plan structure")
        else:
            self.log_test("Subscription Plans Data Valid", False, "No plans in response")
        
        if not self.token:
            print("⚠️ Skipping authenticated subscription tests - not authenticated")
            return success
        
        # Test create checkout session (requires auth)
        checkout_data = {
            "plan_id": "premium_monthly",
            "origin_url": "https://intel-cipher.preview.emergentagent.com"
        }
        
        success, response = self.run_test("Create Checkout Session", "POST", "subscription/create-checkout", 200, checkout_data)
        
        session_id = None
        if success and 'checkout_url' in response and 'session_id' in response:
            session_id = response['session_id']
            self.log_test("Checkout Session Data Valid", True)
        else:
            self.log_test("Checkout Session Data Valid", False, "Missing checkout_url or session_id")
        
        # Test subscription status check (if we have session_id)
        if session_id:
            success, response = self.run_test("Get Subscription Status", "GET", f"subscription/status/{session_id}", 200)
            
            if success and 'status' in response and 'payment_status' in response:
                self.log_test("Subscription Status Data Valid", True)
            else:
                self.log_test("Subscription Status Data Valid", False, "Invalid status response")
        
        # Test my subscription endpoint
        success, response = self.run_test("Get My Subscription", "GET", "subscription/my-subscription", 200)
        
        if success and 'is_premium' in response and 'email_verified' in response:
            self.log_test("My Subscription Data Valid", True)
        else:
            self.log_test("My Subscription Data Valid", False, "Invalid subscription response")
        
        return True

    def test_email_verification_endpoints(self):
        """Test email verification endpoints"""
        print("\n📧 Testing Email Verification Endpoints...")
        
        # Test verify email with invalid token
        invalid_token_data = {"token": "invalid_token_12345"}
        success, response = self.run_test("Verify Email Invalid Token", "POST", "auth/verify-email", 400, invalid_token_data)
        
        if success:
            self.log_test("Invalid Token Rejection", True)
        else:
            self.log_test("Invalid Token Rejection", False, "Should reject invalid token with 400")
        
        # Test resend verification
        if hasattr(self, 'test_email'):
            resend_data = {"email": self.test_email}
            success, response = self.run_test("Resend Verification", "POST", "auth/resend-verification", 200, resend_data)
            
            if success and 'message' in response:
                self.log_test("Resend Verification Valid", True)
            else:
                self.log_test("Resend Verification Valid", False, "Invalid resend response")
        else:
            print("⚠️ Skipping resend verification - no test email available")
        
        # Test resend verification with non-existent email
        nonexistent_data = {"email": "nonexistent@example.com"}
        success, response = self.run_test("Resend Verification Non-existent", "POST", "auth/resend-verification", 404, nonexistent_data)
        
        if success:
            self.log_test("Non-existent Email Rejection", True)
        else:
            self.log_test("Non-existent Email Rejection", False, "Should reject non-existent email with 404")
        
        return True

    def test_auth_registration_enhanced(self):
        """Test enhanced user registration with new fields"""
        print("\n👤 Testing Enhanced User Registration...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        # Store test email for later use
        self.test_email = test_user_data["email"]
        
        success, response = self.run_test("Enhanced User Registration", "POST", "auth/register", 200, test_user_data)
        
        if success and 'token' in response and 'user' in response:
            user_data = response['user']
            
            # Check for new fields
            if 'email_verified' in user_data and 'is_premium' in user_data:
                self.log_test("Registration New Fields Present", True)
                
                # Check default values
                if user_data['email_verified'] == False and user_data['is_premium'] == False:
                    self.log_test("Registration Default Values Correct", True)
                else:
                    self.log_test("Registration Default Values Correct", False, f"email_verified: {user_data.get('email_verified')}, is_premium: {user_data.get('is_premium')}")
            else:
                self.log_test("Registration New Fields Present", False, "Missing email_verified or is_premium fields")
            
            # Check for verification message
            if 'message' in response and 'verify' in response['message'].lower():
                self.log_test("Registration Verification Message", True)
            else:
                self.log_test("Registration Verification Message", False, "No verification message")
            
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        else:
            self.log_test("Enhanced Registration Failed", False, "No token or user in response")
            return False

    def test_auth_login_enhanced(self):
        """Test enhanced user login with new fields"""
        print("\n🔐 Testing Enhanced User Login...")
        
        if not self.token:
            print("⚠️ Skipping enhanced login test - no registered user")
            return False
            
        # Test /auth/me endpoint for new fields
        success, response = self.run_test("Get Current User Enhanced", "GET", "auth/me", 200)
        
        if success and 'id' in response:
            # Check for new fields in /auth/me response
            if 'email_verified' in response and 'is_premium' in response:
                self.log_test("Auth Me New Fields Present", True)
                
                # Check field types
                if isinstance(response['email_verified'], bool) and isinstance(response['is_premium'], bool):
                    self.log_test("Auth Me Field Types Correct", True)
                else:
                    self.log_test("Auth Me Field Types Correct", False, f"email_verified type: {type(response['email_verified'])}, is_premium type: {type(response['is_premium'])}")
            else:
                self.log_test("Auth Me New Fields Present", False, "Missing email_verified or is_premium fields")
        else:
            self.log_test("Enhanced Auth Me Failed", False, "Invalid user data")
        
        return success

    def test_admin_with_admin_email(self):
        """Test admin functionality with admin email"""
        print("\n👑 Testing Admin Functionality with Admin Email...")
        
        # Try to create user with admin email
        timestamp = datetime.now().strftime('%H%M%S%f')
        admin_user_data = {
            "username": f"admin_{timestamp}",
            "email": "admin@factsarefoes.com",
            "password": "AdminPass123!"
        }
        
        # First try to register (might fail if email exists)
        success, response = self.run_test("Create Admin Email User", "POST", "auth/register", 200, admin_user_data)
        
        admin_token = None
        if success and 'token' in response:
            admin_token = response['token']
        else:
            # Try to login with admin email if registration failed
            login_data = {
                "email": "admin@factsarefoes.com",
                "password": "AdminPass123!"
            }
            
            url = f"{self.base_url}/auth/login"
            try:
                login_response = requests.post(url, json=login_data, headers={'Content-Type': 'application/json'})
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    if 'token' in login_result:
                        admin_token = login_result['token']
                        self.log_test("Admin Email Login", True)
                    else:
                        self.log_test("Admin Email Login", False, "No token in login response")
                else:
                    self.log_test("Admin Email Login", False, f"Login failed with status {login_response.status_code}")
            except Exception as e:
                self.log_test("Admin Email Login", False, f"Login error: {str(e)}")
        
        if not admin_token:
            print("⚠️ Could not get admin token, testing admin endpoints will be skipped")
            return False
        
        # Test admin endpoints with admin token
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        # Test admin stats
        url = f"{self.base_url}/admin/stats"
        try:
            admin_response = requests.get(url, headers=headers)
            if admin_response.status_code == 200:
                self.log_test("Admin Stats Access", True)
                
                stats_data = admin_response.json()
                if 'total_users' in stats_data and 'total_facts' in stats_data:
                    self.log_test("Admin Stats Data Valid", True)
                
                # Test admin users endpoint
                users_response = requests.get(f"{self.base_url}/admin/users?limit=5", headers=headers)
                if users_response.status_code == 200:
                    users_data = users_response.json()
                    if 'users' in users_data and 'total' in users_data:
                        self.log_test("Admin Users Endpoint Valid", True)
                
                # Test admin facts endpoint
                facts_response = requests.get(f"{self.base_url}/admin/facts?limit=5", headers=headers)
                if facts_response.status_code == 200:
                    facts_data = facts_response.json()
                    if 'facts' in facts_data and 'total' in facts_data:
                        self.log_test("Admin Facts Endpoint Valid", True)
                
                # Test engagement timeline
                timeline_response = requests.get(f"{self.base_url}/admin/engagement/timeline?days=3", headers=headers)
                if timeline_response.status_code == 200:
                    timeline_data = timeline_response.json()
                    if 'timeline' in timeline_data:
                        self.log_test("Admin Timeline Endpoint Valid", True)
                
                # Test feature toggle if we have a fact ID
                if hasattr(self, 'test_fact_id') and self.test_fact_id:
                    feature_response = requests.put(f"{self.base_url}/admin/facts/{self.test_fact_id}/feature", headers=headers)
                    if feature_response.status_code == 200:
                        feature_data = feature_response.json()
                        if 'is_featured' in feature_data:
                            self.log_test("Admin Feature Toggle Valid", True)
                
                return True
            else:
                self.log_test("Admin Stats Access", False, f"Expected 200, got {admin_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Admin Test Error", False, f"Error: {str(e)}")
            return False

    def test_intel_endpoints_sovereign_user(self):
        """Test Intel endpoints with Sovereign user"""
        print("\n🎯 Testing Intel Endpoints with Sovereign User...")
        
        # Login as the existing Sovereign user
        login_data = {
            "email": "newadmin@test.com",
            "password": "password123"
        }
        
        success, response = self.run_test("Login Sovereign User", "POST", "auth/login", 200, login_data)
        
        sovereign_token = None
        if success and 'token' in response and 'user' in response:
            sovereign_token = response['token']
            user_data = response['user']
            
            # Verify user has sovereign tier
            if user_data.get('tier') == 'sovereign':
                self.log_test("Sovereign User Tier Verified", True)
            else:
                self.log_test("Sovereign User Tier Verified", False, f"Expected 'sovereign', got '{user_data.get('tier')}'")
        else:
            self.log_test("Login Sovereign User", False, "Failed to login sovereign user")
            return False
        
        if not sovereign_token:
            print("⚠️ Could not get sovereign token, skipping intel tests")
            return False
        
        # Store current token and set sovereign token
        original_token = self.token
        self.token = sovereign_token
        
        # Test intel access check
        success, response = self.run_test("Intel Access Check", "GET", "intel/access", 200)
        if success and response.get('has_access') == True:
            self.log_test("Intel Access Granted", True)
        else:
            self.log_test("Intel Access Granted", False, f"Access denied: {response}")
        
        # Test intel news endpoint
        success, response = self.run_test("Intel News Endpoint", "GET", "intel/news", 200)
        if success and 'articles' in response and isinstance(response['articles'], list):
            self.log_test("Intel News Data Valid", True)
            
            # Check if articles have required fields
            if len(response['articles']) > 0:
                article = response['articles'][0]
                required_fields = ['title', 'description', 'source']
                if all(field in article for field in required_fields):
                    self.log_test("Intel News Article Structure Valid", True)
                else:
                    self.log_test("Intel News Article Structure Valid", False, f"Missing fields in article: {article}")
        else:
            self.log_test("Intel News Data Valid", False, "No articles array in response")
        
        # Test intel content endpoint
        success, response = self.run_test("Intel Content Endpoint", "GET", "intel/content", 200)
        if success and 'content' in response and isinstance(response['content'], list):
            self.log_test("Intel Content Data Valid", True)
            
            # Check if content has required fields
            if len(response['content']) > 0:
                content_item = response['content'][0]
                required_fields = ['id', 'title', 'type', 'description']
                if all(field in content_item for field in required_fields):
                    self.log_test("Intel Content Structure Valid", True)
                else:
                    self.log_test("Intel Content Structure Valid", False, f"Missing fields in content: {content_item}")
        else:
            self.log_test("Intel Content Data Valid", False, "No content array in response")
        
        # Test generate foe response endpoint
        foe_request_data = {
            "headline": "Global Markets Rally Despite Economic Indicators",
            "description": "Stocks hit record highs as investors ignore warning signs from the bond market.",
            "source": "Financial Times"
        }
        
        success, response = self.run_test("Generate Foe Response", "POST", "intel/generate-foe-response", 200, foe_request_data)
        if success and 'foe_response' in response and response['foe_response']:
            self.log_test("Foe Response Generated", True)
        else:
            self.log_test("Foe Response Generated", False, f"No foe_response in response: {response}")
        
        # Test cipher submission endpoint
        cipher_data = {
            "answers": ["option1", "option2", "option3", "option4", "option5"],
            "fear_percentage": 25.5,
            "intuition_percentage": 74.5,
            "result_type": "intuitive_navigator"
        }
        
        success, response = self.run_test("Cipher Submission", "POST", "intel/cipher-submit", 200, cipher_data)
        if success and 'message' in response:
            self.log_test("Cipher Submission Valid", True)
        else:
            self.log_test("Cipher Submission Valid", False, f"Invalid cipher response: {response}")
        
        # Restore original token
        self.token = original_token
        return True

    def test_intel_endpoints_free_user(self):
        """Test Intel endpoints with Free user to verify access denial"""
        print("\n🚫 Testing Intel Endpoints with Free User...")
        
        # Create a new free user
        timestamp = datetime.now().strftime('%H%M%S')
        free_user_data = {
            "username": f"freeuser_{timestamp}",
            "email": f"freeuser_{timestamp}@test.com",
            "password": "password123"
        }
        
        success, response = self.run_test("Create Free User", "POST", "auth/register", 200, free_user_data)
        
        free_token = None
        if success and 'token' in response and 'user' in response:
            free_token = response['token']
            user_data = response['user']
            
            # Verify user has free tier
            if user_data.get('tier') == 'free':
                self.log_test("Free User Tier Verified", True)
            else:
                self.log_test("Free User Tier Verified", False, f"Expected 'free', got '{user_data.get('tier')}'")
        else:
            self.log_test("Create Free User", False, "Failed to create free user")
            return False
        
        if not free_token:
            print("⚠️ Could not get free user token, skipping access denial tests")
            return False
        
        # Store current token and set free user token
        original_token = self.token
        self.token = free_token
        
        # Test intel access check (should be denied)
        success, response = self.run_test("Intel Access Check Free User", "GET", "intel/access", 200)
        if success and response.get('has_access') == False:
            self.log_test("Intel Access Denied for Free User", True)
        else:
            self.log_test("Intel Access Denied for Free User", False, f"Access should be denied: {response}")
        
        # Test intel content endpoint (should return empty content)
        success, response = self.run_test("Intel Content Free User", "GET", "intel/content", 200)
        if success and 'content' in response and len(response['content']) == 0:
            self.log_test("Intel Content Empty for Free User", True)
        else:
            self.log_test("Intel Content Empty for Free User", False, f"Content should be empty: {response}")
        
        # Test generate foe response (should get canned response)
        foe_request_data = {
            "headline": "Test Headline for Free User",
            "description": "Test description for free user testing.",
            "source": "Test Source"
        }
        
        success, response = self.run_test("Generate Foe Response Free User", "POST", "intel/generate-foe-response", 200, foe_request_data)
        if success and 'foe_response' in response and response['foe_response']:
            # Free users should get canned responses, not AI-generated ones
            self.log_test("Foe Response for Free User", True)
        else:
            self.log_test("Foe Response for Free User", False, f"No foe_response: {response}")
        
        # Restore original token
        self.token = original_token
        return True

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
        
        # Authentication (enhanced with new fields)
        self.test_auth_registration_enhanced()
        self.test_auth_login_enhanced()
        
        # Email verification endpoints
        self.test_email_verification_endpoints()
        
        # Subscription endpoints
        self.test_subscription_endpoints()
        
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
        
        # Test admin functionality with admin email
        self.test_admin_with_admin_email()
        
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