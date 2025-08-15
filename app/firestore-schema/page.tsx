"use client";

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';

type Mode = 'auto' | 'collection' | 'document';

export default function FirestoreSchemaToolPage() {
  const [targetPath, setTargetPath] = useState('users');
  const [mode, setMode] = useState<Mode>('auto');
  const [sampleCount, setSampleCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // Browsing state
  const [rootCollections, setRootCollections] = useState<Array<{ id: string; path: string }>>([]);
  const [selectedRootCollection, setSelectedRootCollection] = useState<string>('');
  const [documentsLvl1, setDocumentsLvl1] = useState<Array<{ id: string; path: string }>>([]);
  const [selectedDocLvl1, setSelectedDocLvl1] = useState<string>('');
  const [subcollectionsLvl2, setSubcollectionsLvl2] = useState<Array<{ id: string; path: string }>>([]);
  const [selectedSubcollectionLvl2, setSelectedSubcollectionLvl2] = useState<string>('');
  const [documentsLvl2, setDocumentsLvl2] = useState<Array<{ id: string; path: string }>>([]);
  const [selectedDocLvl2, setSelectedDocLvl2] = useState<string>('');

  // Select fields from collection state
  const [selectCollectionPath, setSelectCollectionPath] = useState('');
  const [selectFields, setSelectFields] = useState('');
  const [selectLimit, setSelectLimit] = useState(200);
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [selectResult, setSelectResult] = useState<any[] | null>(null);
  const [selectSchema, setSelectSchema] = useState<any | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const isCollectionPath = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    return segments.length % 2 === 1;
  };

  const builtPath = useMemo(() => {
    // Build from selections if present; fall back to manual input
    const parts: string[] = [];
    if (selectedRootCollection) parts.push(selectedRootCollection);
    if (selectedDocLvl1) parts.push(selectedDocLvl1);
    if (selectedSubcollectionLvl2) parts.push(selectedSubcollectionLvl2);
    if (selectedDocLvl2) parts.push(selectedDocLvl2);
    if (parts.length > 0) return parts.join('/');
    return targetPath.trim();
  }, [selectedRootCollection, selectedDocLvl1, selectedSubcollectionLvl2, selectedDocLvl2, targetPath]);

  const collectionOptions = useMemo(() => {
    const options: Array<{ label: string; value: string }> = [];
    // Root collections
    for (const c of rootCollections) {
      options.push({ label: c.id, value: c.id });
    }
    // Subcollections under selected doc level 1
    if (selectedRootCollection && selectedDocLvl1 && subcollectionsLvl2.length > 0) {
      for (const sc of subcollectionsLvl2) {
        const fullPath = `${selectedRootCollection}/${selectedDocLvl1}/${sc.id}`;
        options.push({ label: fullPath, value: fullPath });
      }
    }
    // Add current builtPath if it's a collection and not already present
    const path = builtPath.trim();
    if (path && isCollectionPath(path) && !options.some((o) => o.value === path)) {
      options.push({ label: path, value: path });
    }
    return options;
  }, [rootCollections, selectedRootCollection, selectedDocLvl1, subcollectionsLvl2, builtPath]);

  const availableFields = useMemo(() => {
    const fields: string[] = [];
    const seen = new Set<string>();
    const add = (k: string) => { if (!seen.has(k)) { seen.add(k); fields.push(k); } };
    const flatten = (node: any, prefix = '') => {
      if (!node) return;
      if (node.kind === 'object' && node.fields) {
        for (const [key, meta] of Object.entries<any>(node.fields)) {
          const full = prefix ? `${prefix}.${key}` : key;
          add(full);
          if (meta?.schema?.kind === 'object') flatten(meta.schema, full);
        }
      }
    };
    if (selectSchema?.schema) flatten(selectSchema.schema);
    return fields.sort();
  }, [selectSchema]);

  type FieldNode = {
    name: string;
    path: string;
    children?: FieldNode[];
  };

  const schemaToFieldTree = (schemaNode: any, prefix = ''): FieldNode[] => {
    if (!schemaNode || schemaNode.kind !== 'object' || !schemaNode.fields) return [];
    const nodes: FieldNode[] = [];
    for (const [key, meta] of Object.entries<any>(schemaNode.fields)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const isObject = meta?.schema?.kind === 'object';
      nodes.push({
        name: key,
        path,
        children: isObject ? schemaToFieldTree(meta.schema, path) : undefined,
      });
    }
    return nodes.sort((a, b) => a.name.localeCompare(b.name));
  };

  const fieldTree = useMemo(() => {
    if (!selectSchema?.schema) return [] as FieldNode[];
    return schemaToFieldTree(selectSchema.schema);
  }, [selectSchema]);

  const allLeafPaths = useMemo(() => {
    const leaves: string[] = [];
    const walk = (nodes: FieldNode[]) => {
      for (const n of nodes) {
        if (n.children && n.children.length > 0) walk(n.children);
        else leaves.push(n.path);
      }
    };
    walk(fieldTree);
    return leaves;
  }, [fieldTree]);

  // builtPath moved earlier

  // Auto-adjust mode hint based on path parity if user selected via dropdowns
  useEffect(() => {
    const segments = builtPath.split('/').filter(Boolean);
    if (segments.length === 0) return;
    const looksCollection = segments.length % 2 === 1;
    if (mode === 'auto') return; // respect explicit user mode when set
    // Do not auto override if user explicitly chose; we only adjust if in auto in future
  }, [builtPath]);

  const run = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await fetch('/api/admin/firestore/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath: builtPath, mode, sampleCount }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Request failed');
      setResult(data.data);
    } catch (e: any) {
      setError(e.message || 'Failed to generate schema');
    } finally {
      setLoading(false);
    }
  };

  const runSelect = async () => {
    try {
      setSelectLoading(true);
      setSelectError(null);
      setSelectResult(null);
      const res = await fetch('/api/admin/firestore/collection-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionPath: selectCollectionPath || builtPath,
          fields: selectFields,
          limit: selectLimit,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Request failed');
      setSelectResult(data.data.entries);
    } catch (e: any) {
      setSelectError(e.message || 'Failed to fetch fields');
    } finally {
      setSelectLoading(false);
    }
  };

  // Auto-infer fields for the selected collection path, without affecting the main schema result
  useEffect(() => {
    const path = (selectCollectionPath || builtPath).trim();
    if (!path || !isCollectionPath(path)) {
      setSelectSchema(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/firestore/schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetPath: path, mode: 'collection', sampleCount: 50 }),
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.success) {
          setSelectSchema(data.data);
        }
      } catch {
        if (!cancelled) setSelectSchema(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectCollectionPath, builtPath]);

  // Load root collections on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/firestore/browse?mode=root');
        const data = await res.json();
        if (res.ok && data.success) {
          setRootCollections(data.data.entries);
        }
      } catch {}
    })();
  }, []);

  // When root collection selected, load its documents (level 1)
  useEffect(() => {
    setDocumentsLvl1([]);
    setSelectedDocLvl1('');
    setSubcollectionsLvl2([]);
    setSelectedSubcollectionLvl2('');
    setDocumentsLvl2([]);
    setSelectedDocLvl2('');
    if (!selectedRootCollection) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/firestore/browse?mode=collection&path=${encodeURIComponent(selectedRootCollection)}&limit=200`);
        const data = await res.json();
        if (res.ok && data.success) {
          setDocumentsLvl1(data.data.entries);
        }
      } catch {}
    })();
  }, [selectedRootCollection]);

  // When level1 doc selected, load subcollections
  useEffect(() => {
    setSubcollectionsLvl2([]);
    setSelectedSubcollectionLvl2('');
    setDocumentsLvl2([]);
    setSelectedDocLvl2('');
    if (!selectedRootCollection || !selectedDocLvl1) return;
    const docPath = `${selectedRootCollection}/${selectedDocLvl1}`;
    (async () => {
      try {
        const res = await fetch(`/api/admin/firestore/browse?mode=document&path=${encodeURIComponent(docPath)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setSubcollectionsLvl2(data.data.entries);
        }
      } catch {}
    })();
  }, [selectedRootCollection, selectedDocLvl1]);

  // When level2 subcollection selected, load its documents
  useEffect(() => {
    setDocumentsLvl2([]);
    setSelectedDocLvl2('');
    if (!selectedRootCollection || !selectedDocLvl1 || !selectedSubcollectionLvl2) return;
    const collPath = `${selectedRootCollection}/${selectedDocLvl1}/${selectedSubcollectionLvl2}`;
    (async () => {
      try {
        const res = await fetch(`/api/admin/firestore/browse?mode=collection&path=${encodeURIComponent(collPath)}&limit=200`);
        const data = await res.json();
        if (res.ok && data.success) {
          setDocumentsLvl2(data.data.entries);
        }
      } catch {}
    })();
  }, [selectedRootCollection, selectedDocLvl1, selectedSubcollectionLvl2]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firestore Schema Generator</h1>
          <p className="text-gray-600">Infer a TypeScript type from a collection or document by sampling data.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Target path</label>
              <input
                value={builtPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="e.g. users or users/abc123"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="auto">Auto</option>
                <option value="collection">Collection</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sample count</label>
              <input
                type="number"
                min={1}
                max={500}
                value={sampleCount}
                onChange={(e) => setSampleCount(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Root collection</label>
              <select
                value={selectedRootCollection}
                onChange={(e) => setSelectedRootCollection(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">— Select —</option>
                {rootCollections.map((c) => (
                  <option key={c.id} value={c.id}>{c.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Document (level 1)</label>
              <select
                value={selectedDocLvl1}
                onChange={(e) => setSelectedDocLvl1(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={!selectedRootCollection}
              >
                <option value="">— Select —</option>
                {documentsLvl1.map((d) => (
                  <option key={d.id} value={d.id}>{d.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subcollection (level 2)</label>
              <select
                value={selectedSubcollectionLvl2}
                onChange={(e) => setSelectedSubcollectionLvl2(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={!selectedDocLvl1}
              >
                <option value="">— Select —</option>
                {subcollectionsLvl2.map((c) => (
                  <option key={c.id} value={c.id}>{c.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Document (level 2)</label>
              <select
                value={selectedDocLvl2}
                onChange={(e) => setSelectedDocLvl2(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={!selectedSubcollectionLvl2}
              >
                <option value="">— Select —</option>
                {documentsLvl2.map((d) => (
                  <option key={d.id} value={d.id}>{d.id}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={run}
              disabled={loading || !builtPath.trim()}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? 'Generating…' : 'Generate schema'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Select fields from all documents</h2>
            <p className="text-gray-600 text-sm">Fetch specific fields (e.g., <code>key1,key2,nested.key3</code>) from a collection.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Collection path</label>
              <div className="mt-1 flex gap-2">
                <select
                  value={(selectCollectionPath || builtPath) && collectionOptions.some(o => o.value === (selectCollectionPath || builtPath)) ? (selectCollectionPath || builtPath) : ''}
                  onChange={(e) => setSelectCollectionPath(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">— Select —</option>
                  {collectionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <input
                value={selectCollectionPath || builtPath}
                onChange={(e) => setSelectCollectionPath(e.target.value)}
                placeholder="e.g. users or users/{userId}/orders"
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fields (comma-separated)</label>
              <input
                value={selectFields}
                onChange={(e) => setSelectFields(e.target.value)}
                placeholder="key1,key2,nested.key3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {(fieldTree.length > 0) && (
                <div className="mt-2 border rounded p-2 max-h-64 overflow-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Fields from inferred schema</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-indigo-600 hover:underline"
                        onClick={() => setSelectFields(allLeafPaths.join(','))}
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        className="text-xs text-gray-600 hover:underline"
                        onClick={() => setSelectFields('')}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <FieldTree
                    nodes={fieldTree}
                    selectedCsv={selectFields}
                    onChangeSelected={(csv) => setSelectFields(csv)}
                    expanded={expandedNodes}
                    onToggleExpand={(path) => {
                      setExpandedNodes(prev => {
                        const next = new Set(prev);
                        if (next.has(path)) next.delete(path); else next.add(path);
                        return next;
                      });
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Limit</label>
              <input
                type="number"
                min={1}
                max={500}
                value={selectLimit}
                onChange={(e) => setSelectLimit(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runSelect}
              disabled={selectLoading || !(selectCollectionPath || builtPath) || !selectFields.trim()}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
            >
              {selectLoading ? 'Fetching…' : 'Fetch fields'}
            </button>
            {selectError && <span className="text-sm text-red-600">{selectError}</span>}
            {selectResult && selectResult.length > 0 && (
              <CopyButton text={JSON.stringify(selectResult, null, 2)} />
            )}
          </div>
          {selectResult && (
            <div className="mt-2">
              <pre className="text-sm overflow-auto bg-gray-50 p-3 rounded border border-gray-200 max-h-[400px]">{JSON.stringify(selectResult, null, 2)}</pre>
            </div>
          )}
        </div>

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-gray-900">Pretty schema</h2>
                <CopyButton text={JSON.stringify(result.prettySchema, null, 2)} />
              </div>
              <pre className="text-sm overflow-auto bg-gray-50 p-3 rounded border border-gray-200">{JSON.stringify(result.prettySchema, null, 2)}</pre>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-gray-900">TypeScript</h2>
                <CopyButton text={result.typescript} />
              </div>
              <pre className="text-sm overflow-auto bg-gray-50 p-3 rounded border border-gray-200">{result.typescript}</pre>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-gray-900">Key / Actual value</h2>
                <CopyButton text={JSON.stringify(computeKeyActualValueTree(result.example, result.schema), null, 2)} />
              </div>
              <pre className="text-sm overflow-auto bg-gray-50 p-3 rounded border border-gray-200">{JSON.stringify(computeKeyActualValueTree(result.example, result.schema), null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function FieldTree({
  nodes,
  selectedCsv,
  onChangeSelected,
  expanded,
  onToggleExpand,
}: {
  nodes: Array<{ name: string; path: string; children?: any[] }>;
  selectedCsv: string;
  onChangeSelected: (csv: string) => void;
  expanded: Set<string>;
  onToggleExpand: (path: string) => void;
}) {
  const selected = new Set(
    selectedCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const togglePath = (path: string, checked: boolean) => {
    if (checked) selected.add(path);
    else selected.delete(path);
    onChangeSelected(Array.from(selected).join(','));
  };

  const renderNode = (node: { name: string; path: string; children?: any[] }) => {
    const isParent = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = expanded.has(node.path);
    const allLeafChildren: string[] = [];
    const collectLeaves = (n: any) => {
      if (!n.children || n.children.length === 0) {
        allLeafChildren.push(n.path);
      } else {
        for (const c of n.children) collectLeaves(c);
      }
    };
    collectLeaves(node);
    const allSelected = allLeafChildren.every((p) => selected.has(p));
    const someSelected = !allSelected && allLeafChildren.some((p) => selected.has(p));

    return (
      <div key={node.path} className="ml-2">
        <div className="flex items-center gap-2 py-0.5">
          {isParent ? (
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 w-5"
              onClick={() => onToggleExpand(node.path)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '▾' : '▸'}
            </button>
          ) : (
            <span className="w-5" />
          )}
          {isParent ? (
            <input
              type="checkbox"
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={allSelected}
              ref={(el) => {
                if (el) (el as any).indeterminate = someSelected;
              }}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) {
                  for (const p of allLeafChildren) next.add(p);
                } else {
                  for (const p of allLeafChildren) next.delete(p);
                }
                onChangeSelected(Array.from(next).join(','));
              }}
            />
          ) : (
            <input
              type="checkbox"
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={selected.has(node.path)}
              onChange={(e) => togglePath(node.path, e.target.checked)}
            />
          )}
          <span className="text-sm text-gray-800 truncate" title={node.path}>{node.name}</span>
        </div>
        {isParent && isExpanded && (
          <div className="ml-5 border-l pl-2">
            {node.children!.map((c) => renderNode(c))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {nodes.map((n) => renderNode(n))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="inline-flex items-center rounded-md bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-700"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function computeKeyValueLines(schemaNode: any, prefix = ''): string[] {
  if (!schemaNode) return [];
  const lines: string[] = [];

  const describe = (node: any): string => {
    if (!node) return 'unknown';
    switch (node.kind) {
      case 'null': return 'null';
      case 'boolean': return 'boolean';
      case 'number': return 'number';
      case 'string': return 'string';
      case 'timestamp': return 'timestamp';
      case 'geopoint': return 'geopoint';
      case 'reference': return 'reference';
      case 'bytes': return 'bytes';
      case 'array':
        if (!node.elementTypes || node.elementTypes.length === 0) return 'array<any>';
        return `array<${node.elementTypes.map(describe).join(' | ')}>`;
      case 'union':
        return node.options?.map(describe).join(' | ') || 'union';
      case 'object':
        return 'object';
      default:
        return 'unknown';
    }
  };

  if (schemaNode.kind === 'object' && schemaNode.fields) {
    for (const [key, meta] of Object.entries<any>(schemaNode.fields)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      lines.push(`${fullKey}: ${describe(meta.schema)}${meta.optional ? ' (optional)' : ''}`);
      // Recurse for nested objects
      if (meta.schema?.kind === 'object') {
        lines.push(...computeKeyValueLines(meta.schema, fullKey));
      }
    }
  } else {
    // Fallback single-line description
    lines.push(`${prefix || 'value'}: ${describe(schemaNode)}`);
  }

  return lines;
}

function computeKeyActualValueLines(example: any, schemaNode: any, prefix = ''): string[] {
  if (!schemaNode) return [];
  const lines: string[] = [];

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'string') return JSON.stringify(val);
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) return `[${val.map((v) => formatValue(v)).join(', ')}]`;
    if (val && typeof val === 'object') {
      // Firestore special types best-effort
      if (val._seconds !== undefined && val._nanoseconds !== undefined) return 'Timestamp';
      if (val.latitude !== undefined && val.longitude !== undefined) return `GeoPoint(${val.latitude}, ${val.longitude})`;
      if (typeof val.path === 'string' && typeof val.id === 'string') return `Ref(${val.path})`;
      return JSON.stringify(val);
    }
    return String(val);
  };

  if (schemaNode.kind === 'object' && schemaNode.fields) {
    for (const [key, meta] of Object.entries<any>(schemaNode.fields)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = example ? example[key] : undefined;
      lines.push(`${fullKey}: ${formatValue(value)}`);
      if (meta.schema?.kind === 'object') {
        lines.push(...computeKeyActualValueLines(value || {}, meta.schema, fullKey));
      }
    }
  } else {
    lines.push(`${prefix || 'value'}: ${formatValue(example)}`);
  }

  return lines;
}

function computeKeyActualValueTree(example: any, schemaNode: any): any {
  const formatValue = (val: any): any => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
    if (Array.isArray(val)) return val.map((v) => formatValue(v));
    if (val && typeof val === 'object') {
      // Firestore special types best-effort to readable tokens
      if (val._seconds !== undefined && val._nanoseconds !== undefined) return 'Timestamp';
      if (val.latitude !== undefined && val.longitude !== undefined) return `GeoPoint(${val.latitude}, ${val.longitude})`;
      if (typeof val.path === 'string' && typeof val.id === 'string') return `Ref(${val.path})`;
      return val; // let nested objects render
    }
    return String(val);
  };

  if (!schemaNode) return null;

  if (schemaNode.kind === 'object' && schemaNode.fields) {
    const out: Record<string, any> = {};
    for (const [key, meta] of Object.entries<any>(schemaNode.fields)) {
      const rawValue = example ? example[key] : undefined;
      const entry: any = { value: formatValue(rawValue), optional: !!meta.optional };
      if (meta.schema?.kind === 'object') {
        entry.fields = computeKeyActualValueTree(rawValue || {}, meta.schema);
      }
      out[key] = entry;
    }
    return out;
  }

  return { value: formatValue(example) };
}


