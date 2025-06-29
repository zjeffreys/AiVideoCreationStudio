import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided } from 'react-beautiful-dnd';
import { createPortal } from 'react-dom';
import { VideoPanel } from '../components/videos/VideoPanel';
import { MusicPanel } from '../components/music/MusicPanel';
import { VoicesPanel } from '../components/voices/VoicesPanel';
import { Video as VideoType, Voice, Character } from '../types/index';
import { getVideos, createVideo, updateVideo, deleteVideo, uploadVideoThumbnail, uploadVideo } from '../lib/videos';
import { Toast } from '../components/ui/Toast';
import { getUserClips, uploadClip, deleteClip, UserClip } from '../lib/clips';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { AddMediaModal } from '../components/videos/AddMediaModal';
import { Video as VideoIcon, Mic, Music, Pencil, RefreshCw, PlusCircle, Search, Users, Trash, Sparkles, Play, Download } from 'lucide-react';
import { getVoice, generateSpeech } from '../lib/elevenlabs';
import { getUserMusic, uploadMusic, UserMusic } from '../lib/music';
import { CharacterCard } from '../components/characters/CharacterCard';
import { CharacterForm } from '../components/characters/CharacterForm';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
// import { Play } from 'lucide-react'; // Uncomment if using Lucide React

// Type definitions
type SceneId = string;
interface Scene {
  id: SceneId;
  type: 'text' | 'image' | 'video';
  content: string;
  audio: string;
  script: string;
  sectionLabel?: string;
  title: string;
  description: string;
  music?: string;
  clipId?: string;
  voiceId?: string;
  musicId?: string;
  subtitles?: string;
  voiceoverUrl?: string; // Add this line for voiceover caching
}

export interface Section {
  label: string;
  description: string;
  scenes: Scene[];
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// Use the SceneVideo type from VideoPanel to avoid conflicts
interface VideoPanelSceneVideo extends VideoType {
  file: File;
  localUrl: string;
  id: string;
  title: string;
  thumbnail_url?: string;
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
        id: '1', 
        type: 'text', 
        content: 'Welcome to your video!', 
        audio: 'Audio 1', 
        script: 'Script for scene 1',
        title: 'Opening Hook',
        description: 'Grab attention with key message',
        voiceId: 'flHkNRp1BlvT73UL6gyz'
      },
    ],
  },
  {
    label: 'Exposition',
    description: 'Provides background and context for the story.',
    scenes: [
      { 
        id: '2', 
        type: 'image', 
        content: 'https://placekitten.com/200/140', 
        audio: 'Audio 2', 
        script: 'Script for scene 2',
        title: 'Main Concept',
        description: 'Introduce core topic',
        voiceId: 'flHkNRp1BlvT73UL6gyz'
      },
    ],
  },
  {
    label: 'Climax',
    description: 'The most intense or important part of the story.',
    scenes: [
      { 
        id: '3', 
        type: 'text', 
        content: 'This is your second scene.', 
        audio: 'Audio 3', 
        script: 'Script for scene 3',
        title: 'Key Moment',
        description: 'Build to main point',
        voiceId: 'flHkNRp1BlvT73UL6gyz'
      },
    ],
  },
];

const assetPanels = [
  { key: 'scenes', label: 'Scenes', icon: '🎬' },
  { key: 'clips', label: 'Clips', icon: '📹' },
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

// Get backend URL from environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND_URL) {
  console.warn('Missing backend URL - video generation will be disabled');
}

