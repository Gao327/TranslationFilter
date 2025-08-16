// 测试百度翻译API - 全面测试版本
import axios from 'axios';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

// 百度翻译API配置
const BAIDU_CONFIG = {
  appId: process.env.VITE_BAIDU_APP_ID || '20250816002432414',
  apiKey: process.env.VITE_BAIDU_API_KEY || 'b3a1JQGV7LUYIEVti14j',
  apiUrl: 'https://fanyi-api.baidu.com/api/trans/vip/translate'
};

// 生成MD5签名
function generateSign(query, appId, salt, apiKey) {
  const str = appId + query + salt + apiKey;
  return crypto.createHash('md5').update(str).digest('hex');
}

// 测试百度翻译API
async function testBaiduTranslation() {
  console.log('🚀 开始测试百度翻译API...');
  console.log('配置信息:');
  console.log('- APP ID:', BAIDU_CONFIG.appId);
  console.log('- API Key:', BAIDU_CONFIG.apiKey.substring(0, 8) + '***');
  console.log('- API URL:', BAIDU_CONFIG.apiUrl);
  console.log('');

  try {
    const query = 'hello world';
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

    console.log('📤 发送请求参数:');
    console.log('- 查询文本:', params.q);
    console.log('- 源语言:', params.from);
    console.log('- 目标语言:', params.to);
    console.log('- 盐值:', params.salt);
    console.log('- 签名:', params.sign);
    console.log('');

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

    console.log('📥 API响应:');
    console.log('- 状态码:', response.status);
    console.log('- 响应数据:', JSON.stringify(response.data, null, 2));

    if (response.data.error_code) {
      console.log('❌ API调用失败:');
      console.log('- 错误代码:', response.data.error_code);
      console.log('- 错误信息:', response.data.error_msg);
    } else {
      console.log('✅ API调用成功!');
      console.log('- 原文:', response.data.trans_result[0].src);
      console.log('- 译文:', response.data.trans_result[0].dst);
      console.log('- 检测语言:', response.data.from);
    }

  } catch (error) {
    console.log('❌ 请求失败:');
    if (error.response) {
      console.log('- HTTP状态码:', error.response.status);
      console.log('- 响应数据:', error.response.data);
    } else if (error.request) {
      console.log('- 网络错误:', error.message);
    } else {
      console.log('- 其他错误:', error.message);
    }
  }
}

// 测试语言检测功能
async function testLanguageDetection() {
  console.log('\n🔍 测试语言检测功能...');
  
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

    console.log('📤 发送语言检测请求:');
    console.log('- 查询文本:', params.q);
    console.log('- 源语言:', params.from, '(自动检测)');
    console.log('');

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

    console.log('📥 语言检测响应:');
    console.log('- 检测到的语言:', response.data.from);
    console.log('- 翻译结果:', response.data.trans_result[0].dst);

  } catch (error) {
    console.log('❌ 语言检测失败:', error.message);
  }
}

// 调用百度翻译API
async function translateText(text, from = 'auto', to = 'zh') {
  const salt = Date.now().toString();
  const sign = generateSign(text, BAIDU_CONFIG.appId, salt, BAIDU_CONFIG.apiKey);
  
  const params = {
    q: text,
    from,
    to,
    appid: BAIDU_CONFIG.appId,
    salt,
    sign
  };
  
  try {
    const response = await axios.post(BAIDU_CONFIG.apiUrl, new URLSearchParams(params), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`API调用失败: ${error.message}`);
  }
}

