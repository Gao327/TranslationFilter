# Manual UI Testing Guide

## Current Status
✅ App is running at http://localhost:5173
✅ Development server is active
❌ Baidu API returns UNAUTHORIZED USER (error_code: 52003)

## Manual Testing Steps

### 1. Open the App
- Navigate to http://localhost:5173 in Chrome
- The app should load with the main interface

### 2. Check Settings
- Click on Settings (gear icon) or navigate to /settings
- Verify that "Baidu 翻译" is selected as the preferred model
- Check if the model selector shows "baidu" as selected

### 3. Test Text Translation
- Navigate to Text Translate page (/text-translate)
- Set source language to "English" (en)
- Set target language to "Chinese" (zh)
- Enter text: "Hello world"
- Click the translate button

### 4. Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for any error messages or logs
- Check Network tab for failed API calls

### 5. Expected Behavior
- Should see console logs from our translation service
- Should see network request to /api/baidu/api/trans/vip/translate
- Should get error response with UNAUTHORIZED USER

## Debugging Steps

### Check Environment Variables
The app should be using these hardcoded values:
- APP ID: 20250816002432414
- API Key: b3a1JQGV7LUYIEVti14j

### Check API Request
The request should include:
- q: Hello world
- from: en
- to: zh
- appid: 20250816002432414
- salt: [random number]
- sign: [MD5 hash]

### Common Issues
1. **UNAUTHORIZED USER (52003)**: Usually means wrong appid or API key
2. **Invalid Sign (54001)**: MD5 signature calculation error
3. **Query too long (54004)**: Text exceeds length limit
4. **Invalid language (58001)**: Unsupported language code

## Next Steps
After manual testing, we can:
1. Verify the exact error in browser console
2. Check if the API request is properly formatted
3. Validate the signature calculation
4. Test with the working test-translation.js credentials
