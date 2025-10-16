/**
 * React example showing how to use OLI SDK in a React app
 */

import React, { useEffect, useState } from 'react';
import { OLIClient, ExpandedAttestation } from '../src';

// Custom hook for OLI client
function useOLI() {
  const [oli, setOli] = useState<OLIClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initOLI = async () => {
      try {
        const client = new OLIClient();
        await client.init();
        setOli(client);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setLoading(false);
      }
    };

    initOLI();
  }, []);

  return { oli, loading, error };
}

// Component to display address labels
interface AddressLabelProps {
  address: string;
}

export function AddressLabel({ address }: AddressLabelProps) {
  const [labels, setLabels] = useState<ExpandedAttestation[]>([]);
  const [loading, setLoading] = useState(true);
  const { oli } = useOLI();

  useEffect(() => {
    if (!oli) return;

    const fetchLabels = async () => {
      try {
        const result = await oli.graphql.getLabelsForAddress(address, { take: 5 });
        setLabels(result.data.attestations);
      } catch (err) {
        console.error('Failed to fetch labels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, [oli, address]);

  if (loading || !oli) {
    return <span className="loading">Loading...</span>;
  }

  if (labels.length === 0) {
    return <span className="address">{address.slice(0, 6)}...{address.slice(-4)}</span>;
  }

  const primaryLabel = labels[0];
  const name = primaryLabel.contract_name || primaryLabel.address_name || 'Unknown';

  return (
    <div className="address-label">
      <span className="label-name">{name}</span>
      <span className="label-category">{primaryLabel.usage_category}</span>
      {labels.length > 1 && (
        <span className="label-count">+{labels.length - 1} more</span>
      )}
    </div>
  );
}

// Component to display all available tags
export function TagBrowser() {
  const { oli, loading, error } = useOLI();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  if (loading) return <div>Loading tags...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!oli) return null;

  const tagIds = oli.getTagIds();

  return (
    <div className="tag-browser">
      <h2>Available Tags</h2>
      <div className="tag-list">
        {tagIds.map(tagId => {
          const tag = oli.getTag(tagId);
          if (!tag) return null;

          return (
            <div
              key={tagId}
              className="tag-item"
              onClick={() => setSelectedTag(tagId)}
            >
              <h3>{tag.display_name}</h3>
              <p>{tag.description}</p>
              {oli.getValidValues(tagId) && (
                <div className="tag-values">
                  <strong>Valid values:</strong>
                  <ul>
                    {oli.getValidValues(tagId)?.map(val => (
                      <li key={val}>{val}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Component for address lookup
export function AddressLookup() {
  const [address, setAddress] = useState('');
  const [labels, setLabels] = useState<ExpandedAttestation[]>([]);
  const [loading, setLoading] = useState(false);
  const { oli } = useOLI();

  const handleSearch = async () => {
    if (!oli || !address) return;

    setLoading(true);
    try {
      const result = await oli.graphql.getLabelsForAddress(address);
      setLabels(result.data.attestations);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="address-lookup">
      <h2>Address Lookup</h2>
      <div className="search-box">
        <input
          type="text"
          placeholder="Enter Ethereum address..."
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading || !oli}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {labels.length > 0 && (
        <div className="results">
          <h3>Found {labels.length} label(s)</h3>
          {labels.map(label => (
            <div key={label.id} className="label-result">
              <h4>{label.contract_name || label.address_name || 'Unnamed'}</h4>
              <p>Category: {label.usage_category}</p>
              <p>Attester: {label.attester}</p>
              <p>Created: {new Date(label.timeCreated * 1000).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