// 延迟函数（避免API调用过于频繁）
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试用例数据
const testCases = [
  // 基础翻译测试
  {
    category: '基础翻译',
    tests: [
      { text: 'Hello World', from: 'en', to: 'zh', desc: '英译中 - 基础问候' },
      { text: '你好我是一个翻译机器人嘿嘿嘿', from: 'zh', to: 'en', desc: '中译英 - 基础问候' },
      { text: 'こんにちは', from: 'jp', to: 'zh', desc: '日译中 - 问候语' },
      { text: 'Bonjour le monde', from: 'fra', to: 'zh', desc: '法译中 - 问候语' },
      { text: 'Hola mundo', from: 'spa', to: 'zh', desc: '西译中 - 问候语' }
    ]
  },
  
  // 日常对话测试
  {
    category: '日常对话',
    tests: [
      { text: 'How are you today?', from: 'en', to: 'zh', desc: '英译中 - 日常问候' },
      { text: '今天天气怎么样？', from: 'zh', to: 'en', desc: '中译英 - 询问天气' },
      { text: 'What time is it now?', from: 'en', to: 'zh', desc: '英译中 - 询问时间' },
      { text: '我饿了，想吃点东西', from: 'zh', to: 'en', desc: '中译英 - 表达需求' },
      { text: 'Can you help me with this problem?', from: 'en', to: 'zh', desc: '英译中 - 请求帮助' }
    ]
  },
  
  // 技术术语测试
  {
    category: '技术术语',
    tests: [
      { text: 'artificial intelligence', from: 'en', to: 'zh', desc: '英译中 - AI术语' },
      { text: '机器学习算法', from: 'zh', to: 'en', desc: '中译英 - ML术语' },
      { text: 'blockchain technology', from: 'en', to: 'zh', desc: '英译中 - 区块链' },
      { text: '云计算服务', from: 'zh', to: 'en', desc: '中译英 - 云计算' },
      { text: 'quantum computing', from: 'en', to: 'zh', desc: '英译中 - 量子计算' }
    ]
  },
  
  // 文学和诗歌测试
  {
    category: '文学诗歌',
    tests: [
      { text: 'To be or not to be, that is the question.', from: 'en', to: 'zh', desc: '英译中 - 莎士比亚名句' },
      { text: '床前明月光，疑是地上霜', from: 'zh', to: 'en', desc: '中译英 - 李白诗句' },
      { text: 'The quick brown fox jumps over the lazy dog.', from: 'en', to: 'zh', desc: '英译中 - 经典句子' },
      { text: '山重水复疑无路，柳暗花明又一村', from: 'zh', to: 'en', desc: '中译英 - 陆游诗句' }
    ]
  },
  
  // 俚语和口语测试
  {
    category: '俚语口语',
    tests: [
      { text: "What's up?", from: 'en', to: 'zh', desc: '英译中 - 口语问候' },
      { text: '搞什么鬼？', from: 'zh', to: 'en', desc: '中译英 - 口语表达' },
      { text: 'Break a leg!', from: 'en', to: 'zh', desc: '英译中 - 祝福俚语' },
      { text: '加油！', from: 'zh', to: 'en', desc: '中译英 - 鼓励用语' },
      { text: "It's raining cats and dogs.", from: 'en', to: 'zh', desc: '英译中 - 习语表达' }
    ]
  },
  
  // 长文本测试
  {
    category: '长文本',
    tests: [
      { 
        text: 'The Internet of Things (IoT) refers to the network of physical objects embedded with sensors, software, and other technologies for the purpose of connecting and exchanging data with other devices and systems over the internet.',
        from: 'en', 
        to: 'zh', 
        desc: '英译中 - IoT技术描述' 
      },
      { 
        text: '人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。',
        from: 'zh', 
        to: 'en', 
        desc: '中译英 - AI技术描述' 
      }
    ]
  },
  
  // 特殊字符和符号测试
  {
    category: '特殊字符',
    tests: [
      { text: 'Price: $99.99 (50% off!)', from: 'en', to: 'zh', desc: '英译中 - 价格符号' },
      { text: '温度：25°C，湿度：60%', from: 'zh', to: 'en', desc: '中译英 - 度量单位' },
      { text: 'Email: user@example.com', from: 'en', to: 'zh', desc: '英译中 - 邮箱地址' },
      { text: '网址：https://www.baidu.com', from: 'zh', to: 'en', desc: '中译英 - 网址链接' },
      { text: 'Math: 2 + 2 = 4, π ≈ 3.14159', from: 'en', to: 'zh', desc: '英译中 - 数学符号' }
    ]
  },
  
  // 多语言检测测试
  {
    category: '语言检测',
    tests: [
      { text: 'Automatic language detection test', from: 'auto', to: 'zh', desc: '自动检测 - 英语' },
      { text: '自动语言检测测试', from: 'auto', to: 'en', desc: '自动检测 - 中文' },
      { text: 'Test de détection automatique', from: 'auto', to: 'zh', desc: '自动检测 - 法语' },
      { text: 'Prueba de detección automática', from: 'auto', to: 'zh', desc: '自动检测 - 西班牙语' },
      { text: '自動言語検出テスト', from: 'auto', to: 'zh', desc: '自动检测 - 日语' }
    ]
  }
];

