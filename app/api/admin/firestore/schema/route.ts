import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  Timestamp,
  GeoPoint,
  DocumentReference,
} from 'firebase-admin/firestore';

type SchemaNode =
  | { kind: 'null' }
  | { kind: 'boolean' }
  | { kind: 'number' }
  | { kind: 'string' }
  | { kind: 'timestamp' }
  | { kind: 'geopoint' }
  | { kind: 'reference'; refPath?: string }
  | { kind: 'bytes' }
  | { kind: 'array'; elementTypes: SchemaNode[] }
  | { kind: 'object'; fields: Record<string, { schema: SchemaNode; optional: boolean }> }
  | { kind: 'union'; options: SchemaNode[] };

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    !(value instanceof Timestamp) && !(value instanceof GeoPoint);
}

function inferValueType(value: any): SchemaNode {
  if (value === null || value === undefined) return { kind: 'null' };
  if (typeof value === 'boolean') return { kind: 'boolean' };
  if (typeof value === 'number') return { kind: 'number' };
  if (typeof value === 'string') return { kind: 'string' };
  if (value instanceof Timestamp) return { kind: 'timestamp' };
  if (value instanceof GeoPoint) return { kind: 'geopoint' };
  // Best-effort detection of DocumentReference
  if (value && typeof value === 'object' && typeof value.path === 'string' && typeof value.id === 'string' && typeof value.parent?.path === 'string') {
    return { kind: 'reference', refPath: value.path };
  }
  // bytes (Buffer / Uint8Array)
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return { kind: 'bytes' };
  if (value instanceof Uint8Array) return { kind: 'bytes' };

  if (Array.isArray(value)) {
    const elementTypes = mergeTypes(value.map(v => inferValueType(v)));
    return { kind: 'array', elementTypes };
  }

  if (isObjectLike(value)) {
    const fields: Record<string, { schema: SchemaNode; optional: boolean }> = {};
    for (const [key, val] of Object.entries(value)) {
      fields[key] = { schema: inferValueType(val), optional: false };
    }
    return { kind: 'object', fields };
  }

  // Fallback
  return { kind: 'string' };
}

function isEqualSchema(a: SchemaNode, b: SchemaNode): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'null':
    case 'boolean':
    case 'number':
    case 'string':
    case 'timestamp':
    case 'geopoint':
    case 'bytes':
      return true;
    case 'reference':
      return true; // ignore refPath variance when comparing
    case 'array': {
      const bArr = b as Extract<SchemaNode, { kind: 'array' }>;
      if (a.elementTypes.length !== bArr.elementTypes.length) return false;
      return a.elementTypes.every((t, i) => isEqualSchema(t, bArr.elementTypes[i]));
    }
    case 'object': {
      const aFields = Object.keys(a.fields).sort();
      const bObj = b as Extract<SchemaNode, { kind: 'object' }>;
      const bFields = Object.keys(bObj.fields).sort();
      if (aFields.length !== bFields.length) return false;
      return aFields.every((k) =>
        bFields.includes(k) &&
        isEqualSchema(a.fields[k].schema, bObj.fields[k].schema) &&
        a.fields[k].optional === bObj.fields[k].optional,
      );
    }
    case 'union': {
      const bUni = b as Extract<SchemaNode, { kind: 'union' }>;
      if (a.options.length !== bUni.options.length) return false;
      return a.options.every((opt, i) => isEqualSchema(opt, bUni.options[i]));
    }
  }
}

function mergeTwo(a: SchemaNode, b: SchemaNode): SchemaNode {
  if (isEqualSchema(a, b)) return a;
  if (a.kind === 'null') return markOptional(b);
  if (b.kind === 'null') return markOptional(a);

  if (a.kind === 'union') {
    return normalizeUnion({ kind: 'union', options: [...a.options, b] });
  }
  if (b.kind === 'union') {
    return normalizeUnion({ kind: 'union', options: [a, ...b.options] });
  }

  if (a.kind === 'array' && b.kind === 'array') {
    const elements = mergeTypes([...a.elementTypes, ...b.elementTypes]);
    return { kind: 'array', elementTypes: elements };
  }

  if (a.kind === 'object' && b.kind === 'object') {
    const allKeys = new Set([...Object.keys(a.fields), ...Object.keys(b.fields)]);
    const fields: Record<string, { schema: SchemaNode; optional: boolean }> = {};
    for (const key of allKeys) {
      const aField = a.fields[key];
      const bField = b.fields[key];
      if (aField && bField) {
        fields[key] = {
          schema: mergeTwo(aField.schema, bField.schema),
          optional: aField.optional || bField.optional,
        };
      } else if (aField && !bField) {
        fields[key] = { schema: aField.schema, optional: true };
      } else if (bField && !aField) {
        fields[key] = { schema: bField.schema, optional: true };
      }
    }
    return { kind: 'object', fields };
  }

  // Default to union
  return normalizeUnion({ kind: 'union', options: [a, b] });
}

