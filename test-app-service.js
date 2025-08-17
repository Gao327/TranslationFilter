// Test the app's translation service directly
import { TranslationService } from './src/services/translationService.js';

async function testAppTranslationService() {
  console.log('🧪 Testing app translation service...');
  
  try {
    const translationService = new TranslationService();
    
    console.log('📋 Service instance created:', translationService.constructor.name);
    console.log('🔧 Default model:', translationService.getDefaultModel());
    
    // Test translation
    const request = {
      text: 'Hello world',
      sourceLang: 'en',
      targetLang: 'zh',
      model: 'baidu'
    };
    
    console.log('📤 Translation request:', request);
    
    const response = await translationService.translate(request);
    
    console.log('✅ Translation successful!');
    console.log('📥 Response:', response);
    
    return true;
  } catch (error) {
    console.error('❌ Translation service test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Test Baidu service directly
async function testBaiduService() {
  console.log('\n🧪 Testing Baidu service directly...');
  
  try {
    const { BaiduTranslationService } = await import('./src/services/baiduTranslationService.js');
    
    const baiduService = new BaiduTranslationService();
    
    console.log('📋 Baidu service instance created:', baiduService.constructor.name);
    
    const request = {
      text: 'Good morning',
      sourceLang: 'en',
      targetLang: 'zh'
    };
    
    console.log('📤 Baidu translation request:', request);
    
    const response = await baiduService.translateText(request);
    
    console.log('✅ Baidu translation successful!');
    console.log('📥 Response:', response);
    
    return true;
  } catch (error) {
    console.error('❌ Baidu service test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Main test
async function runAppTests() {
  console.log('🚀 Starting app service tests...\n');
  
  const results = {
    translationService: false,
    baiduService: false
  };
  
  try {
    results.translationService = await testAppTranslationService();
  } catch (error) {
    console.error('❌ Translation service test error:', error.message);
  }
  
  try {
    results.baiduService = await testBaiduService();
  } catch (error) {
    console.error('❌ Baidu service test error:', error.message);
  }
  
  // Summary
  console.log('\n📊 App Service Test Results:');
  console.log('='.repeat(40));
  console.log(`✅ Translation Service: ${results.translationService ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Baidu Service: ${results.baiduService ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(40));
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All app service tests passed!');
  } else {
    console.log('⚠️  Some app service tests failed.');
  }
  
  return results;
}

// Run tests
runAppTests().catch(console.error);