// 执行单个测试
async function runSingleTest(test, index, total) {
  try {
    console.log(`\n📝 测试 ${index}/${total}: ${test.desc}`);
    console.log(`   原文: "${test.text}"`);
    console.log(`   语言: ${test.from} → ${test.to}`);
    
    const result = await translateText(test.text, test.from, test.to);
    
    if (result.error_code) {
      console.log(`   ❌ 失败: ${result.error_msg} (${result.error_code})`);
      return { success: false, error: result.error_msg };
    }
    
    const translation = result.trans_result[0];
    console.log(`   译文: "${translation.dst}"`);
    
    if (test.from === 'auto') {
      console.log(`   检测语言: ${result.from}`);
    }
    
    console.log(`   ✅ 成功`);
    
    return { 
      success: true, 
      original: translation.src,
      translated: translation.dst,
      detectedLang: result.from
    };
    
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 运行完整测试套件
async function runTests() {
  console.log('🚀 开始百度翻译API全面测试');
  console.log('='.repeat(80));
  console.log(`配置信息:`);
  console.log(`  APP ID: ${BAIDU_CONFIG.appId}`);
  console.log(`  API URL: ${BAIDU_CONFIG.apiUrl}`);
  console.log('='.repeat(80));
  
  let totalTests = 0;
  let successTests = 0;
  let failedTests = 0;
  const results = [];
  
  // 计算总测试数量
  testCases.forEach(category => {
    totalTests += category.tests.length;
  });
  
  console.log(`\n📊 总共将执行 ${totalTests} 个测试用例\n`);
  
  let currentIndex = 0;
  
  // 执行所有测试分类
  for (const category of testCases) {
    console.log(`\n🔍 === ${category.category} ===`);
    
    for (const test of category.tests) {
      currentIndex++;
      
      const result = await runSingleTest(test, currentIndex, totalTests);
      
      if (result.success) {
        successTests++;
      } else {
        failedTests++;
      }
      
      results.push({
        category: category.category,
        test: test.desc,
        success: result.success,
        original: test.text,
        translated: result.translated || null,
        detectedLang: result.detectedLang || null,
        error: result.error || null
      });
      
      // 添加延迟避免API调用过于频繁
      if (currentIndex < totalTests) {
        await delay(500); // 500ms延迟
      }
    }
  }
  
  // 生成测试报告
  console.log('\n' + '='.repeat(80));
  console.log('📈 测试报告');
  console.log('='.repeat(80));
  console.log(`总测试数: ${totalTests}`);
  console.log(`成功: ${successTests} (${((successTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`失败: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
  
  // 按分类统计
  console.log('\n📋 分类统计:');
  testCases.forEach(category => {
    const categoryResults = results.filter(r => r.category === category.category);
    const categorySuccess = categoryResults.filter(r => r.success).length;
    const categoryTotal = categoryResults.length;
    console.log(`  ${category.category}: ${categorySuccess}/${categoryTotal} (${((categorySuccess/categoryTotal)*100).toFixed(1)}%)`);
  });
  
  // 显示失败的测试
  const failedResults = results.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log('\n❌ 失败的测试:');
    failedResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.test}`);
      console.log(`     错误: ${result.error}`);
    });
  }
  
  // 显示一些成功的翻译示例
  const successResults = results.filter(r => r.success).slice(0, 5);
  if (successResults.length > 0) {
    console.log('\n✅ 成功翻译示例:');
    successResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.test}`);
      console.log(`     原文: "${result.original}"`);
      console.log(`     译文: "${result.translated}"`);
      if (result.detectedLang) {
        console.log(`     检测语言: ${result.detectedLang}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 测试完成！');
  console.log('='.repeat(80));
  
  return {
    total: totalTests,
    success: successTests,
    failed: failedTests,
    results: results
  };
}

// 主程序入口
async function main() {
  try {
    console.log('🔍 检查环境变量...');
    console.log('VITE_BAIDU_APP_ID:', process.env.VITE_BAIDU_APP_ID ? '已设置' : '未设置');
    console.log('VITE_BAIDU_API_KEY:', process.env.VITE_BAIDU_API_KEY ? '已设置' : '未设置');
    console.log('配置对象:', BAIDU_CONFIG);
    
    // 检查配置
    if (!BAIDU_CONFIG.appId || !BAIDU_CONFIG.apiKey) {
      console.error('❌ 错误: 缺少百度翻译API配置');
      console.error('请确保设置了以下环境变量:');
      console.error('  - VITE_BAIDU_APP_ID');
      console.error('  - VITE_BAIDU_API_KEY');
      process.exit(1);
    }
    
    // 运行测试
    const testResults = await runTests();
    
    // 根据测试结果设置退出码
    if (testResults.failed > 0) {
      console.log(`\n⚠️  有 ${testResults.failed} 个测试失败`);
      process.exit(1);
    } else {
      console.log('\n🎉 所有测试都通过了！');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ 测试执行出错:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 启动测试
main().catch(console.error);

export {
  translateText,
  runTests,
  testCases
};