function markOptional(schema: SchemaNode): SchemaNode {
  // Consumers handle optionality at field level. For top-level nulls, keep a union with null.
  return normalizeUnion({ kind: 'union', options: [schema, { kind: 'null' }] });
}

function normalizeUnion(union: Extract<SchemaNode, { kind: 'union' }>): SchemaNode {
  // Flatten nested unions and remove duplicates
  const flat: SchemaNode[] = [];
  for (const opt of union.options) {
    if (opt.kind === 'union') flat.push(...opt.options);
    else flat.push(opt);
  }
  // dedupe by string key
  const unique: SchemaNode[] = [];
  for (const opt of flat) {
    if (!unique.some((u) => isEqualSchema(u, opt))) unique.push(opt);
  }
  if (unique.length === 1) return unique[0];
  return { kind: 'union', options: unique };
}

function mergeTypes(types: SchemaNode[]): SchemaNode[] {
  // Merge a list of types into a minimal set (no duplicates, merged where possible)
  let result: SchemaNode[] = [];
  for (const t of types) {
    let merged = false;
    for (let i = 0; i < result.length; i++) {
      const candidate = result[i];
      const mergedCandidate = mergeTwo(candidate, t);
      if (isEqualSchema(mergedCandidate, candidate) && !isEqualSchema(candidate, t)) {
        // candidate unchanged and different from t, skip
        continue;
      }
      if (!isEqualSchema(mergedCandidate, candidate) || isEqualSchema(candidate, t)) {
        result[i] = mergedCandidate;
        merged = true;
        break;
      }
    }
    if (!merged) result.push(t);
  }
  // If result has unions adjacent, normalize
  const finalResult: SchemaNode[] = [];
  for (const r of result) {
    if (r.kind === 'union') finalResult.push(normalizeUnion(r));
    else finalResult.push(r);
  }
  // Remove duplicates
  const deduped: SchemaNode[] = [];
  for (const r of finalResult) {
    if (!deduped.some((d) => isEqualSchema(d, r))) deduped.push(r);
  }
  return deduped;
}

function schemaToTypeScript(schema: SchemaNode, indent = 0): string {
  const pad = (n: number) => '  '.repeat(n);
  switch (schema.kind) {
    case 'null':
      return 'null';
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'timestamp':
      return 'FirebaseFirestore.Timestamp';
    case 'geopoint':
      return 'FirebaseFirestore.GeoPoint';
    case 'bytes':
      return 'Uint8Array';
    case 'reference':
      return 'FirebaseFirestore.DocumentReference';
    case 'array': {
      const elements = schema.elementTypes;
      if (elements.length === 0) return 'any[]';
      if (elements.length === 1) return `Array<${schemaToTypeScript(elements[0], indent)}>`;
      return `Array<${elements.map((e) => schemaToTypeScript(e, indent)).join(' | ')}>`;
    }
    case 'object': {
      const fields = Object.entries(schema.fields)
        .map(([key, { schema: s, optional }]) => `${pad(indent + 1)}${escapeKey(key)}${optional ? '?' : ''}: ${schemaToTypeScript(s, indent + 1)};`)
        .join('\n');
      return `{\n${fields}\n${pad(indent)}}`;
    }
    case 'union':
      return schema.options.map((opt) => schemaToTypeScript(opt, indent)).join(' | ');
  }
}

function escapeKey(key: string): string {
  return /^[_a-zA-Z][_a-zA-Z0-9]*$/.test(key) ? key : JSON.stringify(key);
}

function prettyPrintSchema(schema: SchemaNode): any {
  switch (schema.kind) {
    case 'object': {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(schema.fields)) {
        out[k] = { type: kindLabel(v.schema), optional: v.optional, ...(v.schema.kind === 'object' ? { fields: prettyPrintSchema(v.schema) } : {}) };
      }
      return out;
    }
    case 'array':
      return { type: 'array', elements: schema.elementTypes.map(kindLabel) };
    case 'union':
      return { type: 'union', options: schema.options.map(kindLabel) };
    default:
      return { type: kindLabel(schema) };
  }
}

function kindLabel(schema: SchemaNode): string {
  switch (schema.kind) {
    case 'null': return 'null';
    case 'boolean': return 'boolean';
    case 'number': return 'number';
    case 'string': return 'string';
    case 'timestamp': return 'timestamp';
    case 'geopoint': return 'geopoint';
    case 'reference': return 'reference';
    case 'bytes': return 'bytes';
    case 'array': return `array(${schema.elementTypes.map(kindLabel).join(' | ')})`;
    case 'object': return 'object';
    case 'union': return `union(${schema.options.map(kindLabel).join(' | ')})`;
  }
}

