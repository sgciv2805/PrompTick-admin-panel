import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Initialize Firebase (you'll need to adjust this based on your config)
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(request: NextRequest) {
  try {
    const templatesRef = collection(db, 'promptTemplates');
    const templatesQuery = query(templatesRef, orderBy('lastUpdated', 'desc'));
    const templatesSnapshot = await getDocs(templatesQuery);
    
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      success: true,
      templates 
    });
    
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { templates } = await request.json();
    
    if (!templates || !Array.isArray(templates)) {
      return NextResponse.json(
        { success: false, error: 'Templates array is required' },
        { status: 400 }
      );
    }

    const templatesRef = collection(db, 'promptTemplates');
    const addedTemplates = [];
    
    for (const template of templates) {
      // Transform discovered template to our database format
      const templateDoc = {
        name: { value: template.name },
        description: { value: template.description },
        category: { value: template.category },
        useCasePatterns: { value: template.useCasePatterns },
        complexity: { value: determineComplexity(template) },
        qualityScore: { value: template.credibilityScore || 85 },
        usageCount: { value: 0 },
        createdBy: { value: 'AI Discovery' },
        lastUpdated: { value: new Date().toISOString() },
        isActive: { value: true },
        tags: { value: template.useCasePatterns },
        systemPromptTemplate: { value: template.systemPromptTemplate },
        userPromptTemplate: { value: template.userPromptTemplate },
        variables: { value: template.variables },
        examples: { value: template.examples },
        sourceUrl: { value: template.sourceUrl },
        credibilityScore: { value: template.credibilityScore }
      };
      
      if (template.modelOptimizations) {
        (templateDoc as any).modelOptimizations = { value: template.modelOptimizations };
      }
      
      const docRef = await addDoc(templatesRef, templateDoc);
      addedTemplates.push({ id: docRef.id, ...templateDoc });
    }

    return NextResponse.json({ 
      success: true,
      message: `${addedTemplates.length} templates added successfully`,
      templates: addedTemplates
    });
    
  } catch (error) {
    console.error('Failed to add templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add templates' },
      { status: 500 }
    );
  }
}

function determineComplexity(template: any): 'simple' | 'moderate' | 'complex' | 'advanced' {
  const variableCount = template.variables?.length || 0;
  const exampleCount = template.examples?.length || 0;
  const hasModelOptimizations = template.modelOptimizations && 
    Object.keys(template.modelOptimizations).length > 0;
  
  if (variableCount <= 2 && exampleCount <= 1 && !hasModelOptimizations) {
    return 'simple';
  } else if (variableCount <= 5 && exampleCount <= 3 && !hasModelOptimizations) {
    return 'moderate';
  } else if (variableCount <= 10 || hasModelOptimizations) {
    return 'complex';
  } else {
    return 'advanced';
  }
}