import os
from pymongo import MongoClient

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

client = MongoClient(mongo_url)
db = client[db_name]

result = db.users.update_one(
    {'email': 'newadmin@test.com'},
    {'$set': {'email_verified': True, 'tier': 'sovereign', 'is_premium': True}}
)

print(f"Matched: {result.matched_count}, Modified: {result.modified_count}")
