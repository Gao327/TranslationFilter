// Test script to verify Baidu translation integration
import axios from 'axios';
import crypto from 'crypto';

// Test the same configuration the app uses
const BAIDU_CONFIG = {
  appId: '20250816002432414',
  apiKey: 'b3a1JQGV7LUYIEVti14j',
  apiUrl: 'https://fanyi-api.baidu.com/api/trans/vip/translate'
};

// Generate MD5 signature (same as app)
function generateSign(query, appId, salt, apiKey) {
  const str = appId + query + salt + apiKey;
  return crypto.createHash('md5').update(str).digest('hex');
}

// Test basic translation
async function testBasicTranslation() {
  console.log('🧪 Testing basic translation...');
  
  try {
    const query = 'Hello world';
    const salt = Date.now().toString();
    const sign = generateSign(query, BAIDU_CONFIG.appId, salt, BAIDU_CONFIG.apiKey);

    const params = {
      q: query,
      from: 'en',
      to: 'zh',
      appid: BAIDU_CONFIG.appId,
      salt: salt,
      sign: sign
    };

    console.log('📤 Request params:', { ...params, sign: sign.substring(0, 8) + '***' });

    const response = await axios.post(
      BAIDU_CONFIG.apiUrl,
      new URLSearchParams(params),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );

    console.log('✅ Translation successful!');
    console.log('📥 Response:', response.data);
    
    if (response.data.trans_result && response.data.trans_result[0]) {
      console.log(`🌐 "${query}" → "${response.data.trans_result[0].dst}"`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Translation failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Test language detection
async function testLanguageDetection() {
  console.log('\n🧪 Testing language detection...');
  
  try {
    const query = '这是什么';
    const salt = Date.now().toString();
    const sign = generateSign(query, BAIDU_CONFIG.appId, salt, BAIDU_CONFIG.apiKey);

    const params = {
      q: query,
      from: 'auto',
      to: 'en',
      appid: BAIDU_CONFIG.appId,
      salt: salt,
      sign: sign
    };

    const response = await axios.post(
      BAIDU_CONFIG.apiUrl,
      new URLSearchParams(params),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );

    console.log('✅ Language detection successful!');
    console.log(`🌐 Detected language: ${response.data.from}`);
    console.log(`📝 Translation: "${query}" → "${response.data.trans_result[0].dst}"`);
    
    return true;
  } catch (error) {
    console.error('❌ Language detection failed:', error.message);
    return false;
  }
}

// Test app's proxy endpoint (simulate what the app does)
async function testAppProxy() {
  console.log('\n🧪 Testing app proxy endpoint...');
  
  try {
    const query = 'Good morning';
    const salt = Date.now().toString();
    const sign = generateSign(query, BAIDU_CONFIG.appId, salt, BAIDU_CONFIG.apiKey);

    const params = {
      q: query,
      from: 'en',
      to: 'zh',
      appid: BAIDU_CONFIG.appId,
      salt: salt,
      sign: sign
    };

    // This would be the app's proxy URL in development
    const proxyUrl = 'http://localhost:5173/api/baidu/api/trans/vip/translate';
    
    console.log('📤 Testing proxy URL:', proxyUrl);
    console.log('📤 Request params:', { ...params, sign: sign.substring(0, 8) + '***' });

    const response = await axios.post(
      proxyUrl,
      new URLSearchParams(params),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );

    console.log('✅ Proxy test successful!');
    console.log('📥 Response:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ Proxy test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Baidu translation integration tests...\n');
  
  const results = {
    basicTranslation: false,
    languageDetection: false,
    appProxy: false
  };
  
  // Test 1: Basic translation
  results.basicTranslation = await testBasicTranslation();
  
  // Test 2: Language detection
  results.languageDetection = await testLanguageDetection();
  
  // Test 3: App proxy (if dev server is running)
  try {
    results.appProxy = await testAppProxy();
  } catch (error) {
    console.log('⚠️  App proxy test skipped (dev server may not be running)');
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(40));
  console.log(`✅ Basic Translation: ${results.basicTranslation ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Language Detection: ${results.languageDetection ? 'PASS' : 'FAIL'}`);
  console.log(`✅ App Proxy: ${results.appProxy ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(40));
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Baidu integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
  
  return results;
}

// Run tests
runTests().catch(console.error);
