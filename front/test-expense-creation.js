// Simple test to verify expense creation API
const axios = require('axios');

const testExpenseCreation = async () => {
  try {
    console.log('Testing expense creation...');
    
    // Test data
    const expenseData = {
      date: "2025-01-04",
      category: "Test Category",
      description: "Test expense for validation",
      amount: 500,
      paymentMethod: "bank",
      approvedBy: "Test User",
      remarks: "Test remarks"
    };

    console.log('Sending data:', JSON.stringify(expenseData, null, 2));

    // Make API call
    const response = await axios.post('http://localhost:8000/api/expenses', expenseData, {
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add a valid auth token here
        'Authorization': 'Bearer YOUR_AUTH_TOKEN'
      }
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Error occurred:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
};

// Run the test
testExpenseCreation();