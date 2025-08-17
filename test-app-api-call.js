import crypto from 'crypto';

// 模拟应用的环境变量
const appId = '20250816002432414';
const apiKey = 'b3a1JQGV7LUYIEVti14j';

// 模拟应用的签名生成
function generateSign(query, appId, salt, apiKey) {
  const str = appId + query + salt + apiKey;
  return crypto.createHash('md5').update(str).digest('hex');
}

// 模拟应用的翻译请求
async function testAppAPICall() {
  console.log('🧪 测试应用API调用...');
  console.log('配置:');
  console.log('- APP ID:', appId);
  console.log('- API Key:', apiKey.substring(0, 8) + '***');
  console.log('');

  const query = 'Hello world';
  const salt = Date.now().toString();
  const sign = generateSign(query, appId, salt, apiKey);

  const params = {
    q: query,
    from: 'en',
    to: 'zh',
    appid: appId,
    salt: salt,
    sign: sign
  };

  console.log('📤 应用发送的参数:');
  console.log('- 查询文本:', params.q);
  console.log('- 源语言:', params.from);
  console.log('- 目标语言:', params.to);
  console.log('- 盐值:', params.salt);
  console.log('- 签名:', params.sign);
  console.log('');

  // 测试直接调用百度API
  console.log('🔍 测试直接调用百度API...');
  try {
    const response = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(params)
    });

    const data = await response.json();
    console.log('📥 直接API响应:');
    console.log('- 状态码:', response.status);
    console.log('- 响应数据:', JSON.stringify(data, null, 2));

    if (data.error_code) {
      console.log('❌ 直接API调用失败:');
      console.log('- 错误代码:', data.error_code);
      console.log('- 错误信息:', data.error_msg);
    } else {
      console.log('✅ 直接API调用成功!');
    }
  } catch (error) {
    console.log('❌ 直接API调用失败:', error.message);
  }

  // 测试通过应用代理
  console.log('\n🔍 测试通过应用代理...');
  try {
    const proxyResponse = await fetch('http://localhost:5173/api/baidu/api/trans/vip/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(params)
    });

    const proxyData = await proxyResponse.json();
    console.log('📥 代理API响应:');
    console.log('- 状态码:', proxyResponse.status);
    console.log('- 响应数据:', JSON.stringify(proxyData, null, 2));

    if (proxyData.error_code) {
      console.log('❌ 代理API调用失败:');
      console.log('- 错误代码:', proxyData.error_code);
      console.log('- 错误信息:', proxyData.error_msg);
    } else {
      console.log('✅ 代理API调用成功!');
    }
  } catch (error) {
    console.log('❌ 代理API调用失败:', error.message);
  }

  // 验证签名计算
  console.log('\n🔍 验证签名计算...');
  const expectedSign = generateSign(query, appId, salt, apiKey);
  console.log('- 期望签名:', expectedSign);
  console.log('- 实际签名:', sign);
  console.log('- 签名匹配:', expectedSign === sign ? '✅' : '❌');

  // 显示签名计算的详细信息
  const signString = appId + query + salt + apiKey;
  console.log('- 签名字符串:', signString);
  console.log('- 字符串长度:', signString.length);
}

testAppAPICall().catch(console.error);
