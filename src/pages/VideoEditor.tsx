import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided } from 'react-beautiful-dnd';
import { createPortal } from 'react-dom';
import { VideoPanel } from '../components/videos/VideoPanel';
import { MusicPanel } from '../components/music/MusicPanel';
import { VoicesPanel } from '../components/voices/VoicesPanel';
import { Video, MusicTrack, Voice } from '../types';
import { getVideos, createVideo, updateVideo, deleteVideo, uploadVideoThumbnail, uploadVideo } from '../lib/videos';
// import { Play } from 'lucide-react'; // Uncomment if using Lucide React

// Type definitions
interface Scene {
  id: number;
  type: 'text' | 'image';
  content: string;
  audio: string;
  script: string;
  sectionLabel?: string;
  title: string;
  description: string;
}

interface Section {
  label: string;
  description?: string; // Brief explanation of the section's narrative purpose
  scenes: Scene[];
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface SceneVideo extends Video {
  file: File;
  localUrl: string;
}

interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  duration: string;
  file: File;
  localUrl: string;
}

const initialSections: Section[] = [
  {
    label: 'Hook',
    description: 'Captures attention and introduces the main idea.',
    scenes: [
      { 
        id: 1, 
        type: 'text', 
        content: 'Welcome to your video!', 
        audio: 'Audio 1', 
        script: 'Script for scene 1',
        title: 'Opening Hook',
        description: 'Grab attention with key message'
      },
    ],
  },
  {
    label: 'Exposition',
    description: 'Provides background and context for the story.',
    scenes: [
      { 
        id: 2, 
        type: 'image', 
        content: 'https://placekitten.com/200/140', 
        audio: 'Audio 2', 
        script: 'Script for scene 2',
        title: 'Main Concept',
        description: 'Introduce core topic'
      },
    ],
  },
  {
    label: 'Climax',
    description: 'The most intense or important part of the story.',
    scenes: [
      { 
        id: 3, 
        type: 'text', 
        content: 'This is your second scene.', 
        audio: 'Audio 3', 
        script: 'Script for scene 3',
        title: 'Key Moment',
        description: 'Build to main point'
      },
    ],
  },
];

const assetPanels = [
  { key: 'scenes', label: 'Scenes', icon: '🎬' },
  { key: 'videos', label: 'Videos', icon: '📹' },
  { key: 'characters', label: 'Characters', icon: '🧑‍🎤' },
  { key: 'voices', label: 'Voices', icon: '🎤' },
  { key: 'music', label: 'Music', icon: '🎵' },
];

const SCENE_DURATION = 10; // seconds per scene for mockup

function flattenSections(sections: Section[]): Scene[] {
  // Returns a flat array of all scenes, with section info
  return sections.flatMap((section: Section) =>
    section.scenes.map((scene: Scene) => ({ ...scene, sectionLabel: section.label }))
  );
}

// TooltipPortal component
function TooltipPortal({ children, position }: { children: React.ReactNode, position: { top: number, left: number } | null }) {
  if (!position) return null;
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 99999,
      }}
      className="bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 rounded shadow-lg px-3 py-2 w-48 border border-slate-200 dark:border-slate-700"
    >
      {children}
    </div>,
    document.body
  );
}