async function inferCollectionSchema(collectionPath: string, sampleCount: number): Promise<{ schema: SchemaNode; stats: any; example?: any } | null> {
  const snapshot = await adminDb.collection(collectionPath).limit(sampleCount).get();
  if (snapshot.empty) return null;
  let merged: SchemaNode | null = null;
  let totalDocs = 0;
  const fieldPresence: Record<string, number> = {};
  let example: any | undefined = undefined;
  for (const doc of snapshot.docs) {
    totalDocs++;
    const data = doc.data();
    if (example === undefined) {
      example = { id: doc.id, ...data };
    }
    const schema = inferValueType(data);
    if (schema.kind === 'object') {
      for (const key of Object.keys(schema.fields)) {
        fieldPresence[key] = (fieldPresence[key] || 0) + 1;
      }
    }
    merged = merged ? mergeTwo(merged, schema) : schema;
  }
  if (!merged) return null;

  // Apply optionality based on presence counts
  if (merged.kind === 'object') {
    for (const [key, field] of Object.entries(merged.fields)) {
      const present = fieldPresence[key] || 0;
      merged.fields[key] = {
        schema: field.schema,
        optional: present < totalDocs || field.optional,
      };
    }
  }

  return {
    schema: merged,
    stats: {
      sampledDocuments: totalDocs,
    },
    example,
  };
}

async function inferDocumentSchema(documentPath: string): Promise<{ schema: SchemaNode; stats: any; example?: any } | null> {
  const snapshot = await adminDb.doc(documentPath).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() || {};
  const schema = inferValueType(data);
  return { schema, stats: { documentId: snapshot.id }, example: { id: snapshot.id, ...data } };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetPath: string = (body.targetPath || '').trim();
    const mode: 'auto' | 'collection' | 'document' = body.mode || 'auto';
    const sampleCount: number = Math.max(1, Math.min(parseInt(body.sampleCount || '50', 10), 500));

    if (!targetPath) {
      return NextResponse.json({ error: 'targetPath is required' }, { status: 400 });
    }

    const isCollection = isCollectionPath(targetPath);

    // Validate explicit modes
    if (mode === 'collection' && !isCollection) {
      return NextResponse.json({
        success: false,
        error: `Path "${targetPath}" looks like a document path. A collection path must have an odd number of segments (e.g., users or users/{userId}/orders).`,
      }, { status: 400 });
    }
    if (mode === 'document' && isCollection) {
      return NextResponse.json({
        success: false,
        error: `Path "${targetPath}" looks like a collection path. A document path must have an even number of segments (e.g., users/{userId}).`,
      }, { status: 400 });
    }

    let result: { schema: SchemaNode; stats: any; example?: any } | null = null;
    if (mode === 'collection') {
      result = await inferCollectionSchema(targetPath, sampleCount);
    } else if (mode === 'document') {
      result = await inferDocumentSchema(targetPath);
    } else {
      // auto: infer based on segment parity; fallback to the other if empty
      if (isCollection) {
        result = await inferCollectionSchema(targetPath, sampleCount);
        if (!result) result = await inferDocumentSchema(targetPath);
      } else {
        result = await inferDocumentSchema(targetPath);
        if (!result) result = await inferCollectionSchema(targetPath, sampleCount);
      }
    }

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'No data found for the provided path. Ensure the collection/document exists.',
      }, { status: 404 });
    }

    const tsType = schemaToTypeScript(result.schema);
    const interfaceName = deriveInterfaceNameFromPath(targetPath, mode);
    const tsInterface = `export type ${interfaceName} = ${tsType}`;

    return NextResponse.json({
      success: true,
      data: {
        targetPath,
        mode,
        stats: result.stats,
        schema: result.schema,
        prettySchema: prettyPrintSchema(result.schema),
        typescript: tsInterface,
        example: result.example ?? null,
      },
    });
  } catch (error: any) {
    console.error('Error inferring Firestore schema:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to infer schema' }, { status: 500 });
  }
}

function deriveInterfaceNameFromPath(path: string, mode: 'auto' | 'collection' | 'document'): string {
  const clean = path
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/[^a-zA-Z0-9]/g, ''))
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ''))
    .join('');
  const suffix = mode === 'document' ? 'Document' : 'CollectionDocument';
  return clean ? `${clean}${suffix}` : `Inferred${suffix}`;
}

function isCollectionPath(path: string): boolean {
  const segments = path.split('/').filter(Boolean);
  return segments.length % 2 === 1;
}


