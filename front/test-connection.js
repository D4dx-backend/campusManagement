// Simple test to verify backend connection
const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test basic connection
    const response = await axios.post('http://localhost:8000/api/auth/login', {}, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Backend is responding');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('✅ Backend is responding (with expected validation error)');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend is not running on port 8000');
    } else {
      console.log('❌ Connection error:', error.message);
    }
  }
}

testConnection();