export default function VideoEditor() {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [activePanel, setActivePanel] = useState('scenes');
  const [selectedSceneId, setSelectedSceneId] = useState<number>(initialSections[0].scenes[0].id);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hi! I can help you restructure your storyline or scenes. Just tell me what you want to change.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ text: string, position: { top: number, left: number } | null }>({ text: '', position: null });
  const [sceneVideos, setSceneVideos] = useState<SceneVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<SceneVideo | null>(null);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  // Flattened scenes for timeline
  const scenes: Scene[] = flattenSections(sections);
  const selectedScene = scenes.find((s: Scene) => s.id === selectedSceneId);

  // Load videos on component mount
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setIsLoadingVideos(true);
      const loadedVideos = await getVideos();
      setVideos(loadedVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      // TODO: Show error notification
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleAddVideo = async () => {
    try {
      // Create a new video with draft status
      const newVideo = await createVideo({
        title: 'Untitled Video',
        description: '',
        status: 'draft'
      });

      // Refresh the videos list
      await loadVideos();

      // TODO: Open video editor or show success notification
    } catch (error) {
      console.error('Error creating video:', error);
      // TODO: Show error notification
    }
  };

  const handleEditVideo = async (video: Video) => {
    try {
      // TODO: Implement video editing UI/modal
      console.log('Edit video:', video);
    } catch (error) {
      console.error('Error editing video:', error);
      // TODO: Show error notification
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteVideo(id);
      // Refresh the videos list
      await loadVideos();
      // TODO: Show success notification
    } catch (error) {
      console.error('Error deleting video:', error);
      // TODO: Show error notification
    }
  };

  // Add scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    // Find section and index for source and destination
    let srcSectionIdx = 0, srcSceneIdx = 0, dstSectionIdx = 0, dstSceneIdx = 0;
    let count = 0;
    for (let i = 0; i < sections.length; i++) {
      for (let j = 0; j < sections[i].scenes.length; j++) {
        if (count === result.source.index) {
          srcSectionIdx = i; srcSceneIdx = j;
        }
        if (count === result.destination.index) {
          dstSectionIdx = i; dstSceneIdx = j;
        }
        count++;
      }
    }
    // Move scene
    const newSections = sections.map(section => ({ ...section, scenes: [...section.scenes] }));
    const [removed] = newSections[srcSectionIdx].scenes.splice(srcSceneIdx, 1);
    newSections[dstSectionIdx].scenes.splice(dstSceneIdx, 0, removed);
    setSections(newSections);
    setSelectedSceneId(removed.id);
  };

  // Helper to format seconds as mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  const totalDuration = scenes.length * SCENE_DURATION;

  // Chatbot send handler with ChatGPT integration
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      // Prepare the current story structure for context
      const storyContext = sections.map(section => ({
        label: section.label,
        description: section.description,
        scenes: section.scenes.map(scene => ({
          id: scene.id,
          type: scene.type,
          content: scene.content,
          audio: scene.audio,
          script: scene.script,
          title: scene.title,
          description: scene.description
        }))
      }));

      const prompt = `You are an expert video content planner and story coach. The user wants to modify their video story structure. Here's the current structure:

${JSON.stringify(storyContext, null, 2)}

User's request: ${chatInput}

Please analyze their request and return a modified story structure as a JSON array of sections. Each section MUST have:
- label (string): The section name (e.g., 'Hook', 'Exposition', 'Climax')
- description (string): A brief, non-empty explanation of the section's narrative purpose (max 12 words, never omit or leave blank)
- scenes (array): Each scene should have:
  - id (number): Unique identifier
  - type (string): Either 'text' or 'image'
  - content (string): The main content (text or image URL)
  - audio (string): Audio description
  - script (string): The script for this scene
  - title (string): A brief, descriptive title for the scene (max 3-4 words)
  - description (string): A short description of the scene's purpose (max 10 words)

Return ONLY the JSON array, nothing else. The response should be valid JSON that can be parsed directly.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: 'You are an expert video content planner and story coach.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response from AI');
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Try to parse the response as JSON
      try {
        let newSections = JSON.parse(aiResponse);
        if (Array.isArray(newSections)) {
          // Ensure every section has a non-empty description, fallback to previous or default
          newSections = newSections.map((newSection: any) => {
            if (!newSection.description || !newSection.description.trim()) {
              // Try to find previous description by label
              const prev = sections.find(s => s.label === newSection.label);
              return {
                ...newSection,
                description: prev?.description || 'No description available.'
              };
            }
            return newSection;
          });
          setSections(newSections);
          setChatMessages(prev => [...prev, { 
            sender: 'ai', 
            text: "I've updated your story structure based on your request. The changes have been applied to your timeline." 
          }]);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        // If JSON parsing fails, show the raw response
        setChatMessages(prev => [...prev, { 
          sender: 'ai', 
          text: "I had trouble processing the changes. Here's what I was thinking:\n\n" + aiResponse 
        }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'Sorry, I encountered an error while processing your request. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSceneVideo = async (file: File) => {
    try {
      // Create a local URL for the video
      const localUrl = URL.createObjectURL(file);
      
      // Create a new scene video
      const newVideo: SceneVideo = {
        id: crypto.randomUUID(),
        title: file.name,
        description: '',
        status: 'complete',
        file,
        localUrl,
        created_at: new Date().toISOString(),
      };

      setSceneVideos(prev => [...prev, newVideo]);
    } catch (error) {
      console.error('Error adding scene video:', error);
      // TODO: Show error notification
    }
  };

  const handleRemoveSceneVideo = (id: string) => {
    setSceneVideos(prev => {
      const video = prev.find(v => v.id === id);
      if (video) {
        URL.revokeObjectURL(video.localUrl);
      }
      return prev.filter(v => v.id !== id);
    });
  };

  const handleVideoSelect = (video: SceneVideo) => {
    setSelectedVideo(video);
  };

  const handleAddMusic = async (file: File) => {
    try {
      // Create a local URL for the audio
      const localUrl = URL.createObjectURL(file);
      
      // Create a new music track
      const newTrack: MusicTrack = {
        id: crypto.randomUUID(),
        title: file.name,
        duration: '0:00', // You might want to get this from the file metadata
        file,
        localUrl,
      };

      setMusicTracks(prev => [...prev, newTrack]);
    } catch (error) {
      console.error('Error adding music track:', error);
      // TODO: Show error notification
    }
  };

  const handleRemoveMusic = (id: string) => {
    setMusicTracks(prev => {
      const track = prev.find(t => t.id === id);
      if (track) {
        URL.revokeObjectURL(track.localUrl);
      }
      return prev.filter(t => t.id !== id);
    });
  };

  const handleTrackSelect = (track: MusicTrack) => {
    setSelectedTrack(track);
  };

  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice);
  };

  // Clean up local URLs when component unmounts
  useEffect(() => {
    return () => {
      sceneVideos.forEach(video => {
        URL.revokeObjectURL(video.localUrl);
      });
      musicTracks.forEach(track => {
        URL.revokeObjectURL(track.localUrl);
      });
    };
  }, [sceneVideos, musicTracks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d1cfff] via-[#fbe2d2] to-[#e0e7ff] dark:from-purple-600 dark:to-orange-500 flex flex-col">
      {/* Breadcrumb/Cookie Crumb */}
      <nav className="w-full max-w-7xl mx-auto mt-6 mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
        <button
          onClick={() => navigate('/dashboard')}
          className="hover:underline text-purple-600 dark:text-purple-300 font-semibold"
        >
          Dashboard
        </button>
        <span className="mx-1">/</span>
        <span className="text-slate-700 dark:text-white">Video Editor</span>
      </nav>
      <div className="flex flex-1 w-full max-w-7xl mx-auto mt-2 rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-slate-900">
        {/* Asset Navigation Side Panel */}
        <nav className="w-16 bg-gradient-to-b from-[#d1cfff] via-[#fbe2d2] to-[#e0e7ff] dark:from-purple-700 dark:to-orange-900 flex flex-col items-center py-4 gap-2 border-r border-slate-200 dark:border-slate-700">
          {assetPanels.map(panel => (
            <button
              key={panel.key}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg mb-2 text-xl font-bold transition-colors ${activePanel === panel.key ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-white shadow' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              onClick={() => setActivePanel(panel.key)}
              title={panel.label}
            >
              <span>{panel.icon}</span>
              <span className="text-[10px] font-normal mt-1">{panel.label}</span>
            </button>
          ))}
        </nav>
        {/* Sidebar (only show if Scenes is selected) */}
        {activePanel === 'scenes' && (
          <aside className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col relative">
            <h2 className="p-4 font-bold text-slate-700 dark:text-white">Scenes</h2>
            <div className="flex-1 overflow-y-auto">
              {sections.map((section: Section, sIdx: number) => (
                <div key={section.label} className="mb-4">
                  <div className="px-4 py-2 text-xs font-bold uppercase text-purple-700 dark:text-purple-300 tracking-wide flex items-center gap-1">
                    {section.label}
                    <span
                      className="relative group"
                      onMouseEnter={e => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setTooltip({
                          text: section.description || 'No description',
                          position: { top: rect.bottom + 4, left: rect.left },
                        });
                      }}
                      onMouseLeave={() => setTooltip({ text: '', position: null })}
                    >
                      <svg className="w-4 h-4 text-slate-400 hover:text-purple-500 cursor-pointer ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                      </svg>
                    </span>
                  </div>
                  {section.scenes.map((scene: Scene, idx: number) => (
                    <button
                      key={scene.id}
                      className={`w-full flex flex-col items-start gap-1 px-4 py-3 text-left hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors ${selectedSceneId === scene.id ? 'bg-purple-50 dark:bg-purple-800' : ''}`}
                      onClick={() => setSelectedSceneId(scene.id)}
                    >
                      <span className="font-semibold text-slate-700 dark:text-white text-sm">
                        {scene.title?.trim() ? scene.title : 'Untitled Scene'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {scene.description?.trim() ? scene.description : 'No description'}
                      </span>
                      <span className="text-[10px] text-slate-400">Scene {scene.id}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <button className="m-4 px-4 py-2 rounded bg-gradient-to-r from-purple-500 to-orange-400 text-white font-semibold shadow hover:from-purple-600 hover:to-orange-500 transition-colors">
              + Add Scene
            </button>
          </aside>
        )}
        {activePanel === 'videos' && (
          <VideoPanel
            videos={sceneVideos}
            onAddVideo={handleAddSceneVideo}
            onRemoveVideo={handleRemoveSceneVideo}
            onVideoSelect={handleVideoSelect}
          />
        )}
        {activePanel === 'music' && (
          <MusicPanel
            tracks={musicTracks}
            onAddMusic={handleAddMusic}
            onRemoveMusic={handleRemoveMusic}
            onTrackSelect={handleTrackSelect}
          />
        )}
        {activePanel === 'voices' && (
          <VoicesPanel
            onVoiceSelect={handleVoiceSelect}
            selectedVoice={selectedVoice}
          />
        )}
        {/* Main Video Preview */}
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-2xl aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow mb-4">
            {selectedVideo ? (
              <video
                src={selectedVideo.localUrl}
                controls
                className="max-w-full max-h-full"
              />
            ) : (
              <div className="text-slate-400 dark:text-slate-600">
                Select a video to preview
              </div>
            )}
          </div>
          {/* Playback Controls */}
          <div className="flex items-center gap-4 mt-2">
            <button className="p-2 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-white shadow hover:bg-purple-200 flex items-center justify-center">
              {/* Replace with Lucide or SVG play icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25v13.5l13.5-6.75-13.5-6.75z" />
              </svg>
            </button>
            <input type="range" min={0} max={scenes.length - 1} value={scenes.findIndex((s: Scene) => s.id === selectedSceneId)} onChange={e => setSelectedSceneId(scenes[Number(e.target.value)].id)} />
            <span className="text-xs text-slate-500">{`Scene ${scenes.findIndex((s: Scene) => s.id === selectedSceneId) + 1} / ${scenes.length}`}</span>
          </div>
        </main>
        {/* Chatbot Panel - Only show when scenes tab is active */}
        {activePanel === 'scenes' && (
          <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex flex-col p-4 gap-2">
            <h2 className="font-bold text-lg text-slate-700 dark:text-white mb-2">AI Storyline Chatbot</h2>
            <div className="flex flex-col h-[500px]"> {/* Fixed height container */}
              <div className="h-[400px] overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`rounded-2xl px-4 py-2 max-w-[75%] break-words shadow-sm ${
                      msg.sender === 'ai' 
                        ? 'bg-gradient-to-br from-[#d1cfff] via-[#fbe2d2] to-[#e0e7ff] text-slate-700 dark:from-purple-600 dark:to-orange-500 dark:text-white' 
                        : 'bg-[#e6f0fa] text-slate-700'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex w-full justify-start mb-2">
                    <div className="rounded-2xl px-4 py-2 max-w-[75%] bg-gradient-to-r from-blue-400 to-purple-400 text-white dark:from-blue-700 dark:to-purple-700 dark:text-white flex items-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-300 opacity-80 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-300 opacity-80 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-300 opacity-80 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} /> {/* Scroll anchor */}
              </div>
              <div className="flex gap-2 mt-2 items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask AI to restructure your story..."
                  className="flex-1 rounded-lg border border-[#e5e7eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
                />
                <button
                  onClick={handleSendChat}
                  disabled={isLoading || !chatInput.trim()}
                  className="p-2 rounded-lg bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px] min-h-[40px]"
                  aria-label="Send Message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5L19.5 12 4.5 4.5v15z" />
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
      {/* Timeline with Scene, Script, and Music tracks */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="timeline-scenes" direction="horizontal">
          {(provided: DroppableProvided) => (
            <div className="w-full max-w-7xl mx-auto mt-2 mb-8 bg-white dark:bg-slate-900 rounded-xl shadow p-4 flex flex-col gap-2" ref={provided.innerRef} {...provided.droppableProps}>
              {/* Time Ruler */}
              <div className="flex items-end gap-2 mb-1 pl-[100px]"> {/* offset for track labels */}
                {scenes.map((scene: Scene, idx: number) => (
                  <div key={scene.id} className="w-24 flex flex-col items-center">
                    <span className="text-xs text-slate-400 font-mono">{formatTime(idx * SCENE_DURATION)}</span>
                  </div>
                ))}
                {/* End time */}
                <div className="w-24 flex flex-col items-center">
                  <span className="text-xs text-slate-400 font-mono">{formatTime(totalDuration)}</span>
                </div>
              </div>
              {/* Track labels */}
              <div className="flex flex-row gap-2 mb-1">
                <div className="w-24 text-xs font-semibold text-slate-500">Scene</div>
                <div className="w-24 text-xs font-semibold text-slate-500">Script</div>
              </div>
              {/* Tracks */}
              <div className="flex flex-col gap-2">
                {/* Scene Track */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  {scenes.map((scene: Scene, idx: number) => (
                    <Draggable key={scene.id} draggableId={scene.id.toString()} index={idx}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex flex-col items-center justify-end w-24 h-16 rounded border-2 ${selectedSceneId === scene.id ? 'border-purple-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-100 dark:bg-slate-800 mx-1 cursor-pointer`}
                          onClick={() => setSelectedSceneId(scene.id)}
                        >
                          <span className="font-semibold text-xs text-slate-700 dark:text-white mb-1">{scene.sectionLabel || 'Scene'}</span>
                          {scene.type === 'image'
                            ? <span className="text-xs text-slate-400">Image</span>
                            : <span className="text-xs text-slate-400">Text</span>
                          }
                          <span className="text-[10px] text-slate-400">Scene {idx + 1}</span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
                {/* Script Track */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  {scenes.map((scene: Scene, idx: number) => (
                    <div
                      key={scene.id}
                      className={`flex items-center justify-center w-24 h-10 rounded border-2 border-dashed ${selectedSceneId === scene.id ? 'border-purple-500' : 'border-slate-200 dark:border-slate-700'} bg-orange-50 dark:bg-orange-900 mx-1 cursor-pointer`}
                      onClick={() => setSelectedSceneId(scene.id)}
                    >
                      <span className="text-xs text-orange-700 dark:text-orange-200 truncate">{scene.script}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Music Track at the very bottom, full width */}
              <div className="mt-4 flex flex-col">
                <div className="text-xs font-semibold text-slate-500 mb-1">Music</div>
                <div className="w-full h-8 rounded bg-blue-200 dark:bg-blue-900 flex items-center pl-4 font-semibold text-blue-800 dark:text-blue-200 shadow-inner">
                  🎵 Music Track (extends full video)
                </div>
              </div>
              {/* (Optional) Add time ruler, playhead, and drag-and-drop here */}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {/* Tooltip Portal for section descriptions */}
      <TooltipPortal position={tooltip.position}>{tooltip.text}</TooltipPortal>
    </div>
  );
} 