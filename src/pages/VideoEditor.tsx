import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Download,
  MessageSquare,
  Send,
  X,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Video as VideoIcon,
  Type,
  Music,
  Mic,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Scissors,
  Move,
  Layers,
  Palette,
  Sparkles,
  Bot,
  Loader2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { VideoPanel } from '../components/videos/VideoPanel';
import { VoicesPanel } from '../components/voices/VoicesPanel';
import { MusicPanel } from '../components/music/MusicPanel';
import { getUserClips, UserClip } from '../lib/clips';
import { getUserMusic, UserMusic } from '../lib/music';
import { Voice } from '../types';
import { getVoice } from '../lib/elevenlabs';

// Define types for our video structure
interface Scene {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  audio: string;
  script: string;
  title: string;
  description: string;
  clipId?: string;
  voiceId?: string;
  musicId?: string;
  subtitles?: string;
}

interface Section {
  label: string;
  description: string;
  scenes: Scene[];
}

interface Video {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  status: 'draft' | 'processing' | 'complete';
  created_at: string;
  updated_at: string;
}

// AI-generated scene structure (without IDs)
interface AIScene {
  type: 'text' | 'image' | 'video';
  content: string;
  script: string;
  title: string;
  description: string;
}

interface AISection {
  label: string;
  description: string;
  scenes: AIScene[];
}

