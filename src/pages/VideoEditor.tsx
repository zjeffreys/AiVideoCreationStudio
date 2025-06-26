import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Settings, 
  Download,
  MessageSquare,
  Send,
  Loader2,
  Wand2,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Video as VideoIcon,
  Type,
  Music,
  Mic,
  Eye,
  EyeOff
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { VideoPanel } from '../components/videos/VideoPanel';
import { VoicesPanel } from '../components/voices/VoicesPanel';
import { MusicPanel } from '../components/music/MusicPanel';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Video, Voice } from '../types';
import { getUserClips, UserClip } from '../lib/clips';
import { getUserMusic, uploadMusic, UserMusic } from '../lib/music';
import { mergeAIChangesToScenes, ensureValidSceneIds, validateSceneIds } from '../utils/sceneUtils';

// Define Section type inline to avoid circular dependencies
interface Section {
  label: string;
  description: string;
  scenes: Array<{
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
  }>;
}

interface SceneVideo extends Video {
  file: File;
  localUrl: string;
  id: string;
  title: string;
  thumbnail_url?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  
  // Panel states
  const [activePanel, setActivePanel] = useState<'videos' | 'voices' | 'music' | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  
  // Media states
  const [sceneVideos, setSceneVideos] = useState<SceneVideo[]>([]);
  const [userClips, setUserClips] = useState<UserClip[]>([]);
  const [userMusic, setUserMusic] = useState<UserMusic[]>([]);
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI video editing assistant. I can help you modify your video structure, add scenes, reorder content, and more. What would you like to do with your video?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video data
  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId || !user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('id', videoId)
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Video not found');
        
        // Ensure all scenes have valid UUIDs before setting the video
        if (data.sections) {
          console.log('🔍 Validating and fixing scene IDs in loaded video');
          data.sections = ensureValidSceneIds(data.sections);
          
          // Validate the result
          if (!validateSceneIds(data.sections)) {
            console.error('❌ Scene ID validation failed after cleanup');
          } else {
            console.log('✅ All scene IDs are valid');
          }
        }
        