export default function VideoEditor() {
  const { user } = useAuth();
  const { videoId } = useParams();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [activePanel, setActivePanel] = useState('scenes');
  const [selectedSceneId, setSelectedSceneId] = useState<SceneId>(initialSections[0].scenes[0].id);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hi! I can help you restructure your storyline or scenes. Just tell me what you want to change.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ text: string, position: { top: number, left: number } | null }>({ text: '', position: null });
  const [sceneVideos, setSceneVideos] = useState<VideoPanelSceneVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoPanelSceneVideo | null>(null);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [userClips, setUserClips] = useState<UserClip[]>([]);
  const [isLoadingClips, setIsLoadingClips] = useState(false);
  const [clipToDelete, setClipToDelete] = useState<UserClip | null>(null);
  const [clipUrls, setClipUrls] = useState<Record<string, { localUrl: string; thumbnail_url?: string }>>({});
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [editingScriptSceneId, setEditingScriptSceneId] = useState<string | null>(null);
  const [editingScriptText, setEditingScriptText] = useState('');
  const [editingScriptVoiceId, setEditingScriptVoiceId] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [isEditingVideoInfo, setIsEditingVideoInfo] = useState(false);
  const [editingVideoTitle, setEditingVideoTitle] = useState('');
  const [editingVideoDescription, setEditingVideoDescription] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  // Voice preview system disabled - commented out unused state
  // const [voicePreviews, setVoicePreviews] = useState<Record<string, string>>({}); // sceneId -> audioUrl
  // const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [voicePreviews, setVoicePreviews] = useState<Record<string, string>>({}); // sceneId -> audioUrl
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [userMusic, setUserMusic] = useState<UserMusic[]>([]);
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [characterSearchQuery, setCharacterSearchQuery] = useState('');
  const [characterLoading, setCharacterLoading] = useState(true);
  const [characterError, setCharacterError] = useState<string | null>(null);
  const [isCharacterFormOpen, setIsCharacterFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | undefined>(undefined);
  const [isGeneratingAIScenes, setIsGeneratingAIScenes] = useState(false);
  // Add state for video generation
  const [isGeneratingFinalVideo, setIsGeneratingFinalVideo] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  // Add state for voiceover caching
  const [voiceoverUrls, setVoiceoverUrls] = useState<Record<string, string>>({}); // sceneId -> voiceoverUrl
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  
  // Add new state for job-based video generation
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'queued' | 'processing' | 'completed' | 'failed'>('idle');
  const [jobProgress, setJobProgress] = useState(0);
  const [jobError, setJobError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Flattened scenes for timeline
  const scenes: Scene[] = flattenSections(sections);
  const selectedScene = scenes.find((s: Scene) => s.id === selectedSceneId);

  // Load a specific video if videoId is present
  useEffect(() => {
    if (videoId) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('id', videoId)
            .single();
          console.log('Loaded video data:', data);
          if (data && data.sections) {
            console.log('Loaded sections:', data.sections);
          } else {
            console.warn('No sections found in loaded video data.');
          }
          if (error) throw error;
          if (data) {
            setVideos([data]);
            // Optionally, load sections from data.sections if present
            if (data.sections) {
              setSections(data.sections);
              console.log('Set sections to:', data.sections);
            }
          }
        } catch (err) {
          console.error('Error loading video by ID:', err);
          setVideos([]);
        }
      })();
    } else {
      loadVideos();
    }
  }, [videoId]);

  // Load user clips on component mount
  useEffect(() => {
    if (user) {
      console.log('Loading user clips on mount...');
      loadUserClips();
    }
  }, [user]);

  // Fetch signed URLs for user clips
  useEffect(() => {
    async function fetchClipUrls() {
      if (!userClips.length) return;
      const urlMap: Record<string, { localUrl: string; thumbnail_url?: string }> = {};
      for (const clip of userClips) {
        // Get signed URL for video file
        let localUrl = '';
        if (clip.file_path) {
          // Extract the path after the bucket name
          const filePath = clip.file_path.includes('/object/public/user-clips/')
            ? clip.file_path.split('/object/public/user-clips/')[1]
            : clip.file_path.split('/user-clips/')[1] || clip.file_path;
          const { data } = await supabase.storage.from('user-clips').createSignedUrl(filePath, 60);
          localUrl = data?.signedUrl || '';
        }
        // Get signed URL for thumbnail
        let thumbnail_url = '';
        if (clip.thumbnail_url) {
          const thumbPath = clip.thumbnail_url.includes('/object/public/clip-thumbnails/')
            ? clip.thumbnail_url.split('/object/public/clip-thumbnails/')[1]
            : clip.thumbnail_url.split('/clip-thumbnails/')[1] || clip.thumbnail_url;
          const { data } = await supabase.storage.from('clip-thumbnails').createSignedUrl(thumbPath, 60);
          thumbnail_url = data?.signedUrl || '';
        }
        urlMap[clip.id] = { localUrl, thumbnail_url };
      }
      setClipUrls(urlMap);
    }
    fetchClipUrls();
  }, [userClips]);

  // Load voices on mount
  useEffect(() => {
    async function fetchVoices() {
      try {
        const voices = await getVoice();
        setAvailableVoices(voices);
      } catch (error) {
        setAvailableVoices([]);
      }
    }
    fetchVoices();
  }, []);

  // Load user music on mount
  useEffect(() => {
    if (user) {
      setIsLoadingMusic(true);
      getUserMusic()
        .then(setUserMusic)
        .catch(() => setUserMusic([]))
        .finally(() => setIsLoadingMusic(false));
    }
  }, [user]);

  // When selectedMusicId changes, set musicUrl
  useEffect(() => {
    async function fetchMusicUrl() {
      const track = userMusic.find(m => m.id === selectedMusicId);
      if (track?.file_path) {
        // Extract the path after the bucket name
        const filePath = track.file_path.includes('/object/public/user-music/')
          ? track.file_path.split('/object/public/user-music/')[1]
          : track.file_path.split('/user-music/')[1] || track.file_path;
        const { data } = await supabase.storage.from('user-music').createSignedUrl(filePath, 60);
        setMusicUrl(data?.signedUrl || null);
      } else {
        setMusicUrl(null);
      }
    }
    fetchMusicUrl();
  }, [selectedMusicId, userMusic]);

  // On load, if the video has a musicid, set it as the selected music
  useEffect(() => {
    if (videos[0]?.musicid) {
      setSelectedMusicId(videos[0].musicid);
    }
  }, [videos]);

  // Add polling function for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/job-status/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check job status: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Job status response:', result);
      
      setJobStatus(result.status);
      setJobProgress(result.progress || 0);
      
      if (result.status === 'completed' && result.video_url) {
        // Job completed successfully
        setGeneratedVideoUrl(result.video_url);
        setJobStatus('completed');
        
        // Update video status in database
        if (videos[0]) {
          try {
            const updateData = {
              status: 'complete' as const,
              final_video_url: result.video_url,
              last_generated_at: new Date().toISOString(),
            };
            
            await updateVideo(videos[0].id, updateData);
            
            // Update local state
            setVideos(prev => prev.map(video => 
              video.id === videos[0].id 
                ? { ...video, ...updateData }
                : video
            ));
            
            setToast({ message: 'Final video generated and saved successfully!', type: 'success' });
          } catch (error) {
            console.error('Error updating video status:', error);
            setToast({ message: 'Video generated but failed to save status', type: 'error' });
          }
        }
        
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        setIsGeneratingFinalVideo(false);
        setGenerationProgress('');
        setCurrentJobId(null);
        
      } else if (result.status === 'failed') {
        // Job failed
        setJobError(result.error || 'Unknown error occurred');
        setJobStatus('failed');
        
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        setIsGeneratingFinalVideo(false);
        setGenerationProgress('');
        setCurrentJobId(null);
        
        setToast({ 
          message: result.error || 'Video generation failed', 
          type: 'error' 
        });
        
      } else if (result.status === 'queued') {
        setGenerationProgress('Job queued, starting processing...');
      } else if (result.status === 'processing') {
        setGenerationProgress(`Processing video... ${result.progress || 0}%`);
      }
      
    } catch (error) {
      console.error('Error polling job status:', error);
      setJobError(error instanceof Error ? error.message : 'Failed to check job status');
    }
  }, [videos, pollingInterval]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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

  const loadUserClips = useCallback(async () => {
    try {
      setIsLoadingClips(true);
      console.log('Fetching user clips...');
      const clips = await getUserClips();
      console.log('Fetched clips:', clips);
      setUserClips(clips);
    } catch (error) {
      console.error('Error loading clips:', error);
      setToast({ message: 'Error loading clips', type: 'error' });
    } finally {
      setIsLoadingClips(false);
    }
  }, []);

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

  const handleEditVideo = async (video: VideoType) => {
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
          description: scene.description,
          clipId: scene.clipId || null,
          voiceId: scene.voiceId || null,
          musicId: scene.musicId || null,
        }))
      }));

      const prompt = `You are an expert video content planner and story coach. The user wants to modify their video story structure. Here's the current structure:

${JSON.stringify(storyContext, null, 2)}

User's request: ${chatInput}

CRITICAL INSTRUCTIONS:
1. You can modify ANY aspect of the story structure including scripts, titles, descriptions, and scene order.
2. When writing scripts, make them engaging, conversational, and appropriate for video narration (2-3 sentences max per scene).
3. You can add, remove, or reorder scenes. Scene 'id' values will be automatically re-numbered based on their final position, so you do not need to preserve them.
4. When moving or modifying a scene, you MUST preserve its associated media attachments (clipId, voiceId, musicId) unless the user explicitly asks you to remove or change them.
5. Return ONLY valid JSON - no explanations, no markdown formatting, just pure JSON.

Return a JSON array of sections. Each section MUST have:
- label (string): Section name (e.g., 'Hook', 'Exposition', 'Climax')
- description (string): Brief explanation of section purpose (max 12 words)
- scenes (array): Each scene must have:
  - id (string): A unique identifier for the scene. You can use the original ID for existing scenes and a placeholder for new ones. This will be re-numbered automatically.
  - type (string): 'text', 'image', or 'video'
  - content (string): Main content (text, image URL, or video URL)
  - audio (string): Audio description or voice ID
  - script (string): Engaging narration script for this scene (2-3 sentences, conversational tone)
  - title (string): Brief descriptive title (3-4 words)
  - description (string): Scene purpose description (max 10 words)
  - clipId (string|null): PRESERVE existing video clip ID.
  - voiceId (string|null): PRESERVE existing voice ID.
  - musicId (string|null): PRESERVE existing music ID.

EXAMPLE SCRIPT FORMAT:
"Welcome to our comprehensive guide on video creation. Today we'll explore the essential techniques that will transform your content from ordinary to extraordinary."

Return ONLY the JSON array. No markdown, no explanations, no code blocks.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Updated to latest model
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert video content planner and story coach. You ALWAYS return valid JSON arrays. You NEVER use markdown formatting or add explanations outside the JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response from AI');
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Enhanced JSON parsing with better error handling
      let newSections;
      try {
        // Clean the response to extract JSON
        let jsonString = aiResponse.trim();
        
        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/```json\n?/, '').replace(/\n?```/, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```\n?/, '').replace(/\n?```/, '');
        }
        
        // Try to find JSON array in the response
        const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        newSections = JSON.parse(jsonString);
        
        if (!Array.isArray(newSections)) {
          throw new Error('Response is not an array');
        }
        
        // Renumber all scenes sequentially and validate structure
        let sceneCounter = 1;
        newSections = newSections.map((section: any, sectionIndex: number) => {
          if (!section || typeof section !== 'object') {
            throw new Error(`Invalid section at index ${sectionIndex}`);
          }
          
          return {
            label: section.label || `Section ${sectionIndex + 1}`,
            description: section.description || 'No description',
            scenes: Array.isArray(section.scenes) ? section.scenes.map((scene: any, sceneIndex: number) => {
              if (!scene || typeof scene !== 'object') {
                throw new Error(`Invalid scene at section ${sectionIndex}, scene ${sceneIndex}`);
              }
              
              return {
                id: String(sceneCounter++), // Always re-number
                type: ['text', 'image', 'video'].includes(scene.type) ? scene.type : 'text',
                content: scene.content || '',
                audio: scene.audio || '',
                script: scene.script || '',
                title: scene.title || `Scene ${sceneIndex + 1}`,
                description: scene.description || 'No description',
                clipId: scene.clipId || null,
                voiceId: scene.voiceId || null,
                musicId: scene.musicId || null,
              };
            }) : []
          };
        });
        
        setSections(newSections);
        
        // Automatically save the updated sections to the database
        if (videos[0]) {
          try {
            await updateVideo(videos[0].id, { sections: newSections });
            // Reload user clips to ensure clipUrls are updated with any new clips
            await loadUserClips();
            setToast({ message: 'Scenes updated and saved successfully', type: 'success' });
          } catch (err) {
            setToast({ message: 'Failed to save scene updates', type: 'error' });
          }
        }
        
        // Provide more specific feedback based on what was changed
        const scriptChanges = newSections.some(section => 
          section.scenes.some((scene: any) => scene.script && scene.script.trim())
        );
        
        const responseText = scriptChanges 
          ? "I've updated your story structure and added engaging scripts to your scenes. The changes have been applied to your timeline."
          : "I've updated your story structure based on your request. The changes have been applied to your timeline.";
        
        setChatMessages(prev => [...prev, { 
          sender: 'ai', 
          text: responseText
        }]);
        
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw AI response:', aiResponse);
        
        // Try to provide helpful error message
        let errorMessage = "I had trouble processing the changes. ";
        
        if (aiResponse.includes('```') || aiResponse.includes('json')) {
          errorMessage += "The response contained formatting that couldn't be parsed. ";
        } else if (aiResponse.includes('[') && aiResponse.includes(']')) {
          errorMessage += "The JSON structure was invalid. ";
        } else {
          errorMessage += "The response wasn't in the expected format. ";
        }
        
        errorMessage += "Here's what I was thinking:\n\n" + aiResponse;
        
        setChatMessages(prev => [...prev, { 
          sender: 'ai', 
          text: errorMessage
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
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
      if (!user) {
        throw new Error('User must be logged in');
      }

      console.log('Starting clip upload process...');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Check file size (10MB limit)
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 100MB');
      }

      // Check video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const durationCheck = new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('Video duration:', video.duration);
          if (video.duration > 10) { // 10 seconds limit
            reject(new Error('Video duration must be less than 10 seconds'));
          }
          resolve(true);
        };
        video.onerror = () => reject(new Error('Error loading video'));
      });

      video.src = URL.createObjectURL(file);
      await durationCheck;
      URL.revokeObjectURL(video.src);

      console.log('Uploading clip to Supabase...');
      // Upload the clip
      const clip = await uploadClip(file, file.name);
      console.log('Clip uploaded successfully:', clip);
      
      // Refresh clips list
      console.log('Refreshing clips list...');
      await loadUserClips();
      
      setToast({ message: 'Video clip added successfully', type: 'success' });
    } catch (error) {
      console.error('Error adding video clip:', error);
      setToast({ message: error instanceof Error ? error.message : 'Error adding video clip', type: 'error' });
    }
  };

  const handleRemoveSceneVideo = async (id: string) => {
    try {
      // Find the clip to delete
      const clip = userClips.find(c => c.id === id);
      if (!clip) return;

      // Set the clip to delete and show confirmation dialog
      setClipToDelete(clip);
    } catch (error) {
      console.error('Error preparing to remove video clip:', error);
      setToast({ message: error instanceof Error ? error.message : 'Error preparing to remove video clip', type: 'error' });
    }
  };

  const confirmDeleteClip = async () => {
    if (!clipToDelete) return;

    try {
      await deleteClip(clipToDelete.id);
      await loadUserClips();
      setToast({ message: 'Video clip removed successfully', type: 'success' });
    } catch (error) {
      console.error('Error removing video clip:', error);
      setToast({ message: error instanceof Error ? error.message : 'Error removing video clip', type: 'error' });
    } finally {
      setClipToDelete(null);
    }
  };

  const cancelDeleteClip = () => {
    setClipToDelete(null);
  };

  const handleVideoSelect = (video: VideoPanelSceneVideo) => {
    setSelectedVideo(video);
  };

  const handleAddMusic = async (file: File) => {
    try {
      setIsLoadingMusic(true);
      const newTrack = await uploadMusic(file);
      setUserMusic(prev => [newTrack, ...prev]);
      setToast({ message: 'Music uploaded successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error uploading music', type: 'error' });
    } finally {
      setIsLoadingMusic(false);
    }
  };

  // Handle music select and save to DB
  const handleTrackSelect = async (track: UserMusic) => {
    setSelectedMusicId(track.id);
    setToast({ message: 'Music selected for preview', type: 'success' });
    // Save to DB if a video is loaded
    if (videos[0]) {
      try {
        await updateVideo(videos[0].id, { musicid: track.id });
        setToast({ message: 'Music selection saved', type: 'success' });
      } catch (err) {
        setToast({ message: 'Failed to save music selection', type: 'error' });
      }
    }
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
      // Clean up generated video URL
      if (generatedVideoUrl) {
        URL.revokeObjectURL(generatedVideoUrl);
      }
    };
  }, [sceneVideos, musicTracks, generatedVideoUrl]);

  const handleAddClipToScene = (clip: VideoPanelSceneVideo) => {
    // Update the scene with the selected clip
    const newSections = sections.map(section => ({
      ...section,
      scenes: section.scenes.map(scene => {
        if (scene.id === selectedSceneId) {
          return {
            ...scene,
            type: 'video' as const,
            content: clip.localUrl,
            title: clip.title,
            description: clip.description || '',
          };
        }
        return scene;
      }),
    }));
    setSections(newSections);
    setToast({ message: 'Clip added to scene', type: 'success' });
  };

  const handleAddVoiceToScene = (voice: Voice) => {
    // Update the scene with the selected voice
    const newSections = sections.map(section => ({
      ...section,
      scenes: section.scenes.map(scene => {
        if (scene.id === selectedSceneId) {
          return {
            ...scene,
            audio: voice.id,
          };
        }
        return scene;
      }),
    }));
    setSections(newSections);
    setToast({ message: 'Voice added to scene', type: 'success' });
  };

  const handleAddMusicToScene = (track: MusicTrack) => {
    // Update the scene with the selected music
    const newSections = sections.map(section => ({
      ...section,
      scenes: section.scenes.map(scene => {
        if (scene.id === selectedSceneId) {
          return {
            ...scene,
            music: track.id,
          };
        }
        return scene;
      }),
    }));
    setSections(newSections);
    setToast({ message: 'Music added to scene', type: 'success' });
  };

  // Add duplicate id check before rendering timeline scenes
  const sceneIds = scenes.map(s => s.id);
  const duplicateIds = sceneIds.filter((id, idx) => sceneIds.indexOf(id) !== idx);
  if (duplicateIds.length) {
    console.warn('Duplicate scene ids found:', duplicateIds);
  }

  // Timeline scene click handler
  const handleTimelineSceneClick = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    setIsAddMediaModalOpen(true);
  };

  // Add media to scene by id in nested sections
  const handleAddMediaToScene = async (sceneId: string, media: { clipId?: string; voiceId?: string; musicId?: string; type?: 'video' | 'text' | 'image' }) => {
    const newSections = sections.map(section => ({
      ...section,
      scenes: section.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, ...media } : scene
      )
    }));
    
    setSections(newSections);
    
    // Save to DB if a video is loaded
    if (videos[0]) {
      try {
        await updateVideo(videos[0].id, { sections: newSections });
        // Reload user clips to ensure clipUrls are updated with any new clips
        await loadUserClips();
      } catch (err) {
        setToast({ message: 'Failed to save scene media', type: 'error' });
      }
    }
    
    setIsAddMediaModalOpen(false);
  };

  const tabs = [
    { id: 'clips', label: 'Clips', icon: <VideoIcon className="h-4 w-4" /> },
  ];

  // Gather ordered list of video URLs from scenes with a valid clipId
  const previewClips = scenes
    .map(scene => scene.clipId && clipUrls[scene.clipId]?.localUrl ? ({
      sceneId: scene.id,
      url: clipUrls[scene.clipId].localUrl,
      title: scene.title || 'Untitled Scene',
    }) : null)
    .filter(Boolean) as { sceneId: string, url: string, title: string }[];

  // Handle advancing to next clip
  const handlePreviewEnded = () => {
    if (previewIndex < previewClips.length - 1) {
      setPreviewIndex(previewIndex + 1);
      setIsPreviewPlaying(true);
    } else {
      setIsPreviewPlaying(false);
    }
  };

  // Auto-play next video when previewIndex changes
  useEffect(() => {
    if (isPreviewPlaying && previewVideoRef.current) {
      previewVideoRef.current.play();
    }
  }, [previewIndex, isPreviewPlaying]);

  // Generate or fetch voice preview for the current preview scene
  // DISABLED: Voice preview system causing infinite loops and not required
  // useEffect(() => {
  //   const scene = scenes.find(s => s.id === previewClips[previewIndex]?.sceneId);
  //   if (!scene || !scene.script) return;
  //   
  //   // Only generate voice preview if we have a saved voiceover URL
  //   if (voicePreviews[scene.id]) return; // Already cached
  //   
  //   setIsVoiceLoading(true);
  //   (async () => {
  //     try {
  //       // Only check for cached voiceover URL - don't generate new ones for preview
  //       const cachedVoiceoverUrl = await getVoiceoverUrl(scene.id);
  //       
  //       if (cachedVoiceoverUrl) {
  //         // Use cached voiceover
  //         console.log(`🎵 Using cached voiceover for preview scene ${scene.id}`);
  //         setVoicePreviews(prev => ({ ...prev, [scene.id]: cachedVoiceoverUrl }));
  //       } else {
  //         // No cached voiceover - don't generate one for preview
  //         console.log(`🔇 No cached voiceover for scene ${scene.id} - skipping preview generation`);
  //         setVoicePreviews(prev => ({ ...prev, [scene.id]: '' }));
  //       }
  //     } catch (err) {
  //       console.error('Voice preview error:', err);
  //       setVoicePreviews(prev => ({ ...prev, [scene.id]: '' }));
  //     } finally {
  //       setIsVoiceLoading(false);
  //     }
  //   })();
  // }, [previewIndex, previewClips, scenes]); // Removed voicePreviews from dependencies

  // Fetch cached voiceover for preview (only fetch, don't generate)
  useEffect(() => {
    const scene = scenes.find(s => s.id === previewClips[previewIndex]?.sceneId);
    if (!scene || !scene.script) return;
    
    // Skip if already loaded
    if (voicePreviews[scene.id]) return;
    
    setIsVoiceLoading(true);
    (async () => {
      try {
        // Only fetch cached voiceover URL from Supabase
        const cachedVoiceoverUrl = await getVoiceoverUrl(scene.id);
        
        if (cachedVoiceoverUrl) {
          console.log(`🎵 Loading cached voiceover for preview scene ${scene.id}`);
          setVoicePreviews(prev => ({ ...prev, [scene.id]: cachedVoiceoverUrl }));
        } else {
          console.log(`🔇 No cached voiceover for scene ${scene.id} - using silent audio`);
          // Use a silent audio file as fallback to prevent audio errors
          const silentAudioUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
          setVoicePreviews(prev => ({ ...prev, [scene.id]: silentAudioUrl }));
        }
      } catch (err) {
        console.error('Error loading cached voiceover:', err);
        // Use silent audio as fallback
        const silentAudioUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        setVoicePreviews(prev => ({ ...prev, [scene.id]: silentAudioUrl }));
      } finally {
        setIsVoiceLoading(false);
      }
    })();
  }, [previewIndex, previewClips]); // Removed 'scenes' from dependencies to prevent infinite loop

  // Play audio in sync with video
  // DISABLED: Voice preview system disabled
  // useEffect(() => {
  //   const scene = scenes.find(s => s.id === previewClips[previewIndex]?.sceneId);
  //   if (!scene || !scene.voiceId || !scene.script) return;
  //   const audioUrl = voicePreviews[scene.id];
  //   if (!audioUrl) return;
  //   const audio = new Audio(audioUrl);
  //   if (isPreviewPlaying) {
  //     audio.play();
  //   }
  //   // Pause audio when video is paused
  //   const handlePause = () => audio.pause();
  //   previewVideoRef.current?.addEventListener('pause', handlePause);
  //   // Clean up
  //   return () => {
  //     audio.pause();
  //     previewVideoRef.current?.removeEventListener('pause', handlePause);
  //   };
  // }, [previewIndex, isPreviewPlaying, previewClips, scenes, voicePreviews]);

  // Play cached voiceover audio in sync with video
  useEffect(() => {
    const scene = scenes.find(s => s.id === previewClips[previewIndex]?.sceneId);
    if (!scene || !scene.script) return;
    
    const audioUrl = voicePreviews[scene.id];
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    
    if (isPreviewPlaying) {
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
    
    // Pause audio when video is paused
    const handlePause = () => audio.pause();
    previewVideoRef.current?.addEventListener('pause', handlePause);
    
    // Clean up
    return () => {
      audio.pause();
      previewVideoRef.current?.removeEventListener('pause', handlePause);
    };
  }, [previewIndex, isPreviewPlaying, previewClips, scenes, voicePreviews]);

  // Sync music playback with preview controls
  useEffect(() => {
    if (!musicAudioRef.current) return;
    if (isPreviewPlaying) {
      // If starting preview from the first clip, reset music to start
      if (previewIndex === 0) {
        musicAudioRef.current.currentTime = 0;
      }
      musicAudioRef.current.play();
    } else {
      musicAudioRef.current.pause();
    }
  }, [isPreviewPlaying, previewIndex, musicUrl]);

  // Stop music at the end of the last clip
  useEffect(() => {
    if (!musicAudioRef.current) return;
    if (previewIndex === previewClips.length - 1 && !isPreviewPlaying) {
      musicAudioRef.current.pause();
      musicAudioRef.current.currentTime = 0;
    }
  }, [previewIndex, isPreviewPlaying, previewClips.length]);

  // Set music audio volume when musicUrl changes
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = 0.2; // 20% volume for background music
    }
  }, [musicUrl]);

  // Fetch characters and voices
  const fetchCharactersData = async () => {
    setCharacterLoading(true);
    setCharacterError(null);
    try {
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');
      if (charactersError) throw charactersError;
      const voicesData = await getVoice();
      setCharacters(charactersData as Character[]);
      setVoices(voicesData);
    } catch (error) {
      if (error instanceof Error) {
        setCharacterError(error.message);
      } else {
        setCharacterError('An error occurred while fetching data');
      }
    } finally {
      setCharacterLoading(false);
    }
  };

  useEffect(() => {
    if (user && activePanel === 'characters') {
      fetchCharactersData();
    }
  }, [user, activePanel]);

  const handleCharacterSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setIsCharacterFormOpen(true);
  };

  const handleDeleteCharacter = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      try {
        const { error } = await supabase
          .from('characters')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchCharactersData();
      } catch (error) {
        if (error instanceof Error) {
          setCharacterError(error.message);
        } else {
          setCharacterError('An error occurred while deleting the character');
        }
      }
    }
  };

  const handleCharacterFormSubmit = () => {
    setIsCharacterFormOpen(false);
    setEditingCharacter(undefined);
    fetchCharactersData();
  };

  const handleCharacterFormCancel = () => {
    setIsCharacterFormOpen(false);
    setEditingCharacter(undefined);
  };

  const filteredCharacters = characterSearchQuery
    ? characters.filter(character =>
        character.name.toLowerCase().includes(characterSearchQuery.toLowerCase()) ||
        (character.personality && character.personality.toLowerCase().includes(characterSearchQuery.toLowerCase()))
      )
    : characters;

  const generateAIScenes = async () => {
    if (!videos[0]?.description) {
      setToast({ message: 'No description found for this video', type: 'error' });
      return;
    }
    setIsGeneratingAIScenes(true);
    try {
      const prompt = `Based on this video description: "${videos[0].description}"

Generate a structured video outline with 3 sections (like Hook, Exposition, Climax, etc.) and 1-2 scenes per section. 

Return as a JSON array of sections. Each section must have:
- label (string): The section name (e.g., 'Hook', 'Exposition', 'Climax')
- description (string): A brief explanation of the section's purpose
- scenes (array): Each scene must have:
  - id (string): A placeholder scene identifier (e.g., 'scene-1'). This will be automatically re-numbered.
  - type (string): Either 'text', 'image', or 'video'
  - content (string): The main content (text content, image URL, or video URL)
  - audio (string): Audio description or voice ID
  - script (string): The script for this scene one brief sentence
  - title (string): A brief, descriptive title for the scene (3-4 words)
  - description (string): A short description of the scene's purpose
  - music (string): Optional music ID
  - clipId (string): Optional video clip ID
  - voiceId (string): Set to "flHkNRp1BlvT73UL6gyz" for all scenes (valid ElevenLabs voice ID)
  - musicId (string): Optional music ID
  - subtitles (string): Optional subtitle text

IMPORTANT: Always set voiceId to "flHkNRp1BlvT73UL6gyz" for all scenes to ensure valid voice generation.

Example structure:
[
  {
    "label": "Hook",
    "description": "Captures attention and introduces the main idea",
    "scenes": [
      {
        "id": "scene-1",
        "type": "text",
        "content": "Welcome to our video about...",
        "audio": "",
        "script": "Welcome to our comprehensive guide on...",
        "title": "Opening Hook",
        "description": "Grab attention with key message",
        "music": "",
        "clipId": "",
        "voiceId": "flHkNRp1BlvT73UL6gyz",
        "musicId": "",
        "subtitles": ""
      }
    ]
  }
]

Return ONLY the JSON array, nothing else.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert video content planner. Generate structured video outlines with proper JSON formatting.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate scenes');
      const data = await response.json();
      console.log('OpenAI API response:', data);
      
      const aiResponse = data.choices[0].message.content;
      console.log('AI Response content:', aiResponse);
      
      try {
        // Try to extract JSON from the response (in case AI added extra text)
        let jsonString = aiResponse.trim();
        
        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/```json\n?/, '').replace(/\n?```/, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```\n?/, '').replace(/\n?```/, '');
        }
        
        // Try to find JSON array in the response
        const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        console.log('Extracted JSON string:', jsonString);
        
        const newSections = JSON.parse(jsonString);
        console.log('Parsed sections:', newSections);
        
        // Validate that we have an array of sections
        if (!Array.isArray(newSections)) {
          throw new Error('AI response is not an array of sections');
        }
        
        // Validate, ensure all required fields are present, and re-number scenes
        let sceneCounter = 1;
        const validatedSections = newSections.map((section: any, sectionIndex: number) => {
          if (!section.scenes || !Array.isArray(section.scenes)) {
            console.warn(`Section ${sectionIndex} has no scenes array:`, section);
            return {
              label: section.label || `Section ${sectionIndex + 1}`,
              description: section.description || 'No description',
              scenes: []
            };
          }
          
          return {
            label: section.label || `Section ${sectionIndex + 1}`,
            description: section.description || 'No description',
            scenes: section.scenes.map((scene: any, sceneIndex: number) => ({
              id: String(sceneCounter++), // Re-number sequentially
              type: scene.type || 'text',
              content: scene.content || '',
              audio: scene.audio || '',
              script: scene.script || '',
              title: scene.title || `Scene ${sceneIndex + 1}`,
              description: scene.description || 'No description',
              music: scene.music || '',
              clipId: scene.clipId || '',
              voiceId: scene.voiceId || '',
              musicId: scene.musicId || '',
              subtitles: scene.subtitles || '',
            }))
          };
        });
        
        console.log('Validated sections:', validatedSections);
        
        setSections(validatedSections);
        if (videos[0]) {
          await updateVideo(videos[0].id, { sections: validatedSections });
          // Reload user clips to ensure clipUrls are updated with any new clips
          await loadUserClips();
          setToast({ message: 'AI scenes generated and saved!', type: 'success' });
        }
      } catch (error) {
        console.error('Error parsing AI response:', error);
        console.error('Raw AI response:', aiResponse);
        setToast({ message: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error generating AI scenes:', error);
      setToast({ message: 'Failed to generate AI scenes', type: 'error' });
    } finally {
      setIsGeneratingAIScenes(false);
    }
  };

  // Load user clips when clips panel becomes active
  useEffect(() => {
    if (user && activePanel === 'clips') {
      loadUserClips();
    }
  }, [user, activePanel, loadUserClips]);

  // Voiceover caching functions
  const generateAndSaveVoiceover = async (sceneId: string, script: string, voiceId: string) => {
    if (!user) {
      setToast({ message: 'User must be logged in', type: 'error' });
      return;
    }

    setIsGeneratingVoiceover(true);
    try {
      console.log(`🎤 Generating voiceover for scene ${sceneId}...`);
      
      // Generate voiceover using ElevenLabs
      const audioUrl = await generateSpeech(script, voiceId);
      
      // Download the audio blob
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch voiceover: ${response.statusText}`);
      const audioBlob = await response.blob();
      
      // Create a file from the blob
      const audioFile = new File([audioBlob], `voiceover-${sceneId}.mp3`, { type: 'audio/mpeg' });
      
      // Upload to Supabase voiceovers bucket
      const fileName = `${user.id}/voiceover-${sceneId}-${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voiceovers')
        .upload(fileName, audioFile);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('voiceovers')
        .getPublicUrl(fileName);
      
      const voiceoverUrl = urlData.publicUrl;
      
      // Update the scene with the voiceover URL
      const newSections = sections.map(section => ({
        ...section,
        scenes: section.scenes.map(scene =>
          scene.id === sceneId
            ? { ...scene, voiceoverUrl }
            : scene
        )
      }));
      
      setSections(newSections);
      setVoiceoverUrls(prev => ({ ...prev, [sceneId]: voiceoverUrl }));
      
      // Save to database
      if (videos[0]) {
        await updateVideo(videos[0].id, { sections: newSections });
      }
      
      console.log(`✅ Voiceover saved for scene ${sceneId}:`, voiceoverUrl);
      setToast({ message: 'Voiceover generated and saved successfully!', type: 'success' });
      
    } catch (error) {
      console.error(`❌ Error generating voiceover for scene ${sceneId}:`, error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to generate voiceover', 
        type: 'error' 
      });
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  // Version that accepts updated sections to avoid closure issues
  const generateAndSaveVoiceoverWithSections = async (sceneId: string, script: string, voiceId: string, updatedSections: Section[]) => {
    if (!user) {
      setToast({ message: 'User must be logged in', type: 'error' });
      return;
    }

    setIsGeneratingVoiceover(true);
    try {
      console.log(`🎤 Generating voiceover for scene ${sceneId} with updated script...`);
      
      // Generate voiceover using ElevenLabs
      const audioUrl = await generateSpeech(script, voiceId);
      
      // Download the audio blob
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch voiceover: ${response.statusText}`);
      const audioBlob = await response.blob();
      
      // Create a file from the blob
      const audioFile = new File([audioBlob], `voiceover-${sceneId}.mp3`, { type: 'audio/mpeg' });
      
      // Upload to Supabase voiceovers bucket
      const fileName = `${user.id}/voiceover-${sceneId}-${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voiceovers')
        .upload(fileName, audioFile);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('voiceovers')
        .getPublicUrl(fileName);
      
      const voiceoverUrl = urlData.publicUrl;
      
      // Update the scene with the voiceover URL using the provided sections
      const newSections = updatedSections.map(section => ({
        ...section,
        scenes: section.scenes.map(scene =>
          scene.id === sceneId
            ? { ...scene, voiceoverUrl }
            : scene
        )
      }));
      
      setSections(newSections);
      setVoiceoverUrls(prev => ({ ...prev, [sceneId]: voiceoverUrl }));
      
      // Save to database
      if (videos[0]) {
        await updateVideo(videos[0].id, { sections: newSections });
      }
      
      console.log(`✅ Voiceover saved for scene ${sceneId}:`, voiceoverUrl);
      setToast({ message: 'Voiceover generated and saved successfully!', type: 'success' });
      
    } catch (error) {
      console.error(`❌ Error generating voiceover for scene ${sceneId}:`, error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to generate voiceover', 
        type: 'error' 
      });
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  const getVoiceoverUrl = async (sceneId: string): Promise<string | null> => {
    // Check if we have a cached URL
    if (voiceoverUrls[sceneId]) {
      return voiceoverUrls[sceneId];
    }
    
    // Check if scene has a voiceoverUrl in the database
    const scene = scenes.find(s => s.id === sceneId);
    if (scene?.voiceoverUrl) {
      try {
        // Extract the file path from the public URL
        const publicUrl = scene.voiceoverUrl;
        console.log(`🔍 Processing voiceover URL for scene ${sceneId}:`, publicUrl);
        
        const urlParts = publicUrl.split('/storage/v1/object/public/voiceovers/');
        console.log(`🔍 URL parts:`, urlParts);
        
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          console.log(`🔍 Extracted file path:`, filePath);
          
          // Create a signed URL for audio playback
          const { data, error } = await supabase.storage
            .from('voiceovers')
            .createSignedUrl(filePath, 3600); // 1 hour expiry
          
          if (error) {
            console.error('Error creating signed URL for voiceover:', error);
            return null;
          }
          
          if (data?.signedUrl) {
            const signedUrl = data.signedUrl;
            console.log(`🔍 Created signed URL:`, signedUrl);
            setVoiceoverUrls(prev => ({ ...prev, [sceneId]: signedUrl }));
            return signedUrl;
          } else {
            console.log(`🔍 No signed URL created, trying public URL as fallback`);
            // Fallback to public URL
            setVoiceoverUrls(prev => ({ ...prev, [sceneId]: publicUrl }));
            return publicUrl;
          }
        } else {
          console.log(`🔍 Could not parse voiceover URL:`, publicUrl);
        }
      } catch (error) {
        console.error('Error processing voiceover URL:', error);
      }
    }
    
    return null;
  };

  const regenerateVoiceover = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.script || !scene.voiceId) {
      setToast({ message: 'Scene needs script and voice ID to regenerate voiceover', type: 'error' });
      return;
    }
    
    await generateAndSaveVoiceover(sceneId, scene.script, scene.voiceId);
  };

  // Generate final video function - updated for task-based API
  const generateFinalVideo = async () => {
    if (!videos[0]) {
      setToast({ message: 'No video loaded', type: 'error' });
      return;
    }

    console.log('🚀 Starting video generation process...');
    console.log('📊 Scenes data:', scenes);
    console.log('🎬 Clips data:', clipUrls);
    
    setIsGeneratingFinalVideo(true);
    setGenerationProgress('Preparing video data...');
    setJobStatus('idle');
    setJobError(null);
    setJobProgress(0);

    try {
      // Step 1: Collect video clips
      const videoClips: File[] = [];
      const scenesWithClips = scenes.filter(scene => scene.clipId && clipUrls[scene.clipId]?.localUrl);
      
      if (scenesWithClips.length === 0) {
        setToast({ message: 'No video clips found in scenes', type: 'error' });
        return;
      }

      setGenerationProgress('Downloading video clips...');
      
      // Download video clips from URLs
      for (const scene of scenesWithClips) {
        if (scene.clipId && clipUrls[scene.clipId]?.localUrl) {
          try {
            const response = await fetch(clipUrls[scene.clipId].localUrl);
            if (!response.ok) throw new Error(`Failed to fetch clip: ${response.statusText}`);
            const blob = await response.blob();
            const file = new File([blob], `clip-${scene.id}.mp4`, { type: 'video/mp4' });
            videoClips.push(file);
          } catch (error) {
            console.error(`Error downloading clip for scene ${scene.id}:`, error);
            setToast({ message: `Failed to download clip for scene ${scene.id}`, type: 'error' });
            return;
          }
        }
      }

      // Step 2: Generate voiceovers
      setGenerationProgress('Generating voiceovers...');
      const voiceovers: File[] = [];
      const scenesWithScripts = scenes.filter(scene => scene.script && scene.voiceId);

      for (const scene of scenesWithScripts) {
        if (scene.script && scene.voiceId) {
          try {
            // Check if we have a cached voiceover
            let voiceoverUrl = await getVoiceoverUrl(scene.id);
            
            if (!voiceoverUrl) {
              console.log(`🎤 No cached voiceover found for scene ${scene.id}, generating new one...`);
              // Generate and save new voiceover
              await generateAndSaveVoiceover(scene.id, scene.script, scene.voiceId);
              voiceoverUrl = await getVoiceoverUrl(scene.id);
              
              if (!voiceoverUrl) {
                throw new Error(`Failed to generate voiceover for scene ${scene.id}`);
              }
            } else {
              console.log(`✅ Using cached voiceover for scene ${scene.id}:`, voiceoverUrl);
            }
            
            // Download the voiceover file
            const response = await fetch(voiceoverUrl);
            if (!response.ok) throw new Error(`Failed to fetch voiceover: ${response.statusText}`);
            const blob = await response.blob();
            const file = new File([blob], `voiceover-${scene.id}.mp3`, { type: 'audio/mpeg' });
            voiceovers.push(file);
          } catch (error) {
            console.error(`Error processing voiceover for scene ${scene.id}:`, error);
            setToast({ message: `Failed to process voiceover for scene ${scene.id}`, type: 'error' });
            return;
          }
        }
      }

      // Step 3: Get background music
      let backgroundMusic: File | null = null;
      if (selectedMusicId && musicUrl) {
        setGenerationProgress('Downloading background music...');
        try {
          const response = await fetch(musicUrl);
          if (!response.ok) throw new Error(`Failed to fetch music: ${response.statusText}`);
          const blob = await response.blob();
          backgroundMusic = new File([blob], 'background-music.mp3', { type: 'audio/mpeg' });
        } catch (error) {
          console.error('Error downloading background music:', error);
          setToast({ message: 'Failed to download background music', type: 'error' });
          return;
        }
      }

      // Step 4: Prepare metadata
      setGenerationProgress('Preparing metadata...');
      const metadata = {
        scenes: scenes.map((scene, index) => ({
          clip_order: scenesWithClips.findIndex(s => s.id === scene.id),
          clip_duration: 10, // Default duration in seconds
          script: scene.script || '',
          voiceover_order: scenesWithScripts.findIndex(s => s.id === scene.id),
        })),
        output_resolution: "1280x720",
        background_music_volume: 0.2,
        video_title: videos[0].title || 'Untitled Video',
        video_description: videos[0].description || '',
      };

      // Step 5: Create FormData and send to backend
      setGenerationProgress('Sending to video processor...');
      const formData = new FormData();
      
      // Add video clips
      videoClips.forEach((clip, index) => {
        formData.append('clips', clip);
      });

      // Add voiceovers
      voiceovers.forEach((voiceover, index) => {
        formData.append('voiceovers', voiceover);
      });

      // Add background music if available
      if (backgroundMusic) {
        formData.append('music', backgroundMusic);
      }

      // Add metadata
      formData.append('metadata', JSON.stringify(metadata));

      // Step 6: Send to backend API and get job ID
      console.log('📤 Sending to backend API...');
      console.log('📋 FormData contents:');
      console.log('- Video clips:', videoClips.length);
      console.log('- Voiceovers:', voiceovers.length);
      console.log('- Background music:', backgroundMusic ? 'Yes' : 'No');
      console.log('- Metadata:', metadata);
      
      const response = await fetch(`${BACKEND_URL}/api/combine-clips`, {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Backend response status:', response.status);
      console.log('📥 Backend response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`Backend error: ${response.statusText} - ${errorText}`);
      }

      // Step 7: Handle JSON response with job ID
      const result = await response.json();
      console.log('📥 Backend JSON response:', result);
      
      if (!result.success || !result.job_id) {
        throw new Error('Backend did not return a valid job ID');
      }

      const jobId = result.job_id;
      setCurrentJobId(jobId);
      setJobStatus('queued');
      setGenerationProgress('Job queued, starting processing...');
      
      console.log('🎯 Job created with ID:', jobId);

      // Step 8: Start polling for job status
      const interval = setInterval(() => {
        pollJobStatus(jobId);
      }, 5000); // Poll every 5 seconds
      
      setPollingInterval(interval);
      
      // Set timeout to stop polling after 60 seconds
      setTimeout(() => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        if (jobStatus !== 'completed' && jobStatus !== 'failed') {
          setJobError('Processing timeout - please try again');
          setJobStatus('failed');
          setIsGeneratingFinalVideo(false);
          setGenerationProgress('');
          setCurrentJobId(null);
          setToast({ message: 'Processing timeout - please try again', type: 'error' });
        }
      }, 60000); // 60 seconds timeout

    } catch (error) {
      console.error('Error generating final video:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to generate final video', 
        type: 'error' 
      });
      setIsGeneratingFinalVideo(false);
      setGenerationProgress('');
      setJobStatus('idle');
      setCurrentJobId(null);
    }
  };

  // Check if video generation is ready
  const isVideoGenerationReady = () => {
    return scenes.some(scene => scene.clipId && clipUrls[scene.clipId]?.localUrl) &&
           scenes.some(scene => scene.script && scene.voiceId);
  };

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
      <div className="flex w-full max-w-7xl mx-auto mt-2 rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-slate-900" style={{ height: '70vh', minHeight: '400px' }}>
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
          <aside className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col" style={{ height: '600px' }}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h2 className="font-bold text-slate-700 dark:text-white mb-2">Scenes</h2>
              {videos[0]?.description && (
                <button
                  onClick={generateAIScenes}
                  disabled={isGeneratingAIScenes}
                  className="w-full px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-orange-400 text-white rounded-lg hover:from-purple-600 hover:to-orange-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGeneratingAIScenes ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate AI Scenes
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="overflow-y-auto" style={{ height: 'calc(600px - 120px)' }}>
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
          </aside>
        )}
        {/* Placeholder for other panels */}
        
        {activePanel === 'clips' && (
          <VideoPanel
            videos={userClips.map(clip => ({
              id: clip.id,
              title: clip.title,
              description: clip.description || '',
              status: 'complete' as const,
              file: new File([], clip.file_path || ''),
              localUrl: clipUrls[clip.id]?.localUrl || '',
              thumbnail_url: clipUrls[clip.id]?.thumbnail_url,
              created_at: clip.created_at,
            }))}
            onAddVideo={handleAddSceneVideo}
            onRemoveVideo={handleRemoveSceneVideo}
            onReload={loadUserClips}
            onVideoSelect={(video) => {
              // Find the corresponding UserClip
              const clip = userClips.find(c => c.id === video.id);
              if (clip) {
                setSelectedVideo({
                  id: clip.id,
                  title: clip.title,
                  description: clip.description || '',
                  status: 'complete',
                  file: new File([], clip.file_path || ''),
                  localUrl: clipUrls[clip.id]?.localUrl || '',
                  created_at: clip.created_at,
                });
              }
            }}
          />
        )}
        {activePanel === 'music' && (
          <MusicPanel
            tracks={userMusic}
            onAddMusic={handleAddMusic}
            onRemoveMusic={() => {}}
            onTrackSelect={handleTrackSelect}
          />
        )}
        {activePanel === 'characters' && (
          <aside className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col relative">
            <h2 className="p-4 font-bold text-slate-700 dark:text-white">Characters</h2>
            {isCharacterFormOpen ? (
              <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-4 m-4 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
                  {editingCharacter ? 'Edit Character' : 'Create New Character'}
                </h2>
                <CharacterForm
                  character={editingCharacter}
                  voices={voices}
                  onSubmit={handleCharacterFormSubmit}
                  onCancel={handleCharacterFormCancel}
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 px-4 pb-2">
                  <form onSubmit={handleCharacterSearch} className="relative max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search characters..."
                      value={characterSearchQuery}
                      onChange={(e) => setCharacterSearchQuery(e.target.value)}
                      className="pl-9 bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400"
                    />
                  </form>
                  <Button
                    leftIcon={<PlusCircle className="h-5 w-5" />}
                    onClick={() => setIsCharacterFormOpen(true)}
                  >
                    New Character
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-4">
                  {characterLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-400"></div>
                        <p className="text-lg font-medium text-slate-500 dark:text-slate-300">Loading characters...</p>
                      </div>
                    </div>
                  ) : characterError ? (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 text-red-600 dark:text-red-400">
                      <p className="font-medium">Error loading characters</p>
                      <p className="text-sm">{characterError}</p>
                    </div>
                  ) : filteredCharacters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 p-6 text-center">
                      <div className="mb-4 rounded-full bg-slate-200 dark:bg-slate-700 p-3">
                        <Users className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="mb-1 text-lg font-medium text-slate-700 dark:text-white">No characters found</h3>
                      <p className="mb-4 max-w-md text-slate-500 dark:text-slate-400">
                        {characterSearchQuery
                          ? `No characters matching "${characterSearchQuery}"`
                          : "You haven't created any characters yet. Create your first character!"}
                      </p>
                      <Button
                        leftIcon={<PlusCircle className="h-5 w-5" />}
                        onClick={() => setIsCharacterFormOpen(true)}
                      >
                        Create New Character
                      </Button>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {filteredCharacters.map((character) => (
                        <li key={character.id} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-purple-100 dark:hover:bg-purple-900 group transition-colors">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            {character.avatar_url ? (
                              <img src={character.avatar_url} alt={character.name} className="w-8 h-8 object-cover" />
                            ) : (
                              <span className="text-purple-400 font-bold text-lg">{character.name?.[0] || '?'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 dark:text-white text-sm truncate">{character.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-300 truncate">
                              {character.personality || character.description || 'No description'}
                            </div>
                          </div>
                          <button
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Edit"
                            onClick={() => handleEditCharacter(character)}
                          >
                            <Pencil className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                            title="Delete"
                            onClick={() => handleDeleteCharacter(character.id)}
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </aside>
        )}
        {activePanel === 'voices' && (
          <VoicesPanel
            onVoiceSelect={handleVoiceSelect}
            selectedVoice={selectedVoice}
          />
        )}
        {/* Main Video Preview and Actions */}
        <main className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 32px)' }}>
          {/* Video Info */}
          <div className="w-full max-w-2xl mb-4 relative">
            <div className="rounded-lg border p-4 bg-white dark:bg-slate-800 shadow relative">
              <button
                className="absolute top-2 right-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => {
                  setEditingVideoTitle(videos[0]?.title || '');
                  setEditingVideoDescription(videos[0]?.description || '');
                  setIsEditingVideoInfo(true);
                }}
                aria-label="Edit video info"
              >
                <Pencil className="w-5 h-5 text-slate-500" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {videos[0]?.title?.trim() ? videos[0].title : 'Untitled Video'}
              </h1>
              <p className="text-slate-500 dark:text-slate-300 mt-1">
                {videos[0]?.description?.trim() ? videos[0].description : 'No description provided.'}
              </p>
            </div>
          </div>
          {/* Playlist Preview Player */}
          <div className="w-full max-w-2xl aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center shadow mb-4 relative">
            {previewClips.length > 0 ? (
              <>
                <video
                  ref={previewVideoRef}
                  src={previewClips[previewIndex].url}
                  controls
                  autoPlay={isPreviewPlaying}
                  onEnded={handlePreviewEnded}
                  className="max-w-full max-h-full"
                  onPlay={() => setIsPreviewPlaying(true)}
                  onPause={() => setIsPreviewPlaying(false)}
                />
                {/* Music Audio Overlay - single audio element for all preview */}
                {musicUrl && (
                  <audio
                    ref={musicAudioRef}
                    src={musicUrl}
                    className="hidden"
                    preload="auto"
                  />
                )}
                {/* Subtitles Overlay */}
                {(() => {
                  const scene = scenes.find(s => s.id === previewClips[previewIndex]?.sceneId);
                  const subtitleText = scene?.subtitles || scene?.script;
                  return subtitleText ? (
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-[90%] text-center text-yellow-400 text-lg font-bold pointer-events-none select-none" style={{ bottom: '64px' }}>
                      {subtitleText}
                    </div>
                  ) : null;
                })()}
                {isVoiceLoading && (
                  <div className="mt-2 text-xs text-slate-500">Loading voiceover...</div>
                )}
                <div className="flex gap-2 mt-2 items-center">
                  <button
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white"
                    onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                    disabled={previewIndex === 0}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    className="p-2 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-white shadow hover:bg-purple-200"
                    onClick={() => {
                      if (isPreviewPlaying) {
                        previewVideoRef.current?.pause();
                      } else {
                        previewVideoRef.current?.play();
                      }
                    }}
                  >
                    {isPreviewPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 5.25v13.5m10.5-13.5v13.5" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25v13.5l13.5-6.75-13.5-6.75z" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white"
                    onClick={() => setPreviewIndex(Math.min(previewClips.length - 1, previewIndex + 1))}
                    disabled={previewIndex === previewClips.length - 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-300">
                    {previewClips[previewIndex].title}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-slate-400 dark:text-slate-600">
                No video clips to preview
              </div>
            )}
          </div>
          {/* Video Generation Status Bar */}
          <div className="w-full max-w-2xl mb-2">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${scenes.some(s => s.clipId && clipUrls[s.clipId]?.localUrl) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Video Clips: {scenes.filter(s => s.clipId && clipUrls[s.clipId]?.localUrl).length}/{scenes.length}</span>
                <div className={`w-3 h-3 rounded-full ${scenes.some(s => s.script && s.voiceId) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Voiceovers: {scenes.filter(s => s.script && s.voiceId).length}/{scenes.length}</span>
                <div className={`w-3 h-3 rounded-full ${selectedMusicId ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>Background Music: {selectedMusicId ? 'Selected' : 'Optional'}</span>
              </div>
              <span className="text-green-600 font-semibold">{isVideoGenerationReady() ? 'Ready to generate final video!' : 'Add clips and voiceovers'}</span>
            </div>
          </div>
          {/* Generate Final Video Button */}
          <div className="w-full max-w-2xl flex justify-center mb-4">
            <button
              onClick={generateFinalVideo}
              disabled={isGeneratingFinalVideo || !isVideoGenerationReady()}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 flex items-center gap-2 text-lg shadow-lg ${
                isGeneratingFinalVideo 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : isVideoGenerationReady()
                  ? 'bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {isGeneratingFinalVideo ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {jobStatus === 'queued' ? 'Queued...' : 
                   jobStatus === 'processing' ? 'Processing...' : 
                   'Generating...'}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate Final Video
                </>
              )}
            </button>
          </div>
          
          {/* Generation Progress - Updated */}
          {isGeneratingFinalVideo && (
            <div className="w-full max-w-2xl mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-white">
                    {generationProgress}
                  </span>
                  {jobStatus === 'processing' && (
                    <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                      {jobProgress}%
                    </span>
                  )}
                </div>
                
                {/* Progress Bar */}
                {jobStatus === 'processing' && (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${jobProgress}%` }}
                    ></div>
                  </div>
                )}
                
                {/* Job Status */}
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    jobStatus === 'queued' ? 'bg-yellow-500' :
                    jobStatus === 'processing' ? 'bg-blue-500' :
                    jobStatus === 'completed' ? 'bg-green-500' :
                    jobStatus === 'failed' ? 'bg-red-500' :
                    'bg-slate-400'
                  }`}></div>
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {jobStatus === 'idle' ? 'Ready' : jobStatus}
                  </span>
                  {currentJobId && (
                    <span className="text-slate-500 dark:text-slate-500 font-mono">
                      ID: {currentJobId.slice(0, 8)}...
                    </span>
                  )}
                </div>
                
                {/* Error Message */}
                {jobError && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                    {jobError}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Final Generated Video Section */}
          {(generatedVideoUrl || videos[0]?.final_video_url) && (
            <div className="w-full max-w-2xl mt-6">
              <div className="rounded-lg border p-4 bg-white dark:bg-slate-800 shadow">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-green-600" />
                  Final Generated Video
                </h2>
                <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden mb-3 relative">
                  <video
                    src={generatedVideoUrl || videos[0]?.final_video_url}
                    controls
                    className="w-full h-full"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                  <button
                    onClick={() => {
                      const videoUrl = generatedVideoUrl || videos[0]?.final_video_url;
                      if (videoUrl) {
                        const link = document.createElement('a');
                        link.href = videoUrl;
                        link.download = `${videos[0]?.title || 'video'}-final.mp4`;
                        link.click();
                      }
                    }}
                    className="absolute bottom-4 right-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Final Video
                  </button>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Generated on: {videos[0].last_generated_at ? new Date(videos[0].last_generated_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>
          )}
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
                    <Draggable key={scene.id} draggableId={scene.id} index={idx}>
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex flex-col items-center justify-end w-24 h-16 rounded border-2 ${selectedSceneId === scene.id ? 'border-purple-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-100 dark:bg-slate-800 mx-1 cursor-pointer overflow-hidden`}
                          onClick={() => handleTimelineSceneClick(scene.id)}
                        >
                          {scene.type === 'video' && scene.clipId ? (
                            (() => {
                              const localUrl = clipUrls[scene.clipId]?.localUrl;
                              const thumbnailUrl = clipUrls[scene.clipId]?.thumbnail_url;
                              return localUrl ? (
                                <div className="w-full h-full relative">
                                  <img
                                    src={thumbnailUrl || localUrl}
                                    alt={scene.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-medium">Edit Media</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">No video</span>
                              );
                            })()
                          ) : (
                            <>
                              <span className="font-semibold text-xs text-slate-700 dark:text-white mb-1">{scene.sectionLabel || 'Scene'}</span>
                              {scene.type === 'image'
                                ? <span className="text-xs text-slate-400">Image</span>
                                : <span className="text-xs text-slate-400">Text</span>
                              }
                              <span className="text-[10px] text-slate-400">Scene {idx + 1}</span>
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>

                {/* Media Indicators Track */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  {scenes.map((scene: Scene, idx: number) => (
                    <div
                      key={scene.id}
                      className="w-24 h-8 flex items-center justify-center gap-2"
                    >
                      {scene.type === 'video' && scene.clipId && clipUrls[scene.clipId]?.localUrl && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <VideoIcon className="w-3 h-3" />
                          <span>Video</span>
                        </div>
                      )}
                      {scene.script && scene.voiceId && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                          <Mic className="w-3 h-3" />
                          <span>Voice</span>
                        </div>
                      )}
                      {scene.music && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Music className="w-3 h-3" />
                          <span>Music</span>
                        </div>
                      )}
                      {/* Ready indicator */}
                      {scene.clipId && clipUrls[scene.clipId]?.localUrl && scene.script && scene.voiceId && (
                        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                          <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                          <span>Ready</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Script Track */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  {scenes.map((scene: Scene, idx: number) => (
                    <div
                      key={scene.id}
                      className={`flex items-center justify-center w-24 h-10 rounded border-2 border-dashed ${selectedSceneId === scene.id ? 'border-purple-500' : 'border-slate-200 dark:border-slate-700'} bg-orange-50 dark:bg-orange-900 mx-1 cursor-pointer`}
                      onClick={() => {
                        setEditingScriptSceneId(scene.id);
                        setEditingScriptText(scene.script || '');
                        setEditingScriptVoiceId(scene.voiceId || '');
                      }}
                    >
                      <span className="text-xs text-orange-700 dark:text-orange-200 truncate">{scene.script || 'Click to add script'}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Music Track at the very bottom, full width */}
              <div className="mt-4 flex flex-col">
                <div className="text-xs font-semibold text-slate-500 mb-1">Music</div>
                <button
                  className="w-full h-8 rounded bg-blue-200 dark:bg-blue-900 flex items-center pl-4 font-semibold text-blue-800 dark:text-blue-200 shadow-inner cursor-pointer hover:bg-blue-300 dark:hover:bg-blue-800 transition-colors"
                  onClick={() => setIsMusicModalOpen(true)}
                  type="button"
                  aria-label="Select music for video"
                >
                  🎵 Music Track (extends full video)
                </button>
              </div>
              {/* (Optional) Add time ruler, playhead, and drag-and-drop here */}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {/* Tooltip Portal for section descriptions */}
      <TooltipPortal position={tooltip.position}>{tooltip.text}</TooltipPortal>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {clipToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Delete Clip
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete "{clipToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteClip}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteClip}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <AddMediaModal
        isOpen={isAddMediaModalOpen}
        onClose={() => setIsAddMediaModalOpen(false)}
        sceneId={selectedSceneId}
        onAddClip={clip => handleAddMediaToScene(selectedSceneId, { type: 'video', clipId: clip.id })}
        onAddVoice={voice => handleAddMediaToScene(selectedSceneId, { voiceId: voice.id })}
        onAddMusic={track => handleAddMediaToScene(selectedSceneId, { musicId: track.id })}
        availableClips={userClips.map(clip => ({
          id: clip.id,
          title: clip.title,
          description: clip.description || '',
          status: 'complete',
          file: new File([], clip.file_path || ''),
          localUrl: clipUrls[clip.id]?.localUrl || '',
          thumbnail_url: clipUrls[clip.id]?.thumbnail_url,
          created_at: clip.created_at,
        }))}
        availableVoices={availableVoices}
        availableMusic={musicTracks}
        tabs={tabs}
      />

      {editingScriptSceneId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Edit Script</h3>
            <textarea
              value={editingScriptText}
              onChange={e => setEditingScriptText(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-white bg-white dark:bg-slate-900"
              rows={4}
              placeholder="Enter script for this scene..."
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">Voice</label>
              <select
                value={editingScriptVoiceId}
                onChange={e => setEditingScriptVoiceId(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-white bg-white dark:bg-slate-900"
              >
                <option value="">No Voice</option>
                {Array.isArray(availableVoices) && availableVoices.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name || voice.id}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={async () => {
                  const finalVoiceId = editingScriptVoiceId || 'flHkNRp1BlvT73UL6gyz';
                  
                  // Update sections with new script and voice
                  const newSections = sections.map(section => ({
                    ...section,
                    scenes: section.scenes.map(scene =>
                      scene.id === editingScriptSceneId
                        ? { 
                            ...scene, 
                            script: editingScriptText, 
                            voiceId: finalVoiceId
                          }
                        : scene
                    )
                  }));
                  
                  setSections(newSections);
                  setEditingScriptSceneId(null);
                  
                  // Save to DB if a video is loaded
                  if (videos[0]) {
                    try {
                      await updateVideo(videos[0].id, { sections: newSections });
                      
                      // Generate voiceover if script is provided
                      if (editingScriptText.trim() && finalVoiceId) {
                        setToast({ message: 'Script saved! Generating voiceover...', type: 'success' });
                        // Pass the updated sections to ensure we use the new script
                        await generateAndSaveVoiceoverWithSections(editingScriptSceneId, editingScriptText, finalVoiceId, newSections);
                      } else {
                        setToast({ message: 'Script updated and saved successfully', type: 'success' });
                      }
                    } catch (err) {
                      setToast({ message: 'Failed to save script', type: 'error' });
                    }
                  }
                }}
                disabled={isGeneratingVoiceover}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGeneratingVoiceover ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  'Save'
                )}
              </button>
              <button
                onClick={() => setEditingScriptSceneId(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg shadow"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Info Modal */}
      {isEditingVideoInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Edit Video Info</h3>
            <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">Title</label>
            <input
              type="text"
              value={editingVideoTitle}
              onChange={e => setEditingVideoTitle(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-white bg-white dark:bg-slate-900 mb-4"
              placeholder="Enter video title"
            />
            <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">Description</label>
            <textarea
              value={editingVideoDescription}
              onChange={e => setEditingVideoDescription(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-white bg-white dark:bg-slate-900"
              rows={3}
              placeholder="Enter video description"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={async () => {
                  if (!videos[0]) return;
                  const updated = { ...videos[0], title: editingVideoTitle, description: editingVideoDescription };
                  setVideos([updated, ...videos.slice(1)]);
                  setIsEditingVideoInfo(false);
                  try {
                    await updateVideo(videos[0].id, { title: editingVideoTitle, description: editingVideoDescription });
                  } catch (err) {
                    setToast({ message: 'Failed to update video info', type: 'error' });
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingVideoInfo(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg shadow"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Music Selection Modal */}
      {isMusicModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Music Track</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {userMusic.length === 0 && <div className="text-slate-500">No music uploaded yet.</div>}
              {userMusic.map(track => (
                <div key={track.id} className={`flex items-center gap-3 p-2 rounded ${selectedMusicId === track.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>
                  <button
                    className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900"
                    onClick={async () => {
                      // Play preview
                      const filePath = track.file_path.split('/user-music/')[1] || track.file_path;
                      const { data } = await supabase.storage.from('user-music').createSignedUrl(filePath, 60);
                      if (data?.signedUrl) {
                        const audio = new Audio(data.signedUrl);
                        audio.play();
                      }
                    }}
                    aria-label="Play preview"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25v13.5l13.5-6.75-13.5-6.75z" />
                    </svg>
                  </button>
                  <span className="flex-1 truncate">{track.file_path.split('/').pop() || 'Untitled'}</span>
                  <button
                    className="px-3 py-1 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
                    onClick={async () => {
                      setSelectedMusicId(track.id);
                      setIsMusicModalOpen(false);
                      // Save to DB if a video is loaded
                      if (videos[0]) {
                        try {
                          await updateVideo(videos[0].id, { musicid: track.id });
                          setToast({ message: 'Music selection saved', type: 'success' });
                        } catch (err) {
                          setToast({ message: 'Failed to save music selection', type: 'error' });
                        }
                      }
                    }}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={() => setIsMusicModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg shadow"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 