# UI Translation Flow Test Guide

## Test Steps

### 1. Open the App
- Navigate to http://localhost:5173
- The app should load without errors

### 2. Check Settings
- Click on "设置" (Settings)
- Verify "首选翻译模型" is set to "Baidu 翻译"
- If not, change it to "Baidu 翻译"

### 3. Test Text Translation
- Go to "文本翻译" (Text Translation)
- Set source language to "English" 
- Set target language to "中文"
- Enter text: "Hello world"
- Click "翻译" (Translate)
- Check console for any errors
- Verify translation appears

### 4. Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for any error messages
- Look for translation service logs

### 5. Check Network Tab
- Go to Network tab in DevTools
- Try translation again
- Look for requests to `/api/baidu/api/trans/vip/translate`
- Check response status and data

### 6. Test Language Detection
- Set source language to "自动检测" (Auto Detect)
- Enter Chinese text: "这是什么"
- Set target to "English"
- Click translate
- Verify language detection works

## Expected Results

✅ **App loads without errors**
✅ **Settings show Baidu as default model**
✅ **Translation requests go to `/api/baidu/...`**
✅ **Responses come from Baidu API**
✅ **Translations appear correctly**
✅ **Language detection works**

## Common Issues to Check

1. **Model not set to Baidu**: Check Settings page
2. **Proxy not working**: Check Network tab for 404s
3. **API errors**: Check console for Baidu error codes
4. **CORS issues**: Check for CORS errors in console
5. **Service not loading**: Check for import errors

## Debug Commands

```bash
# Check if dev server is running
curl http://localhost:5173

# Test proxy endpoint
curl -X POST "http://localhost:5173/api/baidu/api/trans/vip/translate" \
  -d "q=test&from=en&to=zh&appid=20250816002432414&salt=123&sign=test" \
  -H "Content-Type: application/x-www-form-urlencoded"

# Check Vite proxy config
cat vite.config.ts | grep -A 10 "proxy"
```

## Next Steps

If tests pass:
- Deploy to Vercel
- Test production deployment
- Verify Vercel rewrite works

If tests fail:
- Check console errors
- Verify service configuration
- Test individual components