        setVideo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId, user]);

  // Load user clips and music
  useEffect(() => {
    const loadUserMedia = async () => {
      try {
        const [clips, music] = await Promise.all([
          getUserClips(),
          getUserMusic()
        ]);
        setUserClips(clips);
        setUserMusic(music);
      } catch (err) {
        console.error('Failed to load user media:', err);
      }
    };

    if (user) {
      loadUserMedia();
    }
  }, [user]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Save video changes
  const saveVideo = async () => {
    if (!video || !user) return;
    
    setSaving(true);
    try {
      // Validate scene IDs before saving
      if (video.sections && !validateSceneIds(video.sections)) {
        throw new Error('Invalid scene IDs detected. Please refresh and try again.');
      }
      
      const { error } = await supabase
        .from('videos')
        .update({
          title: video.title,
          description: video.description,
          sections: video.sections,
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id);
      
      if (error) throw error;
      
      console.log('✅ Video saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  // Handle chat message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an AI video editing assistant. The user has a video with the following structure:

Title: ${video?.title || 'Untitled Video'}
Description: ${video?.description || 'No description'}

Current sections and scenes:
${video?.sections?.map((section, sIdx) => 
  `Section ${sIdx + 1}: ${section.label}
  ${section.scenes.map((scene, sceneIdx) => 
    `  Scene ${sceneIdx + 1}: ${scene.title} - ${scene.description}`
  ).join('\n')}`
).join('\n\n') || 'No sections'}

You can help the user:
1. Modify the video structure (add/remove/reorder sections and scenes)
2. Update scene content, titles, and descriptions
3. Suggest improvements to the video flow
4. Add new scenes or sections

When making structural changes, respond with a JSON object containing the new sections array. Use this exact format:

{
  "type": "structure_update",
  "sections": [
    {
      "label": "Section Name",
      "description": "Section description",
      "scenes": [
        {
          "id": "preserve-existing-id-or-new-uuid",
          "type": "text|image|video",
          "title": "Scene Title",
          "description": "Scene description",
          "content": "Scene content",
          "audio": "",
          "script": "Scene script"
        }
      ]
    }
  ],
  "explanation": "Brief explanation of what you changed"
}

For regular conversation, just respond normally without JSON.`
            },
            ...chatMessages.slice(-5).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userMessage.content
            }
          ],
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Check if the response contains a structure update
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const structureUpdate = JSON.parse(jsonMatch[0]);
          
          if (structureUpdate.type === 'structure_update' && structureUpdate.sections) {
            console.log('🤖 AI proposed structure update');
            
            // Use the merging function to preserve existing scene IDs
            const currentSections = video?.sections || [];
            const aiSections = structureUpdate.sections;
            
            console.log('🔄 Merging AI changes with existing structure');
            const mergedSections = mergeAIChangesToScenes(currentSections, aiSections);
            
            // Validate the merged result
            if (!validateSceneIds(mergedSections)) {
              throw new Error('AI response resulted in invalid scene IDs');
            }
            
            // Update the video with merged sections
            setVideo(prev => prev ? {
              ...prev,
              sections: mergedSections
            } : null);
            
            // Add AI response with explanation
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: structureUpdate.explanation || 'I\'ve updated your video structure as requested.',
              timestamp: new Date()
            };
            
            setChatMessages(prev => [...prev, assistantMessage]);
            console.log('✅ Video structure updated successfully');
            return;
          }
        }
      } catch (parseError) {
        console.log('📝 Regular chat response (not a structure update)');
      }
      
      // Regular chat response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle drag and drop for scenes
  const handleDragEnd = (result: any) => {
    if (!result.destination || !video?.sections) return;
    
    const { source, destination } = result;
    
    // Parse the droppableId to get section indices
    const sourceSectionIndex = parseInt(source.droppableId.split('-')[1]);
    const destSectionIndex = parseInt(destination.droppableId.split('-')[1]);
    
    const newSections = [...video.sections];
    
    if (sourceSectionIndex === destSectionIndex) {
      // Reordering within the same section
      const section = newSections[sourceSectionIndex];
      const newScenes = [...section.scenes];
      const [removed] = newScenes.splice(source.index, 1);
      newScenes.splice(destination.index, 0, removed);
      
      newSections[sourceSectionIndex] = {
        ...section,
        scenes: newScenes
      };
    } else {
      // Moving between sections
      const sourceSection = newSections[sourceSectionIndex];
      const destSection = newSections[destSectionIndex];
      
      const sourceScenes = [...sourceSection.scenes];
      const destScenes = [...destSection.scenes];
      
      const [removed] = sourceScenes.splice(source.index, 1);
      destScenes.splice(destination.index, 0, removed);
      
      newSections[sourceSectionIndex] = {
        ...sourceSection,
        scenes: sourceScenes
      };
      
      newSections[destSectionIndex] = {
        ...destSection,
        scenes: destScenes
      };
    }
    
    setVideo(prev => prev ? { ...prev, sections: newSections } : null);
  };

  // Add new scene
  const addNewScene = (sectionIndex: number) => {
    if (!video?.sections) return;
    
    const newScene = {
      id: crypto.randomUUID(),
      type: 'text' as const,
      title: 'New Scene',
      description: 'Scene description',
      content: 'Scene content',
      audio: '',
      script: 'Scene script'
    };
    
    const newSections = [...video.sections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      scenes: [...newSections[sectionIndex].scenes, newScene]
    };
    
    setVideo(prev => prev ? { ...prev, sections: newSections } : null);
  };

  // Delete scene
  const deleteScene = (sectionIndex: number, sceneIndex: number) => {
    if (!video?.sections) return;
    
    const newSections = [...video.sections];
    const newScenes = [...newSections[sectionIndex].scenes];
    newScenes.splice(sceneIndex, 1);
    
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      scenes: newScenes
    };
    
    setVideo(prev => prev ? { ...prev, sections: newSections } : null);
  };

  // Update scene
  const updateScene = (sectionIndex: number, sceneIndex: number, updates: Partial<Section['scenes'][0]>) => {
    if (!video?.sections) return;
    
    const newSections = [...video.sections];
    const newScenes = [...newSections[sectionIndex].scenes];
    newScenes[sceneIndex] = { ...newScenes[sceneIndex], ...updates };
    
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      scenes: newScenes
    };
    
    setVideo(prev => prev ? { ...prev, sections: newSections } : null);
  };

  // Media handlers
  const handleAddVideo = async (file: File) => {
    const newVideo: SceneVideo = {
      id: crypto.randomUUID(),
      title: file.name,
      file,
      localUrl: URL.createObjectURL(file),
      created_at: new Date().toISOString(),
      status: 'draft' as const
    };
    setSceneVideos(prev => [...prev, newVideo]);
  };

  const handleRemoveVideo = (id: string) => {
    setSceneVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleVideoSelect = (video: SceneVideo) => {
    // Handle video selection logic
    console.log('Selected video:', video);
  };

  const handleAddMusic = async (file: File) => {
    try {
      const uploadedMusic = await uploadMusic(file);
      setUserMusic(prev => [...prev, uploadedMusic]);
    } catch (err) {
      console.error('Failed to upload music:', err);
    }
  };

  const handleRemoveMusic = (id: string) => {
    setUserMusic(prev => prev.filter(m => m.id !== id));
  };

  const handleTrackSelect = (track: UserMusic) => {
    console.log('Selected track:', track);
  };

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

  if (error || !video) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-slate-600 mb-4">{error || 'Video not found'}</p>
          <Button onClick={() => navigate('/videos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Videos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/videos')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{video.title}</h1>
              <p className="text-sm text-slate-500">{video.description}</p>
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
              onClick={() => setIsChatVisible(!isChatVisible)}
              variant="outline"
              leftIcon={isChatVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            >
              {isChatVisible ? 'Hide' : 'Show'} AI Chat
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex">
          {/* Timeline/Sections Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                {video.sections?.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{section.label}</h3>
                        <p className="text-sm text-slate-500">{section.description}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addNewScene(sectionIndex)}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add Scene
                      </Button>
                    </div>
                    
                    <Droppable droppableId={`section-${sectionIndex}`}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-3"
                        >
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
                                  className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                                >
                                  <div className="flex items-start space-x-3">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="mt-1 text-slate-400 hover:text-slate-600 cursor-grab"
                                    >
                                      <GripVertical className="h-5 w-5" />
                                    </div>
                                    
                                    <div className="flex-1 space-y-3">
                                      <div className="flex items-center space-x-2">
                                        {scene.type === 'text' && <Type className="h-4 w-4 text-blue-500" />}
                                        {scene.type === 'image' && <ImageIcon className="h-4 w-4 text-green-500" />}
                                        {scene.type === 'video' && <VideoIcon className="h-4 w-4 text-purple-500" />}
                                        <Input
                                          value={scene.title}
                                          onChange={(e) => updateScene(sectionIndex, sceneIndex, { title: e.target.value })}
                                          className="font-medium"
                                        />
                                      </div>
                                      
                                      <Textarea
                                        value={scene.description}
                                        onChange={(e) => updateScene(sectionIndex, sceneIndex, { description: e.target.value })}
                                        placeholder="Scene description"
                                        rows={2}
                                      />
                                      
                                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                                        <span>ID: {scene.id}</span>
                                        {scene.clipId && <span>• Clip: {scene.clipId.substring(0, 8)}...</span>}
                                        {scene.voiceId && <span>• Voice: {scene.voiceId.substring(0, 8)}...</span>}
                                      </div>
                                    </div>
                                    
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteScene(sectionIndex, sceneIndex)}
                                      leftIcon={<Trash2 className="h-4 w-4" />}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          </div>

          {/* AI Chat Panel */}
          {isChatVisible && (
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  AI Assistant
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isChatLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
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

      {/* Side Panels */}
      {activePanel === 'videos' && (
        <VideoPanel
          onAddVideo={handleAddVideo}
          onRemoveVideo={handleRemoveVideo}
          videos={sceneVideos}
          onVideoSelect={handleVideoSelect}
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
          onAddMusic={handleAddMusic}
          onRemoveMusic={handleRemoveMusic}
          tracks={userMusic}
          onTrackSelect={handleTrackSelect}
        />
      )}

      {/* Panel Toggle Buttons */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
        <Button
          variant={activePanel === 'videos' ? 'default' : 'outline'}
          onClick={() => setActivePanel(activePanel === 'videos' ? null : 'videos')}
          leftIcon={<VideoIcon className="h-4 w-4" />}
        >
          Videos
        </Button>
        <Button
          variant={activePanel === 'voices' ? 'default' : 'outline'}
          onClick={() => setActivePanel(activePanel === 'voices' ? null : 'voices')}
          leftIcon={<Mic className="h-4 w-4" />}
        >
          Voices
        </Button>
        <Button
          variant={activePanel === 'music' ? 'default' : 'outline'}
          onClick={() => setActivePanel(activePanel === 'music' ? null : 'music')}
          leftIcon={<Music className="h-4 w-4" />}
        >
          Music
        </Button>
      </div>
    </div>
  );
};

export default VideoEditor;