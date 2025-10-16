/**
 * Advanced usage example showcasing all developer experience features
 */

import { OLIClient, helpers } from '../src';

async function main() {
  console.log('🚀 Advanced OLI SDK Features\n');

  // =============================================================================
  // EXAMPLE 1: Basic Configuration with Trusted Attesters
  // =============================================================================
  console.log('═══ Example 1: Configured Client ═══\n');

  const oli = new OLIClient({
    network: 'BASE',
    
    // Trust configuration - only show labels from specific attesters
    attesters: {
      trustedAttesters: [
        '0xA725646c05e6Bb813d98C5aBB4E72DF4bcF00B56', // Example trusted attester
      ],
      // Or use priority ranking
      attesterPriority: [
        '0xA725646c05e6Bb813d98C5aBB4E72DF4bcF00B56',
        '0xC139d50144Ee873c8577d682628E045dECe6040E',
      ]
    },
    
    // Display preferences
    display: {
      nameFields: ['contract_name', 'address_name', 'erc20.name'],
      addressFormat: 'short', // 'short' | 'medium' | 'full'
      dateFormat: 'relative',  // 'relative' | 'absolute' | 'timestamp'
      showRevoked: false
    },
    
    // Filter defaults
    filters: {
      allowedCategories: ['dex', 'bridge', 'nft_marketplace'],
      // Or exclude specific categories
      // excludedCategories: ['spam', 'scam'],
      
      // Only show labels from specific projects
      // allowedProjects: ['uniswap', 'aave'],
      
      // Age filters (in seconds)
      // minAge: 86400,      // At least 1 day old
      // maxAge: 31536000,   // Not older than 1 year
    },
    
    // Enable automatic label ranking
    autoRank: true
  });

  await oli.init();
  console.log('✅ Client initialized with custom configuration\n');

  // =============================================================================
  // EXAMPLE 2: Simple Display Name Lookup (Plug & Play)
  // =============================================================================
  console.log('\n═══ Example 2: Simple Display Name ═══\n');

  const address1 = '0x63F6e67F416A492826F1714a2EF40645fF4ce169';
  
  // Most convenient method - just get a name!
  const name = await oli.graphql.getDisplayName(address1);
  console.log(`Address: ${address1}`);
  console.log(`Display Name: ${name}`);
  // Output: "TradingBot" (or formatted address if no label)

  // =============================================================================
  // EXAMPLE 3: Get Address Summary (All formatted info in one call)
  // =============================================================================
  console.log('\n═══ Example 3: Address Summary ═══\n');

  const summary = await oli.graphql.getAddressSummary(address1);
  if (summary) {
    console.log('📋 Summary:');
    console.log(`  Name: ${summary.name}`);
    console.log(`  Category: ${summary.category}`);
    console.log(`  Project: ${summary.project}`);
    console.log(`  Address: ${summary.formattedAddress}`);
    console.log(`  Attester: ${summary.formattedAttester}`);
    console.log(`  Created: ${summary.formattedDate}`);
    console.log(`  Valid: ${summary.isValid ? '✅' : '❌'}`);
    console.log(`  All Fields:`, JSON.stringify(summary.fields, null, 2));
  }

  // =============================================================================
  // EXAMPLE 4: Get Best Label (Automatically filtered & ranked)
  // =============================================================================
  console.log('\n═══ Example 4: Best Label (Auto-filtered) ═══\n');

  const bestLabel = await oli.graphql.getBestLabelForAddress(address1);
  if (bestLabel) {
    console.log('🏆 Best Label:');
    console.log(`  Name: ${helpers.getDisplayName(bestLabel, oli.displayConfig)}`);
    console.log(`  Category: ${bestLabel.usage_category}`);
    console.log(`  Trusted: ${helpers.isAttesterTrusted(bestLabel.attester, oli.attesterConfig) ? '✅' : '❌'}`);
  }

  // =============================================================================
  // EXAMPLE 5: Get All Valid Labels (Filtered & Ranked)
  // =============================================================================
  console.log('\n═══ Example 5: All Valid Labels ═══\n');

  const validLabels = await oli.graphql.getValidLabelsForAddress(address1);
  console.log(`Found ${validLabels.length} valid labels (filtered & ranked):`);
  
  validLabels.forEach((label, idx) => {
    console.log(`\n  ${idx + 1}. ${helpers.getDisplayName(label, oli.displayConfig)}`);
    console.log(`     Category: ${label.usage_category || 'N/A'}`);
    console.log(`     Valid: ${helpers.isLabelValid(label) ? '✅' : '❌'}`);
    console.log(`     Age: ${helpers.formatTimestamp(label.timeCreated, 'relative')}`);
  });

  // =============================================================================
  // EXAMPLE 6: Using Helper Functions Directly
  // =============================================================================
  console.log('\n═══ Example 6: Helper Functions ═══\n');

  // Get raw labels
  const rawResult = await oli.graphql.getLabelsForAddress(address1);
  const labels = rawResult.data.attestations;

  if (labels.length > 0) {
    const label = labels[0];
    
    console.log('🔧 Helper Functions:');
    
    // Format address in different ways
    console.log(`  Address (short): ${helpers.formatAddress(label.recipient, 'short')}`);
    console.log(`  Address (medium): ${helpers.formatAddress(label.recipient, 'medium')}`);
    console.log(`  Address (full): ${helpers.formatAddress(label.recipient, 'full')}`);
    
    // Format timestamps
    console.log(`  Time (relative): ${helpers.formatTimestamp(label.timeCreated, 'relative')}`);
    console.log(`  Time (absolute): ${helpers.formatTimestamp(label.timeCreated, 'absolute')}`);
    console.log(`  Time (timestamp): ${helpers.formatTimestamp(label.timeCreated, 'timestamp')}`);
    
    // Check attester trust
    console.log(`  Attester trusted: ${helpers.isAttesterTrusted(label.attester, oli.attesterConfig)}`);
    
    // Check label validity
    console.log(`  Label valid: ${helpers.isLabelValid(label)}`);
  }

  // =============================================================================
  // EXAMPLE 7: Filter and Rank Labels Manually
  // =============================================================================
  console.log('\n═══ Example 7: Manual Filtering & Ranking ═══\n');

  const allLabels = rawResult.data.attestations;
  
  // Filter by custom criteria
  const dexLabels = helpers.filterLabels(allLabels, {
    allowedCategories: ['dex'],
    maxAge: 31536000 // 1 year
  });
  console.log(`DEX labels: ${dexLabels.length}`);
  
  // Rank labels
  const rankedLabels = helpers.rankLabels(allLabels, {
    attesterPriority: [
      '0xA725646c05e6Bb813d98C5aBB4E72DF4bcF00B56'
    ]
  });
  console.log(`Ranked labels: ${rankedLabels.length}`);

  // =============================================================================
  // EXAMPLE 8: React Component Example
  // =============================================================================
  console.log('\n═══ Example 8: React Component Pattern ═══\n');
  
  console.log('Sample React component code:');
  console.log(`
// AddressDisplay.tsx
import { useEffect, useState } from 'react';
import { OLIClient, helpers } from '@openlabels/sdk';

function AddressDisplay({ address }: { address: string }) {
  const [name, setName] = useState<string>('');
  
  useEffect(() => {
    const oli = new OLIClient({
      network: 'BASE',
      attesters: {
        trustedAttesters: ['0x...'] // Your trusted attesters
      }
    });
    
    oli.init().then(async () => {
      // Just one line to get the display name!
      const displayName = await oli.graphql.getDisplayName(address);
      setName(displayName);
    });
  }, [address]);
  
  return <span>{name}</span>;
}
  `);

  // =============================================================================
  // EXAMPLE 9: Building a Label Explorer
  // =============================================================================
  console.log('\n═══ Example 9: Label Explorer Pattern ═══\n');
  
  console.log('Building a label explorer with grouped data:');
  
  const recentLabels = await oli.graphql.queryAttestations({ take: 20 });
  const grouped = new Map<string, typeof recentLabels.data.attestations>();
  
  recentLabels.data.attestations.forEach(label => {
    const category = label.usage_category || 'uncategorized';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(label);
  });
  
  console.log(`\nLabels grouped by category:`);
  grouped.forEach((labels, category) => {
    console.log(`  ${category}: ${labels.length} labels`);
  });

  console.log('\n🎉 Done!');
}

main().catch(console.error);

