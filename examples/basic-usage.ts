/**
 * Basic usage example for OLI SDK
 */

import { OLIClient } from '../src';

async function main() {
  console.log('🚀 Initializing OLI SDK...\n');

  // Create and initialize client
  const oli = new OLIClient({ network: 'BASE' });
  await oli.init();

  console.log('✅ Client initialized!\n');

  // Example 1: Get tag definitions
  console.log('📋 Available Tags:');
  const tagIds = oli.getTagIds();
  tagIds.forEach(tagId => {
    const tag = oli.getTag(tagId);
    console.log(`  - ${tag?.display_name} (${tagId})`);
  });
  console.log('');

  // Example 2: Get value sets
  console.log('🎯 Usage Categories:');
  const categories = oli.getValidValues('usage_category');
  console.log('  ', categories?.join(', '));
  console.log('');

  // Example 3: Query labels for an address
  console.log('🔍 Querying labels for an address...');
  try {
    const result = await oli.graphql.getLabelsForAddress(
      '0x0000000000000000000000000000000000000000', // Example address
      { take: 5 }
    );

    console.log(`  Found ${result.data.attestations.length} labels`);
    
    if (result.data.attestations.length > 0) {
      const firstLabel = result.data.attestations[0];
      console.log('\n  First label details:');
      console.log(`    Name: ${firstLabel.contract_name || firstLabel.address_name || 'N/A'}`);
      console.log(`    Category: ${firstLabel.usage_category || 'N/A'}`);
      console.log(`    Attester: ${firstLabel.attester}`);
      console.log(`    Time: ${new Date(firstLabel.timeCreated * 1000).toISOString()}`);
    }
  } catch (error) {
    console.log('  No labels found or error occurred');
  }
  console.log('');

  // Example 4: Validate values
  console.log('✓ Validation Examples:');
  console.log(`  Is "dex" a valid usage_category? ${oli.validateValue('usage_category', 'dex')}`);
  console.log(`  Is "invalid" a valid usage_category? ${oli.validateValue('usage_category', 'invalid')}`);
  console.log('');

  console.log('🎉 Done!');
}

main().catch(console.error);

