# OLI SDK Examples

This directory contains example code demonstrating how to use the OLI SDK in different scenarios.

## Examples

### Basic Usage (`basic-usage.ts`)

A simple Node.js script showing the core features of the SDK:
- Initializing the client
- Fetching tag definitions
- Querying labels for addresses
- Validating values

Run it:
```bash
npm install
npm run basic
```

### React Example (`react-example.tsx`)

React components demonstrating frontend integration:
- `useOLI()` - Custom hook for OLI client
- `<AddressLabel />` - Display label for an address
- `<TagBrowser />` - Browse available tags
- `<AddressLookup />` - Search interface for labels

To use in your React app:
```bash
npm install @openlabels/sdk
```

Then copy the components and adapt to your needs.

## Running Examples

1. Install dependencies:
```bash
npm install
```

2. Run the basic example:
```bash
npm run basic
```

3. For React examples, copy the components into your React project.

## More Examples

For more examples and use cases, check the main [OLI SDK documentation](../README.md).

