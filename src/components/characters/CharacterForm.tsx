import React, { useState, useEffect } from 'react';
import { User, Mic2 } from 'lucide-react';
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
  const [avatarUrl, setAvatarUrl] = useState(character?.avatar_url || '');
  const [voiceId, setVoiceId] = useState(character?.voice_id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!character;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name) {
      setError('Please enter a character name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        // Update existing character
        const { error } = await supabase
          .from('characters')
          .update({
            name,
            personality,
            avatar_url: avatarUrl || null,
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
            avatar_url: avatarUrl || null,
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
    }
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
      
      <Textarea
        label="Personality"
        value={personality}
        onChange={(e) => setPersonality(e.target.value)}
        placeholder="Describe the character's personality, traits, and teaching style"
        fullWidth
      />
      
      <Input
        label="Avatar URL"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="https://example.com/avatar.jpg"
        fullWidth
      />
      
      {avatarUrl && (
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200">
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                // If image fails to load, replace with placeholder
                e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+URL';
              }}
            />
          </div>
          <p className="text-sm text-slate-500">Avatar preview</p>
        </div>
      )}
      
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