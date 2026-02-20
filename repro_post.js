import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
// You'll need a valid token. I'll assume I can get one or the user can provide one.
// Alternatively, I can try to hit it without auth to see if I get 401 first, then I'll know where I am.
const TOKEN = 'YOUR_TOKEN_HERE';

async function testPost() {
    const form = new URLSearchParams();
    form.append('content', 'Test post content');
    form.append('isPrivate', 'true');

    try {
        const response = await axios.post(`${API_URL}/posts`, form, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Errors:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testPost();
