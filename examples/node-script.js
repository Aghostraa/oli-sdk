/**
 * Simple Node.js example using CommonJS (JavaScript)
 * This shows how to use the SDK without TypeScript
 */

const { OLIClient } = require('@openlabels/sdk');

async function main() {
  console.log('🚀 Initializing OLI SDK...\n');

  // Create and initialize client
  const oli = new OLIClient({ network: 'BASE' });
  await oli.init();

  console.log('✅ Client initialized!\n');

  // Get available tags
  console.log('📋 Available Tags:');
  const tagIds = oli.getTagIds();
  console.log('  Total tags:', tagIds.length);
  console.log('  Tag IDs:', tagIds.slice(0, 5).join(', '), '...\n');

  // Get usage categories
  console.log('🎯 Usage Categories:');
  const categories = oli.getValidValues('usage_category');
  if (categories) {
    console.log('  Count:', categories.length);
    console.log('  Examples:', categories.slice(0, 10).join(', '));
  }
  console.log('');

  // Get owner projects
  console.log('🏢 Owner Projects:');
  const projects = oli.getValidValues('owner_project');
  if (projects) {
    console.log('  Count:', projects.length);
    console.log('  Examples:', projects.slice(0, 10).join(', '));
  }
  console.log('');

  // Query some recent labels
  console.log('🔍 Fetching recent labels...');
  try {
    const result = await oli.graphql.queryAttestations({ take: 3 });
    console.log(`  Found ${result.data.attestations.length} recent labels`);
    
    result.data.attestations.forEach((label, idx) => {
      console.log(`\n  Label ${idx + 1}:`);
      console.log(`    Address: ${label.recipient}`);
      console.log(`    Name: ${label.contract_name || label.address_name || 'N/A'}`);
      console.log(`    Category: ${label.usage_category || 'N/A'}`);
      console.log(`    Attester: ${label.attester}`);
      console.log(`    Date: ${new Date(label.timeCreated * 1000).toLocaleString()}`);
    });
  } catch (error) {
    console.log('  Error:', error.message);
  }
  console.log('');

  console.log('🎉 Done!');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

