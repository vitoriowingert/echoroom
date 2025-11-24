# 🐛 Debugging Style Issues

## Quick Diagnostic Steps:

### 1. **Check Browser Console**
   Open DevTools (F12) and look for:
   - Any JavaScript errors
   - The diagnostic message: `🔍 Discord color test:` 
   - Check if `bg-discord-dark` is being applied

### 2. **Verify You're on the Right Port**
   - Frontend dev server: `http://localhost:3000`
   - NOT `http://localhost:3003` or `http://localhost:5173`

### 3. **Check Network Tab**
   - Open DevTools → Network tab
   - Refresh the page
   - Look for `index.css` or CSS files
   - Check if they're loading (status 200)
   - Check the file size (should be > 50KB if Tailwind is working)

### 4. **Inspect Element**
   - Right-click on the sidebar → Inspect
   - Check the computed styles
   - Look for `background-color` on elements with `bg-discord-dark`
   - Should see: `rgb(47, 49, 54)` or `#2f3136`

### 5. **Check Tailwind is Processing**
   In the browser console, run:
   ```javascript
   // Check if Tailwind classes exist
   const test = document.createElement('div');
   test.className = 'bg-discord-dark';
   document.body.appendChild(test);
   const style = window.getComputedStyle(test);
   console.log('Discord dark color:', style.backgroundColor);
   document.body.removeChild(test);
   ```

### 6. **Force Full Reload**
   ```bash
   # Stop dev server (Ctrl+C)
   cd frontend
   rm -rf node_modules/.vite
   npm run dev
   ```

### 7. **Check Tailwind Config is Loaded**
   The config should have these colors:
   - `discord.dark: '#2f3136'`
   - `discord.darker: '#292b2f'`
   - `discord.darkest: '#202225'`

### 8. **Verify CSS Import**
   Check `src/main.tsx` should have:
   ```typescript
   import './styles/index.css';
   ```

## Common Issues:

### Issue: Styles not updating
**Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

### Issue: Wrong colors showing
**Solution:** Check if Tailwind config is being read. Restart dev server.

### Issue: No styles at all
**Solution:** Check if `index.css` is imported in `main.tsx`

### Issue: Dev server not running
**Solution:** 
```bash
cd frontend
npm run dev
```

## What Should You See:

✅ **Server sidebar (left)**: Dark gray background (`#202225`)
✅ **Channel sidebar (middle)**: Medium gray (`#2f3136`)
✅ **Main chat area**: Light gray (`#36393f`)
✅ **Text**: White/light gray
✅ **Hover effects**: Smooth transitions

If you see different colors, the styles aren't loading correctly.

