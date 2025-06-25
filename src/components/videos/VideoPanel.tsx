import React, { useState } from 'react';
import { Plus, Upload, X, Sparkles, Video as VideoIcon, Trash2, Loader2, Image as ImageIcon, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Video } from '../../types';
import { generateRunwayVideo, imageToOptimizedDataUri } from '../../lib/runway';
import { supabase } from '../../lib/supabase';
import { uploadClip } from '../../lib/clips';

interface SceneVideo extends Video {
  file: File;
  localUrl: string;
  id: string;
  title: string;
  thumbnail_url?: string;
}

type VideoPanelProps = {
  onAddVideo: (video: File) => void;
  onRemoveVideo: (id: string) => void;
  videos: SceneVideo[];
  onVideoSelect: (video: SceneVideo) => void;
  currentSceneContext?: {
    title?: string;
    description?: string;
    script?: string;
  };
};

type TabType = 'upload' | 'ai' | 'stock';

export const VideoPanel: React.FC<VideoPanelProps> = ({
  onAddVideo,
  onRemoveVideo,
  videos,
  onVideoSelect,
  currentSceneContext,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'generate'>('generate'); // Default to ChatGPT generation
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Update image prompt when scene context changes
  React.useEffect(() => {
    if (currentSceneContext && !imagePrompt) {
      let contextPrompt = '';
      if (currentSceneContext.title) {
        contextPrompt += currentSceneContext.title;
      }
      if (currentSceneContext.description) {
        contextPrompt += contextPrompt ? ': ' + currentSceneContext.description : currentSceneContext.description;
      }
      if (contextPrompt) {
        setImagePrompt(contextPrompt);
      }
    }
  }, [currentSceneContext]);

  // Update AI prompt when scene context changes
  React.useEffect(() => {
    if (currentSceneContext && !aiPrompt) {
      let contextPrompt = '';
      if (currentSceneContext.script) {
        contextPrompt = `Create a video showing: ${currentSceneContext.script}`;
      } else if (currentSceneContext.description) {
        contextPrompt = `Create a video of: ${currentSceneContext.description}`;
      } else if (currentSceneContext.title) {
        contextPrompt = `Create a video about: ${currentSceneContext.title}`;
      }
      if (contextPrompt) {
        setAiPrompt(contextPrompt);
      }
    }
  }, [currentSceneContext]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length > 0) {
      onAddVideo(videoFiles[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddVideo(files[0]);
    }
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedImage(files[0]);
    }
  };

  const handleVideoClick = (video: SceneVideo, event: React.MouseEvent) => {
    if (isDeleteMode) {
      event.stopPropagation();
      onRemoveVideo(video.id);
    } else {
      onVideoSelect(video);
    }
  };

  // Function to upload image to temp bucket and get public URL
  const uploadImageToTempBucket = async (file: File): Promise<string> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${timestamp}.${fileExt}`;
      
      // Upload to temp-images-for-video-generation bucket
      const { error: uploadError } = await supabase.storage
        .from('temp-images-for-video-generation')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('temp-images-for-video-generation')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image to temp bucket:', error);
      throw error;
    }
  };

  // Function to generate image with ChatGPT
  const generateImageWithChatGPT = async (prompt: string): Promise<string> => {
    if (!prompt.trim()) {
      throw new Error('Please enter a description for the image');
    }

    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for image generation. Please add it to your environment variables.');
    }

    setIsGeneratingImage(true);
    setGenerationStatus('Generating image with DALL-E...');
    
    try {
      // Use OpenAI DALL-E API for image generation
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DALL-E API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('No image URL received from DALL-E API');
      }

      const imageUrl = data.data[0].url;
      
      setGeneratedImageUrl(imageUrl);
      setIsGeneratingImage(false);
      setGenerationStatus('');
      
      return imageUrl;
    } catch (error) {
      setIsGeneratingImage(false);
      setGenerationStatus('');
      throw error;
    }
  };

  const resetImageSelection = () => {
    setSelectedImage(null);
    setGeneratedImageUrl(null);
    setImagePrompt('');
  };

  // Function to handle image generation button click
  const handleGenerateImage = async () => {
    try {
      await generateImageWithChatGPT(imagePrompt);
    } catch (error) {
      console.error('Error generating image:', error);
      setGenerationStatus(`Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setGenerationStatus(''), 3000);
    }
  };

  // Function to get the current image (either uploaded or generated)
  const getCurrentImage = (): string | null => {
    if (imageMode === 'upload' && selectedImage) {
      return URL.createObjectURL(selectedImage);
    } else if (imageMode === 'generate' && generatedImageUrl) {
      return generatedImageUrl;
    }
    return null;
  };

  // Function to get the image for upload (either File or URL)
  const getImageForUpload = async (): Promise<string> => {
    if (imageMode === 'upload' && selectedImage) {
      return await uploadImageToTempBucket(selectedImage);
    } else if (imageMode === 'generate' && generatedImageUrl) {
      return generatedImageUrl;
    }
    throw new Error('No image available');
  };

  const handleGenerateAIVideo = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a description for your video');
      return;
    }

    // Check if we have an image
    if (imageMode === 'upload' && !selectedImage) {
      alert('Please select an image or switch to ChatGPT generation');
      return;
    }
    if (imageMode === 'generate' && !generatedImageUrl) {
      alert('Please generate an image first');
      return;
    }

    setIsGeneratingAI(true);
    setGenerationStatus('Starting video generation...');

    try {
      let promptImageUrl: string;
      
      // Get the image URL (either uploaded to temp bucket or generated)
      setGenerationStatus('Preparing image for video generation...');
      promptImageUrl = await getImageForUpload();
      console.log('Image ready for video generation:', promptImageUrl);

      setGenerationStatus('Generating video with Runway ML...');

      // Generate video using Runway ML via proxy backend
      const result = await generateRunwayVideo({
        promptText: aiPrompt,
        promptImage: promptImageUrl,
        duration: 5,
        ratio: '1280:720',
        model: 'gen4_turbo',
        title: `AI Generated: ${aiPrompt.substring(0, 50)}...`,
        description: aiPrompt,
      });

      if (result.status === 'completed' && result.url) {
        setGenerationStatus('Video generated! Saving to your clips...');
        
        try {
          // Download the video from Runway URL
          const response = await fetch(result.url);
          if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const file = new File([blob], `runway-generated-${Date.now()}.mp4`, { type: 'video/mp4' });
          
          // Save to user clips using existing uploadClip function
          const clip = await uploadClip(file, `AI Generated: ${aiPrompt.substring(0, 50)}...`);
          
          setGenerationStatus('Video saved to your clips!');
          setAiPrompt('');
          setSelectedImage(null);
          setGeneratedImageUrl(null);
          
          // Show success message
          setTimeout(() => {
            setGenerationStatus('');
          }, 2000);
          
        } catch (downloadError) {
          console.error('Error downloading or saving video:', downloadError);
          setGenerationStatus(`Error saving video: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error(result.error || 'Video generation failed');
      }

    } catch (error) {
      console.error('Error generating AI video:', error);
      setGenerationStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Keep the error message visible for a bit longer
      setTimeout(() => {
        setGenerationStatus('');
      }, 5000);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
              isDragging 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-slate-300 dark:border-slate-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*"
              onChange={handleFileInput}
            />
            <Upload className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Drag and drop video files here, or{' '}
              <button
                className="text-purple-600 dark:text-purple-400 hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              Supported formats: MP4, WebM, MOV
            </p>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Generate Video with Runway ML</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {getCurrentImage() ? 'Step 2: Describe your video' : 'Step 1: Provide an image'}
              </p>
              
              {!getCurrentImage() ? (
                <>
                  {/* Image Mode Selection */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Image Source
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImageMode('generate')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          imageMode === 'generate'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Wand2 className="h-4 w-4" />
                        Generate
                      </button>
                      <button
                        onClick={() => setImageMode('upload')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          imageMode === 'upload'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <ImageIcon className="h-4 w-4" />
                        Upload
                      </button>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  {imageMode === 'upload' && (
                    <div className="mb-4">
                      <input
                        type="file"
                        ref={imageInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageInput}
                      />
                      <Button
                        onClick={() => imageInputRef.current?.click()}
                        variant="outline"
                        className="w-full"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {selectedImage ? selectedImage.name : 'Select Image'}
                      </Button>
                    </div>
                  )}

                  {/* ChatGPT Image Generation Section */}
                  {imageMode === 'generate' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                          Describe the image to generate
                        </label>
                        {currentSceneContext && (
                          <button
                            type="button"
                            onClick={() => {
                              let contextPrompt = '';
                              if (currentSceneContext.title) {
                                contextPrompt += currentSceneContext.title;
                              }
                              if (currentSceneContext.description) {
                                contextPrompt += contextPrompt ? ': ' + currentSceneContext.description : currentSceneContext.description;
                              }
                              if (contextPrompt) {
                                setImagePrompt(contextPrompt);
                              }
                            }}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Use Scene Context
                          </button>
                        )}
                      </div>
                      {currentSceneContext && (
                        <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                          <strong>Current Scene:</strong> {currentSceneContext.title || 'Untitled'}
                          {currentSceneContext.description && (
                            <div className="mt-1 text-blue-600 dark:text-blue-400">
                              {currentSceneContext.description}
                            </div>
                          )}
                        </div>
                      )}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          placeholder={currentSceneContext ? "Describe the image for this scene..." : "e.g., a crab on a beach in hawaii"}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300"
                          disabled={isGeneratingImage}
                        />
                        <Button
                          size="sm"
                          className="w-full"
                          leftIcon={isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage || !imagePrompt.trim()}
                        >
                          Generate Image
                        </Button>
                      </div>
                      {isGeneratingImage && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {generationStatus}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Image Preview */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Your Image
                    </label>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
                      <img
                        src={getCurrentImage()!}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                        onClick={resetImageSelection}
                      >
                        Change Image
                      </Button>
                    </div>
                  </div>

                  {/* Text Prompt */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Describe the video motion
                      </label>
                      {currentSceneContext && (
                        <button
                          type="button"
                          onClick={() => {
                            let contextPrompt = '';
                            if (currentSceneContext.script) {
                              contextPrompt = `Create a video showing: ${currentSceneContext.script}`;
                            } else if (currentSceneContext.description) {
                              contextPrompt = `Create a video of: ${currentSceneContext.description}`;
                            } else if (currentSceneContext.title) {
                              contextPrompt = `Create a video about: ${currentSceneContext.title}`;
                            }
                            if (contextPrompt) {
                              setAiPrompt(contextPrompt);
                            }
                          }}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Use Scene Context
                        </button>
                      )}
                    </div>
                    {currentSceneContext && (
                      <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                        <strong>Current Scene:</strong> {currentSceneContext.title || 'Untitled'}
                        {currentSceneContext.script && (
                          <div className="mt-1 text-blue-600 dark:text-blue-400">
                            <strong>Script:</strong> {currentSceneContext.script}
                          </div>
                        )}
                        {currentSceneContext.description && (
                          <div className="mt-1 text-blue-600 dark:text-blue-400">
                            <strong>Description:</strong> {currentSceneContext.description}
                          </div>
                        )}
                      </div>
                    )}
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300 resize-none"
                      rows={3}
                      placeholder={currentSceneContext ? "Describe the motion for this scene..." : "e.g., A cinematic shot of the crab walking"}
                      disabled={isGeneratingAI}
                    />
                  </div>
                  
                  {isGeneratingAI && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {generationStatus}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full mt-2" 
                    leftIcon={isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    onClick={handleGenerateAIVideo}
                    disabled={isGeneratingAI || !aiPrompt.trim()}
                  >
                    {isGeneratingAI ? 'Generating...' : 'Generate Video'}
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      case 'stock':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Stock Videos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Browse our library of stock videos to find the perfect clip.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300"
                  placeholder="Search stock videos..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full" leftIcon={<VideoIcon className="h-4 w-4" />}>
                    Browse All
                  </Button>
                  <Button variant="outline" className="w-full" leftIcon={<Sparkles className="h-4 w-4" />}>
                    AI Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col relative">
      <div className="p-4 flex justify-between items-center">
        <h2 className="font-bold text-slate-700 dark:text-white">Scene Videos</h2>
        <Button
          size="sm"
          variant={isDeleteMode ? "ghost" : "outline"}
          className={isDeleteMode ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50" : ""}
          onClick={() => setIsDeleteMode(!isDeleteMode)}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          {isDeleteMode ? 'Exit Delete' : 'Delete'}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer"
              onClick={(e) => handleVideoClick(video, e)}
            >
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <span className="text-sm">No thumbnail</span>
                </div>
              )}
              {isDeleteMode && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                <p className="text-sm text-white truncate">{video.title}</p>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="text-sm">No videos added yet</p>
              <p className="text-xs mt-1">Add videos to use in your scenes</p>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          <button
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ai'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles className="h-4 w-4" />
            AI
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stock'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('stock')}
          >
            <VideoIcon className="h-4 w-4" />
            Stock
          </button>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
}; 