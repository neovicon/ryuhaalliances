import urllib.request
import urllib.error
import json

def test(email, password):
    url = 'http://localhost:5000/api/auth/login'
    data = json.dumps({'email': email, 'password': password}).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as f:
            print(f"Status: {f.status}")
            print(f"Response: {f.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Error Response: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error: {str(e)}")

print("--- Test 1: Non-existent ---")
test('nonexistent@example.com', 'pass')
print("\n--- Test 2: Wrong password ---")
test('neo', 'wrongpass')
