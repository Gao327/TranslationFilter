const puppeteer = require('puppeteer');

async function testWebInterface() {
  console.log('🌐 开始测试Web界面...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // 监听控制台日志
  page.on('console', msg => {
    console.log('📱 浏览器控制台:', msg.text());
  });
  
  // 监听网络请求
  page.on('request', request => {
    console.log('📡 网络请求:', request.method(), request.url());
  });
  
  // 监听网络响应
  page.on('response', response => {
    console.log('📡 网络响应:', response.status(), response.url());
  });
  
  try {
    console.log('🔗 正在访问应用...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    console.log('✅ 应用加载完成');
    
    // 等待页面完全加载
    await page.waitForTimeout(2000);
    
    // 检查页面标题
    const title = await page.title();
    console.log('📄 页面标题:', title);
    
    // 检查是否有翻译相关的元素
    const textTranslateLink = await page.$('a[href="/text-translate"]');
    if (textTranslateLink) {
      console.log('✅ 找到文本翻译链接');
      
      // 点击文本翻译
      await textTranslateLink.click();
      await page.waitForTimeout(1000);
      
      console.log('🔍 检查文本翻译页面...');
      
      // 查找输入框
      const sourceTextarea = await page.$('textarea[placeholder*="输入要翻译的文本"]');
      if (sourceTextarea) {
        console.log('✅ 找到源文本输入框');
        
        // 输入测试文本
        await sourceTextarea.type('Hello world');
        console.log('📝 输入测试文本: Hello world');
        
        // 查找翻译按钮
        const translateButton = await page.$('button:contains("翻译")');
        if (translateButton) {
          console.log('✅ 找到翻译按钮');
          
          // 点击翻译
          await translateButton.click();
          console.log('🔄 点击翻译按钮');
          
          // 等待翻译结果
          await page.waitForTimeout(3000);
          
          // 检查是否有结果或错误
          const resultArea = await page.$('[data-testid="translation-result"]') || 
                           await page.$('.translation-result') ||
                           await page.$('.result-area');
          
          if (resultArea) {
            const resultText = await resultArea.textContent();
            console.log('📋 翻译结果:', resultText);
          } else {
            console.log('❌ 未找到翻译结果区域');
          }
          
          // 检查是否有错误信息
          const errorElement = await page.$('.error-message') || 
                             await page.$('[data-testid="error"]') ||
                             await page.$('.alert-error');
          
          if (errorElement) {
            const errorText = await errorElement.textContent();
            console.log('❌ 错误信息:', errorText);
          }
          
        } else {
          console.log('❌ 未找到翻译按钮');
        }
      } else {
        console.log('❌ 未找到源文本输入框');
      }
    } else {
      console.log('❌ 未找到文本翻译链接');
    }
    
    // 检查设置页面
    console.log('🔧 检查设置页面...');
    const settingsLink = await page.$('a[href="/settings"]');
    if (settingsLink) {
      await settingsLink.click();
      await page.waitForTimeout(1000);
      
      // 检查翻译模型设置
      const modelSelector = await page.$('select[name="preferredModel"]') || 
                          await page.$('[data-testid="model-selector"]');
      
      if (modelSelector) {
        const selectedValue = await modelSelector.evaluate(el => el.value);
        console.log('🎯 当前选择的翻译模型:', selectedValue);
        
        // 检查是否有百度选项
        const baiduOption = await page.$('option[value="baidu"]');
        if (baiduOption) {
          console.log('✅ 找到百度翻译选项');
        } else {
          console.log('❌ 未找到百度翻译选项');
        }
      } else {
        console.log('❌ 未找到模型选择器');
      }
    }
    
    console.log('✅ Web界面测试完成');
    
  } catch (error) {
    console.error('❌ Web界面测试失败:', error.message);
  } finally {
    // 保持浏览器打开以便手动检查
    console.log('🔍 浏览器保持打开状态，请手动检查...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // 等待30秒
    await browser.close();
  }
}

// 检查puppeteer是否可用
try {
  require('puppeteer');
  testWebInterface().catch(console.error);
} catch (error) {
  console.log('❌ Puppeteer未安装，使用curl测试...');
  
  // 使用curl测试基本功能
  const { exec } = require('child_process');
  
  console.log('🔍 测试应用基本响应...');
  exec('curl -s "http://localhost:5173" | head -20', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ 应用响应测试失败:', error.message);
    } else {
      console.log('📄 应用响应内容:');
      console.log(stdout);
    }
  });
  
  console.log('🔍 测试翻译API端点...');
  exec('curl -s "http://localhost:5173/api/baidu/api/trans/vip/translate"', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ API端点测试失败:', error.message);
    } else {
      console.log('📡 API端点响应:', stdout);
    }
  });
}
