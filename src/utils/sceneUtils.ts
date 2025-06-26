import { generateUUID } from './uuid';

// Define a minimal scene interface for type safety
interface Scene {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  content?: string;
  [key: string]: any; // Allow for additional properties
}

interface Section {
  label: string;
  description?: string;
  scenes: Scene[];
  [key: string]: any; // Allow for additional properties
}

/**
 * Determines if two scenes are conceptually similar enough to be considered the same entity.
 * This is a crucial heuristic and might need fine-tuning based on how your AI modifies scene content.
 */
function areScenesConceptuallySimilar(sceneA: Scene, sceneB: Scene): boolean {
  // Primary matching: exact title match (case-insensitive)
  if (sceneA.title && sceneB.title) {
    const titleMatch = sceneA.title.toLowerCase().trim() === sceneB.title.toLowerCase().trim();
    if (titleMatch) return true;
  }

  // Secondary matching: exact description match (case-insensitive)
  if (sceneA.description && sceneB.description) {
    const descriptionMatch = sceneA.description.toLowerCase().trim() === sceneB.description.toLowerCase().trim();
    if (descriptionMatch) return true;
  }

  // Tertiary matching: content similarity (for scenes with content)
  if (sceneA.content && sceneB.content) {
    const contentMatch = sceneA.content.toLowerCase().trim() === sceneB.content.toLowerCase().trim();
    if (contentMatch) return true;
  }

  // Fallback: if both scenes have very similar titles (fuzzy match)
  if (sceneA.title && sceneB.title) {
    const titleA = sceneA.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const titleB = sceneB.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    // Simple fuzzy matching: if one title contains the other or they're very similar
    if (titleA.length > 3 && titleB.length > 3) {
      if (titleA.includes(titleB) || titleB.includes(titleA)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates if a string is a proper UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Merges AI-generated scene changes into an existing video structure, preserving original scene IDs
 * where possible and assigning new UUIDs to new scenes.
 */
export function mergeAIChangesToScenes(
  existingSections: Section[],
  aiGeneratedSections: Section[]
): Section[] {
  console.log('🔄 Starting scene merge process');
  console.log('📥 Existing sections:', existingSections.length);
  console.log('🤖 AI generated sections:', aiGeneratedSections.length);

  // Flatten existing scenes into a mutable array for easier matching and removal
  const availableExistingScenes: Scene[] = [];
  existingSections.forEach(section => {
    section.scenes.forEach(scene => {
      // Only consider existing scenes that already have a valid UUID
      if (scene.id && isValidUUID(scene.id)) {
        availableExistingScenes.push({ ...scene }); // Create a copy to avoid mutations
      } else {
        console.warn('⚠️ Found scene with invalid ID:', scene.id, 'in section:', section.label);
      }
    });
  });

  console.log('✅ Available existing scenes with valid UUIDs:', availableExistingScenes.length);

  const newSections: Section[] = [];

  aiGeneratedSections.forEach((aiSection, sectionIndex) => {
    console.log(`🔍 Processing AI section ${sectionIndex + 1}: ${aiSection.label}`);
    
    const newScenesForSection: Scene[] = [];
    
    aiSection.scenes.forEach((aiScene, sceneIndex) => {
      let assignedSceneId: string;
      let matchedExistingScene: Scene | null = null;

      // Try to find a matching existing scene based on conceptual similarity
      const matchedIndex = availableExistingScenes.findIndex(existingScene =>
        areScenesConceptuallySimilar(aiScene, existingScene)
      );

      if (matchedIndex !== -1) {
        // Match found: use the existing scene's ID
        matchedExistingScene = availableExistingScenes[matchedIndex];
        assignedSceneId = matchedExistingScene.id;
        
        console.log(`🔗 Matched AI scene "${aiScene.title || 'Untitled'}" with existing scene ID: ${assignedSceneId}`);
        
        // Remove the matched scene from the available pool to prevent re-use
        availableExistingScenes.splice(matchedIndex, 1);
      } else {
        // No match found: this is a new scene introduced by the AI
        assignedSceneId = generateUUID();
        console.log(`✨ Created new UUID for AI scene "${aiScene.title || 'Untitled'}": ${assignedSceneId}`);
      }

      // Create the new scene, preserving AI changes but using the correct ID
      const newScene: Scene = {
        ...aiScene,
        id: assignedSceneId,
      };

      // If we matched with an existing scene, preserve certain properties that shouldn't be overwritten
      if (matchedExistingScene) {
        // Preserve clipId, voiceId, musicId, and other media-related properties
        if (matchedExistingScene.clipId && !newScene.clipId) {
          newScene.clipId = matchedExistingScene.clipId;
        }
        if (matchedExistingScene.voiceId && !newScene.voiceId) {
          newScene.voiceId = matchedExistingScene.voiceId;
        }
        if (matchedExistingScene.musicId && !newScene.musicId) {
          newScene.musicId = matchedExistingScene.musicId;
        }
        if (matchedExistingScene.subtitles && !newScene.subtitles) {
          newScene.subtitles = matchedExistingScene.subtitles;
        }
      }

      newScenesForSection.push(newScene);
    });

    // Create the new section with the processed scenes
    newSections.push({
      ...aiSection,
      scenes: newScenesForSection,
    });

    console.log(`✅ Processed section "${aiSection.label}" with ${newScenesForSection.length} scenes`);
  });

  console.log('🎉 Scene merge completed successfully');
  console.log('📤 Final sections:', newSections.length);
  
  // Log any orphaned scenes (existing scenes that weren't matched)
  if (availableExistingScenes.length > 0) {
    console.log('🗑️ Orphaned scenes (removed by AI):', availableExistingScenes.length);
    availableExistingScenes.forEach(scene => {
      console.log(`   - "${scene.title || 'Untitled'}" (ID: ${scene.id})`);
    });
  }

  return newSections;
}

/**
 * Ensures all scenes in a sections array have valid UUIDs
 * This is a utility function for cleaning up existing data
 */
export function ensureValidSceneIds(sections: Section[]): Section[] {
  console.log('🔧 Ensuring valid scene IDs');
  
  return sections.map(section => ({
    ...section,
    scenes: section.scenes.map(scene => ({
      ...scene,
      id: scene.id && isValidUUID(scene.id) ? scene.id : generateUUID()
    }))
  }));
}

/**
 * Validates that all scenes in sections have proper UUIDs
 */
export function validateSceneIds(sections: Section[]): boolean {
  for (const section of sections) {
    for (const scene of section.scenes) {
      if (!scene.id || !isValidUUID(scene.id)) {
        console.error('❌ Invalid scene ID found:', scene.id, 'in scene:', scene.title);
        return false;
      }
    }
  }
  return true;
}