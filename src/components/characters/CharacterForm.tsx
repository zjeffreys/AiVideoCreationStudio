import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { User, Mic2, Upload, X, Wand2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Character, Voice } from '../../types';

type CharacterFormProps = {
  character?: Character;
  voices: Voice[];
  onSubmit: () => void;
  onCancel: () => void;
};

export const CharacterForm: React.FC<CharacterFormProps> = ({
  character,
  voices,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(character?.name || '');
  const [personality, setPersonality] = useState(character?.personality || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(character?.avatar_url || '');
  const [voiceId, setVoiceId] = useState(character?.voice_id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: false,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error) {
        if (error.code === 'file-too-large') {
          setError('Image must be less than 5MB');
        } else {
          setError('Please upload a valid image file');
        }
      }
    }
  });

  const isEditing = !!character;

  const uploadAvatar = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user!.id}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('character-avatars')
      .upload(filePath, file, {
        upsert: true,
        onUploadProgress: (progress) => {
          setUploadProgress((progress.loaded / progress.total) * 100);
        }
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('character-avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const generateDescription = async () => {
    if (!avatarFile && !avatarPreview) {
      setError('Please upload an image first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // If we have a new file, upload it first to get a public URL
      let imageUrl = avatarPreview;
      if (avatarFile) {
        imageUrl = await uploadAvatar(avatarFile);
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing images and creating engaging character descriptions for educational content. Focus on personality traits, teaching style, and potential subject expertise based on the character\'s appearance.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Generate a personality description for this character who will be teaching in educational videos. Focus on their likely teaching style, personality traits, and areas of expertise based on their appearance. Keep it concise but engaging.'
                },
                {
                  type: 'image_url',
                  image_url: imageUrl
                }
              ]
            }
          ],
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();
      const generatedDescription = data.choices[0].message.content;
      setPersonality(generatedDescription);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to generate description');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name) {
      setError('Please enter a character name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let avatarUrl = character?.avatar_url;

      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      if (isEditing) {
        // Update existing character
        const { error } = await supabase
          .from('characters')
          .update({
            name,
            personality,
            avatar_url: avatarUrl,
            voice_id: voiceId || null,
          })
          .eq('id', character.id);
          
        if (error) throw error;
      } else {
        // Create new character
        const { error } = await supabase
          .from('characters')
          .insert({
            user_id: user!.id,
            name,
            personality,
            avatar_url: avatarUrl,
            voice_id: voiceId || null,
          });
          
        if (error) throw error;
      }
      
      onSubmit();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const voiceOptions = voices.map(voice => ({
    value: voice.id,
    label: voice.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <Input
        label="Character Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter character name"
        required
        fullWidth
      />
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900">
          Character Avatar
        </label>
        
        {avatarPreview ? (
          <div className="relative inline-block">
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="h-32 w-32 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={removeAvatar}
              className="absolute -right-2 -top-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              isDragActive
                ? 'border-purple-400 bg-purple-50'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-600">
              {isDragActive
                ? 'Drop the image here'
                : 'Drag & drop an image here, or click to select'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Maximum file size: 5MB
            </p>
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-900">
            Personality
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateDescription}
            isLoading={isGenerating}
            loadingText="Generating..."
            leftIcon={!isGenerating ? <Wand2 className="h-4 w-4" /> : undefined}
            disabled={!avatarPreview || isGenerating}
          >
            Generate from Image
          </Button>
        </div>
        <Textarea
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          placeholder="Describe the character's personality, traits, and teaching style"
          fullWidth
        />
      </div>
      
      <Select
        label="Voice"
        options={[{ value: '', label: 'Select a voice' }, ...voiceOptions]}
        value={voiceId}
        onChange={setVoiceId}
        fullWidth
      />
      
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText={isEditing ? "Updating..." : "Creating..."}
          leftIcon={!isSubmitting ? (isEditing ? <Mic2 className="h-5 w-5" /> : <User className="h-5 w-5" />) : undefined}
        >
          {isEditing ? 'Update Character' : 'Create Character'}
        </Button>
      </div>
    </form>
  );
};