const VideoEditor: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Video state
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Editor state
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Panel state
  const [activePanel, setActivePanel] = useState<'videos' | 'voices' | 'music' | 'chat' | null>(null);
  const [clips, setClips] = useState<UserClip[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [musicTracks, setMusicTracks] = useState<UserMusic[]>([]);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Smart merging function to preserve UUIDs when AI modifies scenes
  const smartMergeAIScenes = (
    currentSections: Section[],
    aiSections: AISection[]
  ): Section[] => {
    console.log('🔄 Smart merging AI scenes with current sections');
    console.log('Current sections:', currentSections.length);
    console.log('AI sections:', aiSections.length);

    return aiSections.map((aiSection, sectionIndex) => {
      const currentSection = currentSections[sectionIndex];
      
      // Merge scenes within each section
      const mergedScenes = aiSection.scenes.map((aiScene, sceneIndex) => {
        // Try to find a matching existing scene
        let matchedScene: Scene | null = null;
        
        if (currentSection?.scenes) {
          // Strategy 1: Match by index (most reliable for reordering)
          if (currentSection.scenes[sceneIndex]) {
            const candidateScene = currentSection.scenes[sceneIndex];
            
            // Check if content is similar enough (simple similarity check)
            const titleSimilarity = calculateSimilarity(aiScene.title, candidateScene.title);
            const contentSimilarity = calculateSimilarity(aiScene.content, candidateScene.content);
            const scriptSimilarity = calculateSimilarity(aiScene.script, candidateScene.script);
            
            // If any field has high similarity, consider it a match
            if (titleSimilarity > 0.6 || contentSimilarity > 0.6 || scriptSimilarity > 0.6) {
              matchedScene = candidateScene;
            }
          }
          
          // Strategy 2: If no index match, try to find by content similarity
          if (!matchedScene) {
            for (const existingScene of currentSection.scenes) {
              const titleSimilarity = calculateSimilarity(aiScene.title, existingScene.title);
              const contentSimilarity = calculateSimilarity(aiScene.content, existingScene.content);
              const scriptSimilarity = calculateSimilarity(aiScene.script, existingScene.script);
              
              // Higher threshold for cross-index matching
              if (titleSimilarity > 0.8 || contentSimilarity > 0.8 || scriptSimilarity > 0.8) {
                matchedScene = existingScene;
                break;
              }
            }
          }
        }
        
        if (matchedScene) {
          // Preserve the existing UUID and merge content
          console.log(`✅ Matched scene: ${matchedScene.id} with AI scene: ${aiScene.title}`);
          return {
            ...matchedScene, // Preserve ID and other existing properties
            ...aiScene, // Update with AI content
            id: matchedScene.id, // Explicitly preserve the UUID
            clipId: matchedScene.clipId, // Preserve existing media references
            voiceId: matchedScene.voiceId,
            musicId: matchedScene.musicId,
            subtitles: matchedScene.subtitles,
          };
        } else {
          // Create new scene with fresh UUID
          const newSceneId = crypto.randomUUID();
          console.log(`🆕 Creating new scene: ${newSceneId} for AI scene: ${aiScene.title}`);
          return {
            ...aiScene,
            id: newSceneId,
            audio: '',
          };
        }
      });

      return {
        label: aiSection.label,
        description: aiSection.description,
        scenes: mergedScenes,
      };
    });
  };

  // Simple similarity calculation (Jaccard similarity for words)
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;
    
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  };

  // Process AI chat response and update video structure
  const processAIResponse = async (aiResponse: string) => {
    console.log('🤖 Processing AI response for video structure changes');
    
    try {
      // Try to extract JSON from the AI response
      let aiSections: AISection[] = [];
      
      // Look for JSON in the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          aiSections = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Failed to parse AI JSON:', parseError);
          return false;
        }
      } else {
        // If no JSON found, the AI might have provided text-only response
        console.log('No JSON structure found in AI response');
        return false;
      }

      if (!Array.isArray(aiSections) || aiSections.length === 0) {
        console.log('AI response does not contain valid sections array');
        return false;
      }

      // Validate the AI sections structure
      const isValidStructure = aiSections.every(section => 
        section.label && 
        section.scenes && 
        Array.isArray(section.scenes) &&
        section.scenes.every(scene => 
          scene.title && 
          scene.type && 
          ['text', 'image', 'video'].includes(scene.type)
        )
      );

      if (!isValidStructure) {
        console.log('AI response structure is invalid');
        return false;
      }

      // Apply smart merging
      if (video?.sections) {
        const mergedSections = smartMergeAIScenes(video.sections, aiSections);
        
        setVideo(prev => prev ? {
          ...prev,
          sections: mergedSections
        } : null);

        console.log('✅ Successfully merged AI changes with existing video structure');
        return true;
      }
    } catch (error) {
      console.error('Error processing AI response:', error);
    }
    
    return false;
  };

  // Load video data
  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch video from Supabase
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', videoId)
          .eq('user_id', user.id)
          .single();

        if (videoError) throw videoError;
        if (!videoData) throw new Error('Video not found');

        // Parse sections if they exist
        let sections: Section[] = [];
        if (videoData.sections) {
          sections = videoData.sections;
        } else {
          // Create default sections if none exist
          sections = [
            {
              label: 'Opening',
              description: 'Introduction to the video',
              scenes: [
                {
                  id: crypto.randomUUID(),
                  type: 'text',
                  content: 'Welcome to your video!',
                  audio: '',
                  script: 'Script for scene 1',
                  title: 'Opening Scene',
                  description: 'Welcome message',
                }
              ]
            }
          ];
        }

        setVideo({
          id: videoData.id,
          title: videoData.title,
          description: videoData.description || '',
          sections,
          status: videoData.status,
          created_at: videoData.created_at,
          updated_at: videoData.updated_at,
        });

        // Load user clips and other resources
        const [clipsData, voicesData, musicData] = await Promise.all([
          getUserClips(),
          getVoice(),
          getUserMusic(),
        ]);

        setClips(clipsData);
        setVoices(voicesData);
        setMusicTracks(musicData);

        if (voicesData.length > 0) {
          setSelectedVoice(voicesData[0]);
        }

      } catch (error) {
        console.error('Error loading video:', error);
        setError(error instanceof Error ? error.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId, user]);

  // Save video changes
  const saveVideo = async () => {
    if (!video || !user) return;

    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('videos')
        .update({
          title: video.title,
          description: video.description,
          sections: video.sections,
          updated_at: new Date().toISOString(),
        })
        .eq('id', video.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      console.log('✅ Video saved successfully');
    } catch (error) {
      console.error('Error saving video:', error);
      setError(error instanceof Error ? error.message : 'Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  // Handle chat message
  const handleChatMessage = async () => {
    if (!chatInput.trim() || isProcessingChat) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: chatInput.trim()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsProcessingChat(true);

    try {
      // Prepare context about current video structure
      const videoContext = video ? {
        title: video.title,
        description: video.description,
        sections: video.sections.map(section => ({
          label: section.label,
          description: section.description,
          scenes: section.scenes.map(scene => ({
            title: scene.title,
            description: scene.description,
            type: scene.type,
            content: scene.content,
            script: scene.script
          }))
        }))
      } : null;

      const systemPrompt = `You are an AI video editor assistant. You help users modify their video structure by adding, removing, reordering, or editing scenes and sections.

Current video structure:
${JSON.stringify(videoContext, null, 2)}

When the user asks to modify the video structure, respond with:
1. A brief explanation of what you're changing
2. The complete updated video structure as a JSON array of sections

Each section should have:
- label: string (section name)
- description: string (what this section covers)
- scenes: array of scene objects

Each scene should have:
- title: string
- description: string
- type: 'text' | 'image' | 'video'
- content: string (the actual content/text)
- script: string (narration script)

IMPORTANT: Do NOT include 'id' fields in your JSON response. The system will handle ID management automatically.

If the user is just asking questions or making comments that don't require structural changes, respond normally without JSON.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage.content }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiContent = data.choices[0].message.content;

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: aiContent
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Try to process the response for video structure changes
      const wasStructureUpdated = await processAIResponse(aiContent);
      
      if (wasStructureUpdated) {
        // Auto-save after AI modifications
        setTimeout(() => {
          saveVideo();
        }, 1000);
      }

    } catch (error) {
      console.error('Error processing chat message:', error);
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessingChat(false);
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination || !video) return;

    const { source, destination, type } = result;

    if (type === 'scene') {
      // Reordering scenes within a section
      const sectionIndex = parseInt(source.droppableId.split('-')[1]);
      const newSections = [...video.sections];
      const section = newSections[sectionIndex];
      
      const [reorderedScene] = section.scenes.splice(source.index, 1);
      section.scenes.splice(destination.index, 0, reorderedScene);
      
      setVideo({ ...video, sections: newSections });
    } else if (type === 'section') {
      // Reordering sections
      const newSections = [...video.sections];
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      
      setVideo({ ...video, sections: newSections });
    }
  };

  // Add new scene
  const addScene = (sectionIndex: number) => {
    if (!video) return;

    const newScene: Scene = {
      id: crypto.randomUUID(),
      type: 'text',
      content: 'New scene content',
      audio: '',
      script: 'Script for new scene',
      title: 'New Scene',
      description: 'Description for new scene',
    };

    const newSections = [...video.sections];
    newSections[sectionIndex].scenes.push(newScene);
    
    setVideo({ ...video, sections: newSections });
  };

  // Delete scene
  const deleteScene = (sectionIndex: number, sceneIndex: number) => {
    if (!video) return;

    const newSections = [...video.sections];
    newSections[sectionIndex].scenes.splice(sceneIndex, 1);
    
    setVideo({ ...video, sections: newSections });
  };

  // Update scene
  const updateScene = (sectionIndex: number, sceneIndex: number, updates: Partial<Scene>) => {
    if (!video) return;

    const newSections = [...video.sections];
    newSections[sectionIndex].scenes[sceneIndex] = {
      ...newSections[sectionIndex].scenes[sceneIndex],
      ...updates
    };
    
    setVideo({ ...video, sections: newSections });
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
          <p className="text-lg font-medium text-slate-700">Loading video editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-600 mb-2">Video not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{video.title}</h1>
            <p className="text-sm text-slate-500">Video Editor</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={saveVideo}
            isLoading={saving}
            loadingText="Saving..."
            leftIcon={!saving ? <Save className="h-4 w-4" /> : undefined}
          >
            Save
          </Button>
          <Button
            onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
            variant={activePanel === 'chat' ? 'default' : 'outline'}
            leftIcon={<MessageSquare className="h-4 w-4" />}
          >
            AI Assistant
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="bg-black flex-shrink-0 h-64 flex items-center justify-center">
            <div className="text-white text-center">
              <VideoIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Video Preview</p>
              <p className="text-sm opacity-75">Preview will appear here</p>
            </div>
          </div>

          {/* Timeline/Sections Editor */}
          <div className="flex-1 overflow-y-auto p-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections" type="section">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {video.sections.map((section, sectionIndex) => (
                      <Draggable
                        key={`section-${sectionIndex}`}
                        draggableId={`section-${sectionIndex}`}
                        index={sectionIndex}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-white rounded-lg border border-slate-200 p-4"
                          >
                            <div {...provided.dragHandleProps} className="flex items-center mb-3">
                              <Move className="h-4 w-4 text-slate-400 mr-2" />
                              <h3 className="text-lg font-semibold text-slate-900">{section.label}</h3>
                            </div>
                            
                            <Droppable droppableId={`scenes-${sectionIndex}`} type="scene">
                              {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                  {section.scenes.map((scene, sceneIndex) => (
                                    <Draggable
                                      key={scene.id}
                                      draggableId={scene.id}
                                      index={sceneIndex}
                                    >
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`border rounded-lg p-3 ${
                                            selectedSceneId === scene.id
                                              ? 'border-purple-500 bg-purple-50'
                                              : 'border-slate-200 bg-slate-50'
                                          }`}
                                          onClick={() => setSelectedSceneId(scene.id)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div {...provided.dragHandleProps} className="flex items-center">
                                              <Move className="h-4 w-4 text-slate-400 mr-2" />
                                              <div className="flex items-center space-x-2">
                                                {scene.type === 'text' && <Type className="h-4 w-4 text-blue-500" />}
                                                {scene.type === 'image' && <ImageIcon className="h-4 w-4 text-green-500" />}
                                                {scene.type === 'video' && <VideoIcon className="h-4 w-4 text-purple-500" />}
                                                <span className="font-medium text-slate-900">{scene.title}</span>
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteScene(sectionIndex, sceneIndex);
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          {selectedSceneId === scene.id && (
                                            <div className="mt-3 space-y-3">
                                              <Input
                                                label="Title"
                                                value={scene.title}
                                                onChange={(e) => updateScene(sectionIndex, sceneIndex, { title: e.target.value })}
                                              />
                                              <Textarea
                                                label="Description"
                                                value={scene.description}
                                                onChange={(e) => updateScene(sectionIndex, sceneIndex, { description: e.target.value })}
                                              />
                                              <Textarea
                                                label="Content"
                                                value={scene.content}
                                                onChange={(e) => updateScene(sectionIndex, sceneIndex, { content: e.target.value })}
                                              />
                                              <Textarea
                                                label="Script"
                                                value={scene.script}
                                                onChange={(e) => updateScene(sectionIndex, sceneIndex, { script: e.target.value })}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  
                                  <Button
                                    variant="outline"
                                    onClick={() => addScene(sectionIndex)}
                                    leftIcon={<Plus className="h-4 w-4" />}
                                    className="w-full"
                                  >
                                    Add Scene
                                  </Button>
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {/* Side Panels */}
        {activePanel && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                {activePanel === 'videos' && 'Video Clips'}
                {activePanel === 'voices' && 'Voices'}
                {activePanel === 'music' && 'Music'}
                {activePanel === 'chat' && 'AI Assistant'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-hidden">
              {activePanel === 'videos' && (
                <VideoPanel
                  onAddVideo={() => {}}
                  onRemoveVideo={() => {}}
                  videos={[]}
                  onVideoSelect={() => {}}
                />
              )}
              
              {activePanel === 'voices' && (
                <VoicesPanel
                  onVoiceSelect={setSelectedVoice}
                  selectedVoice={selectedVoice}
                />
              )}
              
              {activePanel === 'music' && (
                <MusicPanel
                  onAddMusic={() => {}}
                  onRemoveMusic={() => {}}
                  tracks={musicTracks}
                  onTrackSelect={() => {}}
                />
              )}
              
              {activePanel === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-slate-500 py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">AI Video Assistant</p>
                        <p className="text-sm">Ask me to modify your video structure, add scenes, reorder content, or make any changes!</p>
                      </div>
                    )}
                    
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            message.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {isProcessingChat && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-lg px-3 py-2 flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-slate-600">AI is thinking...</span>
                        </div>
                      </div>
                    )}
                    
                    <div ref={chatEndRef} />
                  </div>
                  
                  <div className="p-4 border-t border-slate-200">
                    <div className="flex space-x-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask me to modify your video..."
                        onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                        disabled={isProcessingChat}
                      />
                      <Button
                        onClick={handleChatMessage}
                        disabled={!chatInput.trim() || isProcessingChat}
                        leftIcon={<Send className="h-4 w-4" />}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setActivePanel(activePanel === 'videos' ? null : 'videos')}
            leftIcon={<VideoIcon className="h-4 w-4" />}
            className={activePanel === 'videos' ? 'bg-purple-100 border-purple-300' : ''}
          >
            Videos
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(activePanel === 'voices' ? null : 'voices')}
            leftIcon={<Mic className="h-4 w-4" />}
            className={activePanel === 'voices' ? 'bg-purple-100 border-purple-300' : ''}
          >
            Voices
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(activePanel === 'music' ? null : 'music')}
            leftIcon={<Music className="h-4 w-4" />}
            className={activePanel === 'music' ? 'bg-purple-100 border-purple-300' : ''}
          >
            Music
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500">
            {video.sections.reduce((total, section) => total + section.scenes.length, 0)} scenes
          </span>
          <Button
            leftIcon={<Download className="h-4 w-4" />}
            disabled={video.status !== 'complete'}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;