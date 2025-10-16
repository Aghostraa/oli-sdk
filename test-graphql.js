// Quick test to see actual GraphQL response
const fetch = require('node-fetch');

async function test() {
  const query = `
    query Attestations($take: Int, $where: AttestationWhereInput, $orderBy: [AttestationOrderByWithRelationInput!]) {
      attestations(take: $take, where: $where, orderBy: $orderBy) {
        attester
        decodedDataJson
        id
        recipient
        timeCreated
      }
    }
  `;
  
  const variables = {
    where: {
      schemaId: {
        equals: '0x3969bb076acfb992af54d51274c5c868641ca5344e1aacd0b1f5e4f80ac0822f'
      }
    },
    orderBy: [{ timeCreated: 'desc' }],
    take: 2
  };
  
  const response = await fetch('https://base.easscan.org/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.data?.attestations?.[0]?.decodedDataJson) {
    console.log('\n\nFirst decodedDataJson:');
    console.log(data.data.attestations[0].decodedDataJson);
    
    console.log('\n\nParsed:');
    const parsed = JSON.parse(data.data.attestations[0].decodedDataJson);
    console.log(JSON.stringify(parsed, null, 2));
  }
}

test().catch(console.error);
