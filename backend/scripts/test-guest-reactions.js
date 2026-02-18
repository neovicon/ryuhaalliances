// Using native global fetch (Node 18+)

const BASE_URL = 'http://localhost:5000/api';
const ENTRY_ID = '6947bcd7a09e52cc0469e8ef';

async function testGuestReaction() {
    console.log('--- Testing Guest Reaction ---');

    // 1. Simulate first reaction (no cookie)
    console.log('Step 1: Sending first reaction as guest...');
    const res1 = await fetch(`${BASE_URL}/event-entries/${ENTRY_ID}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: '🔥' })
    });

    const data1 = await res1.json();
    console.log('--- Step 1 Response ---');
    console.log('Status:', res1.status);
    console.log('Headers:', JSON.stringify([...res1.headers.entries()]));
    console.log('Data:', JSON.stringify(data1, null, 2));

    const setCookie = res1.headers.get('set-cookie');
    console.log('Set-Cookie Header:', setCookie);

    if (!setCookie || !setCookie.includes('guest-id')) {
        console.error('FAILED: guest-id cookie not set');
    }

    // 2. Simulate second reaction (with same cookie)
    console.log('\nStep 2: Sending second reaction with same guest-id (changing emoji)...');
    const guestIdCookie = setCookie.split(';')[0];
    const res2 = await fetch(`${BASE_URL}/event-entries/${ENTRY_ID}/react`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': guestIdCookie
        },
        body: JSON.stringify({ type: '❤️' })
    });

    const data2 = await res2.json();
    console.log('Response Status:', res2.status);
    console.log('User Active Reaction:', data2.userActiveReaction);
    console.log('Reaction Counts:', data2.reactionCounts);

    if (data2.userActiveReaction !== '❤️') {
        console.error('FAILED: reaction not updated');
    }

    // 3. Toggle off
    console.log('\nStep 3: Toggling reaction off...');
    const res3 = await fetch(`${BASE_URL}/event-entries/${ENTRY_ID}/react`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': guestIdCookie
        },
        body: JSON.stringify({ type: '❤️' })
    });

    const data3 = await res3.json();
    console.log('Response Status:', res3.status);
    console.log('User Active Reaction:', data3.userActiveReaction);
    console.log('Reaction Counts:', data3.reactionCounts);

    if (data3.userActiveReaction !== null) {
        console.error('FAILED: reaction not toggled off');
    }
}

testGuestReaction().catch(console.error);
