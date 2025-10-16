# Testing the OLI SDK

This guide shows you different ways to test the OLI SDK locally.

## Option 1: Simple HTML Test Page (Recommended)

### Step 1: Build the SDK

```bash
cd oli-sdk
npm install
npm run build
```

### Step 2: Start a local server

You need a local server because ES modules require HTTP(S) protocol:

```bash
# Option A: Using npx (no install needed)
npx serve .

# Option B: Using Python
python -m http.server 3000

# Option C: Using Node.js http-server
npm install -g http-server
http-server
```

### Step 3: Open the test page

Open your browser and go to:
```
http://localhost:3000/test.html
```

You should see:
- ✅ SDK initialization status
- 🔍 Address search box
- 📋 List of available tags
- 🎯 Value sets (categories, projects)
- 📊 Recent labels button

### Step 4: Test features

1. **Search for an address**: Enter any Ethereum address in the search box
2. **Load recent labels**: Click the "Load Recent Labels" button
3. **Explore tags**: Scroll down to see all available tags
4. **Check value sets**: See all valid usage categories and projects

## Option 2: Node.js Script

### Quick test with Node.js:

```bash
cd oli-sdk
npm install
npm run build

# Create a test script
node -e "
const { OLIClient } = require('./dist/index.js');

async function test() {
  const oli = new OLIClient();
  await oli.init();
  console.log('✅ Initialized!');
  console.log('Tags:', oli.getTagIds().length);
  
  const result = await oli.graphql.queryAttestations({ take: 3 });
  console.log('Labels:', result.data.attestations.length);
}

test().catch(console.error);
"
```

## Option 3: React App

### Create a test React app:

```bash
# Create new React app
npx create-react-app oli-test-app
cd oli-test-app

# Install the SDK (local link)
npm install ../oli-sdk

# Or if published to npm:
# npm install @openlabels/sdk
```

### Edit `src/App.js`:

```jsx
import { useEffect, useState } from 'react';
import { OLIClient } from '@openlabels/sdk';

function App() {
  const [oli, setOli] = useState(null);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('0x0000000000000000000000000000000000000000');

  useEffect(() => {
    const init = async () => {
      const client = new OLIClient();
      await client.init();
      setOli(client);
      setLoading(false);
    };
    init();
  }, []);

  const searchAddress = async () => {
    if (!oli || !address) return;
    setLoading(true);
    try {
      const result = await oli.graphql.getLabelsForAddress(address);
      setLabels(result.data.attestations);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>OLI SDK Test</h1>
      <div>
        <input 
          type="text" 
          value={address}
          onChange={e => setAddress(e.target.value)}
          style={{ width: '400px', padding: '8px' }}
        />
        <button onClick={searchAddress} style={{ marginLeft: '10px', padding: '8px 16px' }}>
          Search
        </button>
      </div>
      
      <h2>Results: {labels.length} labels</h2>
      {labels.map(label => (
        <div key={label.id} style={{ 
          border: '1px solid #ccc', 
          padding: '10px', 
          margin: '10px 0',
          borderRadius: '4px'
        }}>
          <h3>{label.address_name || 'Unnamed'}</h3>
          <p>Category: {label.usage_category}</p>
          <p>Address: {label.recipient}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
```

### Run the React app:

```bash
npm start
```

## Option 4: Vite Test App (Fastest)

### Create a Vite app:

```bash
npm create vite@latest oli-test -- --template vanilla
cd oli-test
npm install
npm install ../oli-sdk
```

### Edit `main.js`:

```javascript
import { OLIClient } from '@openlabels/sdk';

async function main() {
  document.querySelector('#app').innerHTML = `
    <div>
      <h1>OLI SDK Test</h1>
      <div id="status">Initializing...</div>
      <input type="text" id="address" placeholder="Enter address" />
      <button id="search">Search</button>
      <div id="results"></div>
    </div>
  `;

  const oli = new OLIClient();
  await oli.init();
  
  document.querySelector('#status').textContent = '✅ Ready!';
  
  document.querySelector('#search').addEventListener('click', async () => {
    const address = document.querySelector('#address').value;
    const result = await oli.graphql.getLabelsForAddress(address);
    
    document.querySelector('#results').innerHTML = 
      result.data.attestations.map(l => `
        <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
          <h3>${l.address_name || 'Unnamed'}</h3>
          <p>${l.usage_category}</p>
        </div>
      `).join('');
  });
}

main();
```

### Run Vite:

```bash
npm run dev
```

Open http://localhost:5173

## Option 5: Browser Console

### Quick test in browser console:

1. Build the SDK: `npm run build`
2. Start server: `npx serve .`
3. Open `test.html` in browser
4. Open browser console (F12)
5. Try these commands:

```javascript
// The oli variable is already initialized

// Get tags
oli.getTagIds()

// Get categories
oli.getValidValues('usage_category')

// Search for labels
await oli.graphql.getLabelsForAddress('0x...')

// Get recent labels
await oli.graphql.queryAttestations({ take: 5 })
```

## Troubleshooting

### "Failed to fetch" or CORS errors

- Make sure you're using a local server (not `file://`)
- Use `npx serve .` or similar HTTP server

### "Cannot find module"

- Run `npm install` first
- Run `npm run build` to create dist files
- Check that `dist/index.mjs` exists

### "SDK not initialized"

- Make sure to call `await oli.init()` before using the client
- Check browser console for initialization errors

### No labels found

- Some addresses may not have labels yet
- Try the zero address: `0x0000000000000000000000000000000000000000`
- Check that you're on the correct network (BASE by default)

## Quick Commands Reference

```bash
# In oli-sdk directory

# Install and build
npm install && npm run build

# Test in Node.js
cd examples && npm install && npm run basic

# Start test server
npx serve .
# Then open: http://localhost:3000/test.html

# Watch mode (auto-rebuild on changes)
npm run dev
```

## Next Steps

Once everything works:
1. Test with real addresses from your application
2. Try different networks (BASE, OPTIMISM, ETHEREUM)
3. Test error handling with invalid addresses
4. Measure performance with bulk queries

Happy testing! 🚀

