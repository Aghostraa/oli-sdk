# Schema Evolution & Backward Compatibility Guide

## Overview

The OLI SDK is designed to be **resilient to schema changes** while providing **helpful type safety**. This guide explains how the SDK handles changes to the OLI tag schema.

## 🎯 Core Design Philosophy

The SDK follows a **"Progressive Enhancement"** approach:

1. **Dynamic at Runtime** - The SDK works with ANY tags, regardless of whether they're in our type definitions
2. **Typed for Convenience** - Common tags get TypeScript types for better DX
3. **Never Breaking** - Schema changes don't break your code
4. **Documentation as Code** - Types serve as inline documentation

## 📊 Impact of Schema Changes

### Scenario 1: New Tag Added to OLI Schema

**What Happens:**
```typescript
// OLI adds a new tag: "security_audit_date"
const label = await oli.graphql.getBestLabelForAddress('0x...');

// ✅ Works immediately - data is available
console.log(label['security_audit_date']); // Works!

// ❌ No autocomplete yet (until SDK update)
console.log(label.security_audit_date); // Works, but no IDE suggestion
```

**Impact:** ✅ **Non-Breaking**
- Data is accessible immediately
- No autocomplete until SDK update
- Can use dynamic access: `label['field_name']`

**Resolution:** Update `CommonOLITags` in next SDK release

---

### Scenario 2: Tag Deleted from OLI Schema

**What Happens:**
```typescript
// OLI removes the "old_deprecated_field" tag
const label = await oli.graphql.getBestLabelForAddress('0x...');

// Field still in CommonOLITags (until SDK update)
console.log(label.old_deprecated_field); // undefined (not an error)
```

**Impact:** ✅ **Non-Breaking**
- Code doesn't crash
- Field is just `undefined`
- TypeScript won't error (it's optional)

**Resolution:** 
- Remove from `CommonOLITags` in next SDK release
- Document deprecation in CHANGELOG

---

### Scenario 3: Tag Renamed in OLI Schema

**What Happens:**
```typescript
// OLI renames "contract_name" → "smart_contract_name"
const label = await oli.graphql.getBestLabelForAddress('0x...');

// Old name
console.log(label.contract_name); // undefined (but no error)

// New name (works immediately)
console.log(label['smart_contract_name']); // ✅ Works!
console.log(label.smart_contract_name); // ❌ No autocomplete yet
```

**Impact:** ⚠️ **Potentially Confusing** (but not breaking)
- Old field becomes `undefined`
- New field works via dynamic access
- Autocomplete suggests old name until SDK update

**Resolution:**
- Update `CommonOLITags` in next SDK release
- Add deprecation notice in CHANGELOG
- Consider keeping both names temporarily with `@deprecated` JSDoc

---

### Scenario 4: Tag Type Changed

**What Happens:**
```typescript
// OLI changes "deployment_block" from number → string
const label = await oli.graphql.getBestLabelForAddress('0x...');

// TypeScript thinks it's a number (until SDK update)
const block: number = label.deployment_block; // Runtime: might be string!
```

**Impact:** ⚠️ **Runtime Type Mismatch**
- TypeScript types don't match runtime data
- Can cause issues if code assumes specific type

**Resolution:**
- Update type in `CommonOLITags` immediately
- Document in CHANGELOG as potentially breaking

---

## 🛡️ Best Practices for Resilient Code

### 1. Always Check for Existence

```typescript
const label = await oli.graphql.getBestLabelForAddress('0x...');

// ✅ Good - defensive
if (label?.contract_name) {
  console.log(label.contract_name);
}

// ✅ Good - with fallback
const name = label?.contract_name ?? 'Unknown';

// ❌ Risky - assumes field exists
console.log(label.contract_name.toUpperCase());
```

### 2. Use Helper Functions

```typescript
import { hasTag, getAvailableTags } from '@openlabels/sdk';

const label = await oli.graphql.getBestLabelForAddress('0x...');

// Check if a tag exists before using it
if (hasTag(label, 'contract_name')) {
  console.log('Contract name:', label.contract_name);
}

// Discover what tags are actually available
const tags = getAvailableTags(label);
console.log('Available tags:', tags);
```

### 3. Use Dynamic Access for Uncertain Fields

```typescript
// If you're not sure a field is in CommonOLITags, use dynamic access
const customField = label['my_custom_field'];
const newField = label['recently_added_field'];

// This always works regardless of type definitions
```

### 4. Validate Types at Runtime (when critical)

```typescript
const block = label.deployment_block;

// If the type is critical, validate it
if (typeof block === 'number') {
  // Safe to use as number
  console.log(`Block: ${block}`);
} else if (typeof block === 'string') {
  // Handle string case
  console.log(`Block: ${parseInt(block)}`);
}
```

## 🔄 SDK Update Process for Schema Changes

When OLI schema changes, the SDK follows this process:

### Minor Schema Changes (New tags, optional fields)
- Update `CommonOLITags` interface
- Add JSDoc documentation
- Release as **MINOR** version (e.g., 1.2.0 → 1.3.0)
- Document in CHANGELOG

### Breaking Schema Changes (Removed/renamed tags, type changes)
- Update `CommonOLITags` interface
- Add deprecation notices
- Document migration path
- Release as **MAJOR** version (e.g., 1.2.0 → 2.0.0)
- Update CHANGELOG with migration guide

### Tag Deprecation Process
1. Add `@deprecated` JSDoc to field
2. Keep field for 1-2 major versions
3. Document recommended alternative
4. Eventually remove in major version

Example:
```typescript
export interface CommonOLITags {
  /**
   * @deprecated Use `smart_contract_name` instead. Will be removed in v3.0.0
   */
  contract_name?: string;
  
  /** New field replacing contract_name */
  smart_contract_name?: string;
}
```

## 📦 Versioning Strategy

The SDK uses **Semantic Versioning**:

- **PATCH** (1.0.x): Bug fixes, documentation
- **MINOR** (1.x.0): New features, new tags added to types
- **MAJOR** (x.0.0): Breaking changes, removed/renamed tags

## 🧪 Testing Schema Changes

Before releasing SDK updates for schema changes:

1. Test with real addresses that have the new/changed tags
2. Verify backward compatibility with old code
3. Check that dynamic access still works
4. Update test scripts

## 📝 Summary

**Key Takeaways:**

✅ **The SDK is resilient** - Schema changes won't break your code
✅ **Use defensive coding** - Always check for field existence
✅ **Dynamic access works** - You can access ANY field, regardless of types
✅ **Types are helpers** - They provide convenience, not strict contracts
✅ **Stay updated** - Keep SDK updated for best type support

**Bottom Line:** The OLI SDK remains **fully dynamic and flexible** while providing **helpful type hints** for common cases. Your code won't break when OLI schema evolves!



