import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testWebInterface() {
  console.log('🌐 开始测试Web界面...');
  
  try {
    // 测试应用基本响应
    console.log('🔍 测试应用基本响应...');
    const { stdout: appResponse } = await execAsync('curl -s "http://localhost:5173" | head -20');
    console.log('📄 应用响应内容:');
    console.log(appResponse);
    
    // 测试翻译API端点
    console.log('🔍 测试翻译API端点...');
    try {
      const { stdout: apiResponse } = await execAsync('curl -s "http://localhost:5173/api/baidu/api/trans/vip/translate"');
      console.log('📡 API端点响应:', apiResponse);
    } catch (apiError) {
      console.log('📡 API端点响应:', apiError.message);
    }
    
    // 测试应用路由
    console.log('🔍 测试应用路由...');
    const routes = ['/text-translate', '/settings', '/language-settings'];
    
    for (const route of routes) {
      try {
        const { stdout: routeResponse } = await execAsync(`curl -s "http://localhost:5173${route}" | head -10`);
        console.log(`📍 路由 ${route}:`, routeResponse.substring(0, 100) + '...');
      } catch (routeError) {
        console.log(`📍 路由 ${route}: 错误 - ${routeError.message}`);
      }
    }
    
    // 检查开发服务器日志
    console.log('🔍 检查开发服务器状态...');
    try {
      const { stdout: processInfo } = await execAsync('ps aux | grep "npm run dev" | grep -v grep');
      if (processInfo) {
        console.log('✅ 开发服务器正在运行');
        console.log(processInfo);
      } else {
        console.log('❌ 开发服务器未运行');
      }
    } catch (processError) {
      console.log('❌ 无法检查进程状态:', processError.message);
    }
    
    console.log('✅ Web界面测试完成');
    
  } catch (error) {
    console.error('❌ Web界面测试失败:', error.message);
  }
}

testWebInterface().catch(console.error);
