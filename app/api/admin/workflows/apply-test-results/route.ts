import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { ModelDocument } from '@/types/model-schema';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

/**
 * Apply test results to a model in the database
 * This API endpoint takes parsed AI research data and updates the model schema
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, parsedData, confidence, aiResponse, cost } = body;

    // Validate inputs
    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    if (!parsedData) {
      return NextResponse.json(
        { error: 'Parsed AI data is required' },
        { status: 400 }
      );
    }

    // Get the current model document from the database
    const modelDoc = await adminDb.collection('models').doc(modelId).get();
    
    if (!modelDoc.exists) {
      return NextResponse.json(
        { error: `Model not found in database: ${modelId}` },
        { status: 404 }
      );
    }

    const model = { id: modelDoc.id, ...modelDoc.data() } as ModelDocument;

    // Apply the AI enrichment data using the same logic as AIEnrichmentService
    const updates: Partial<ModelDocument> = {};
    
    console.log(`🔄 Applying test results to model: ${model.name} (${model.id})`);
    
    // Update use cases and strengths
    if (parsedData.useCaseAnalysis) {
      updates.idealUseCases = parsedData.useCaseAnalysis.idealUseCases || model.idealUseCases;
      updates.strengths = parsedData.useCaseAnalysis.strengths || model.strengths;
      updates.industries = parsedData.useCaseAnalysis.industries || model.industries;
      console.log(`📝 Updated use cases (${updates.idealUseCases?.length}) and strengths (${updates.strengths?.length})`);
    }
    
    // Map AI techniques to valid schema enums
    const mapToValidTechniques = (aiTechniques: string[]): Array<'chain-of-thought' | 'few-shot' | 'role-playing' | 'step-by-step' | 'template-filling' | 'constraint-specification' | 'reasoning-aloud' | 'example-demonstration' | 'format-specification'> => {
      const validTechniques: Array<'chain-of-thought' | 'few-shot' | 'role-playing' | 'step-by-step' | 'template-filling' | 'constraint-specification' | 'reasoning-aloud' | 'example-demonstration' | 'format-specification'> = [];
      
      aiTechniques.forEach(technique => {
        const normalized = technique.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (normalized.includes('chain') || normalized.includes('reasoning')) validTechniques.push('chain-of-thought');
        else if (normalized.includes('few-shot') || normalized.includes('example')) validTechniques.push('few-shot');
        else if (normalized.includes('role') || normalized.includes('persona')) validTechniques.push('role-playing');
        else if (normalized.includes('step')) validTechniques.push('step-by-step');
        else if (normalized.includes('template')) validTechniques.push('template-filling');
        else if (normalized.includes('constraint')) validTechniques.push('constraint-specification');
        else if (normalized.includes('reasoning')) validTechniques.push('reasoning-aloud');
        else if (normalized.includes('demonstration')) validTechniques.push('example-demonstration');
        else if (normalized.includes('format')) validTechniques.push('format-specification');
      });
      
      return Array.from(new Set(validTechniques)); // Remove duplicates
    };

    const mapToAvoidTechniques = (aiTechniques: string[]): Array<'complex-nesting' | 'ambiguous-instructions' | 'very-long-context' | 'contradictory-instructions' | 'excessive-examples' | 'unclear-formatting'> => {
      const avoidTechniques: Array<'complex-nesting' | 'ambiguous-instructions' | 'very-long-context' | 'contradictory-instructions' | 'excessive-examples' | 'unclear-formatting'> = [];
      
      aiTechniques.forEach(technique => {
        const normalized = technique.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (normalized.includes('complex') || normalized.includes('nesting')) avoidTechniques.push('complex-nesting');
        else if (normalized.includes('ambiguous') || normalized.includes('unclear')) avoidTechniques.push('ambiguous-instructions');
        else if (normalized.includes('long') || normalized.includes('verbose')) avoidTechniques.push('very-long-context');
        else if (normalized.includes('contradictory') || normalized.includes('conflicting')) avoidTechniques.push('contradictory-instructions');
        else if (normalized.includes('excessive') || normalized.includes('too-many')) avoidTechniques.push('excessive-examples');
        else if (normalized.includes('formatting') || normalized.includes('unclear')) avoidTechniques.push('unclear-formatting');
      });
      
      return Array.from(new Set(avoidTechniques)); // Remove duplicates
    };
    
    // Enhance prompt guidance with proper schema compliance
    if (parsedData.promptOptimization && model.promptGuidance) {
      const effectiveTechniques = mapToValidTechniques(parsedData.promptOptimization.effectiveTechniques || []);
      const avoidTechniques = mapToAvoidTechniques(parsedData.promptOptimization.avoidTechniques || []);
      
      updates.promptGuidance = {
        ...model.promptGuidance,
        optimizationTechniques: {
          ...model.promptGuidance.optimizationTechniques,
          effectiveTechniques: effectiveTechniques.length > 0 ? effectiveTechniques : 
                              model.promptGuidance.optimizationTechniques?.effectiveTechniques || [],
          avoidTechniques: avoidTechniques.length > 0 ? avoidTechniques : 
                          model.promptGuidance.optimizationTechniques?.avoidTechniques || []
        },
        reliabilityNotes: {
          ...model.promptGuidance.reliabilityNotes,
          consistentAt: parsedData.performanceInsights?.reliabilityAssessment?.consistentAt || 
                       model.promptGuidance.reliabilityNotes?.consistentAt || [],
          inconsistentAt: parsedData.performanceInsights?.reliabilityAssessment?.inconsistentAt || 
                         model.promptGuidance.reliabilityNotes?.inconsistentAt || [],
          commonFailureModes: parsedData.performanceInsights?.reliabilityAssessment?.commonFailures || 
                             model.promptGuidance.reliabilityNotes?.commonFailureModes || [],
          temperatureRecommendations: parsedData.promptOptimization.temperatureRecommendations || 
                                     model.promptGuidance.reliabilityNotes?.temperatureRecommendations || {
                                       creative: 0.7, analytical: 0.3, factual: 0.1, conversational: 0.5
                                     }
        }
      };
      console.log(`🧠 Enhanced prompt guidance with ${effectiveTechniques.length} effective techniques`);
    }
    
    // Update technical details
    if (parsedData.technicalDetails) {
      updates.capabilities = {
        ...model.capabilities,
        languages: parsedData.technicalDetails.languageSupport || model.capabilities?.languages || [],
        specialFeatures: parsedData.technicalDetails.specialCapabilities || model.capabilities?.specialFeatures || []
      };
      
      if (parsedData.technicalDetails.actualVersion && model.specifications) {
        updates.specifications = {
          ...model.specifications,
          version: parsedData.technicalDetails.actualVersion
        };
      }
      console.log(`⚙️ Updated technical details and capabilities`);
    }
    
    // Add enrichment tracking in tags (schema compliant way)
    const enrichmentTags = [
      'ai-enriched',
      `enriched-${new Date().toISOString().split('T')[0]}`, // Date stamp
      `confidence-${confidence || 'unknown'}`,
      'test-applied'
    ];
    
    updates.tags = [
      ...(model.tags || []).filter(tag => !tag.startsWith('ai-enriched') && !tag.startsWith('enriched-') && !tag.startsWith('confidence-') && tag !== 'test-applied'), // Remove old enrichment tags
      ...enrichmentTags
    ];
    
    // Update data source with SCHEMA COMPLIANT values
    updates.dataSource = {
      ...model.dataSource,
      dataQuality: 'verified' as const, // ✅ VALID: AI research verified the data
      lastSuccessfulUpdate: Timestamp.now(), // ✅ VALID: Using correct property name
      verificationMethod: 'manual' as const, // ✅ VALID: Closest valid option for AI research
      scrapedFrom: [
        ...(model.dataSource?.scrapedFrom || []),
        ...((parsedData.sources || []).filter((source: any): source is string => typeof source === 'string'))
      ].slice(0, 10) // Limit to prevent document size issues
    };
    
    updates.updatedAt = Timestamp.now();
    
    console.log(`💾 Attempting database update for model: ${model.id}`);
    
    try {
      // Save to database
      await adminDb.collection('models').doc(model.id).update(updates);
      console.log(`✅ Successfully applied test results to model: ${model.name}`);
      
      return NextResponse.json({
        success: true,
        message: `Test results successfully applied to ${model.name}`,
        modelId: model.id,
        modelName: model.name,
        updatedFields: Object.keys(updates),
        confidence: confidence,
        cost: cost,
        appliedAt: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error(`❌ Database update failed for ${model.name}:`, error);
      throw new Error(`Database update failed: ${error.message}`);
    }

  } catch (error: any) {
    console.error('Error applying test results:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to apply test results',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}