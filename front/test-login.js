import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const testCredentials = [
  { mobile: '9876543210', pin: '1234', role: 'Super Admin' },
  { mobile: '9876543211', pin: '5678', role: 'Branch Admin' },
  { mobile: '9876543212', pin: '9012', role: 'Teacher' },
  { mobile: '9876543213', pin: '3456', role: 'Accountant' }
];

async function testLogin() {
  console.log('🧪 Testing Login API...\n');

  for (const cred of testCredentials) {
    try {
      console.log(`Testing ${cred.role} login...`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        mobile: cred.mobile,
        pin: cred.pin
      });

      if (response.data.success) {
        console.log(`✅ ${cred.role} login successful`);
        console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
        console.log(`   User: ${response.data.data.user.name}`);
        console.log(`   Role: ${response.data.data.user.role}\n`);
      } else {
        console.log(`❌ ${cred.role} login failed: ${response.data.message}\n`);
      }
    } catch (error) {
      console.log(`❌ ${cred.role} login error:`, error.response?.data?.message || error.message);
      console.log(`   Status: ${error.response?.status || 'Network Error'}\n`);
    }
  }
}

// Test invalid credentials
async function testInvalidLogin() {
  console.log('🧪 Testing Invalid Credentials...\n');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      mobile: '1111111111',
      pin: '0000'
    });
    
    console.log('❌ Invalid login should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid credentials correctly rejected');
      console.log(`   Message: ${error.response.data.message}\n`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

async function runTests() {
  try {
    // Test server connectivity
    console.log('🔍 Checking server connectivity...');
    await axios.get(`${API_BASE_URL}/health`).catch(() => {
      throw new Error('Server is not running on port 8000');
    });
    console.log('✅ Server is running\n');

    await testLogin();
    await testInvalidLogin();
    
    console.log('🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 8000');
    console.log('   Run: cd d4mediaCampus-api && npm run dev');
  }
}

runTests();