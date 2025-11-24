# 🔧 Troubleshooting: Styles Not Showing

## IMMEDIATE FIX - Try These in Order:

### Step 1: Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`
- **OR** Open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

### Step 2: Verify URL
Make sure you're accessing: **`http://localhost:3000`**
NOT `localhost:3003` or `localhost:5173`

### Step 3: Check Dev Server is Running
Look at your terminal - you should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

### Step 4: Restart Dev Server
```bash
# In terminal, press Ctrl+C to stop
cd frontend
npm run dev
```

### Step 5: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Look for Vite HMR messages

### Step 6: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for `index.css` or CSS files
5. Check if status is 200 (success)

### Step 7: Inspect Element
1. Right-click on the sidebar (left side)
2. Select "Inspect"
3. Look at the computed styles
4. Check `background-color` - should be `rgb(47, 49, 54)` or `#2f3136`

### Step 8: Try Incognito/Private Window
- Open browser in incognito/private mode
- Navigate to `http://localhost:3000`
- This rules out cache issues

## What Changed:

✅ **Colors**: Updated to Discord's exact palette
✅ **Channel categories**: Now collapsible
✅ **Spacing**: Better padding throughout
✅ **Typography**: Discord font stack
✅ **Hover effects**: Smooth transitions

## Still Not Working?

Run this in browser console (F12):
```javascript
// Test if Tailwind is working
const el = document.createElement('div');
el.className = 'bg-discord-dark p-4';
el.textContent = 'TEST';
document.body.appendChild(el);
const style = window.getComputedStyle(el);
console.log('Background color:', style.backgroundColor);
console.log('Padding:', style.padding);
// Should see: rgb(47, 49, 54) and padding > 0
```

If you see `rgb(0, 0, 0)` or no padding, Tailwind isn't loading.
