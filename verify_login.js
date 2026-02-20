const API_URL = 'http://localhost:5000/api';

async function testLogin(email, password) {
    console.log(`Testing login for: ${email} ...`);
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        if (data.error) {
            console.log('Error Message:', data.error);
        } else {
            console.log('Success:', data);
        }
    } catch (error) {
        console.log('Error:', error.message);
    }
    console.log('---');
}

async function runTests() {
    // 1. Non-existent email
    await testLogin('nonexistent' + Date.now() + '@example.com', 'somepassword');

    // 2. Wrong password (assuming 'neo' exists)
    await testLogin('neo', 'wrongpassword' + Date.now());
}

runTests();
