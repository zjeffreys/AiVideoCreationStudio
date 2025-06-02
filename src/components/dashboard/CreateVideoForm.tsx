import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Character, MusicStyle } from '../../types';

type Props = {
  characters: Character[];
  musicStyles: MusicStyle[];
  onVideoCreated: () => void;
};

export const CreateVideoForm: React.FC<Props> = ({ 
  characters, 
  musicStyles,
  onVideoCreated 
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [lessonPlan, setLessonPlan] = useState('');
  const [script, setScript] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [musicStyle, setMusicStyle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title || !lessonPlan) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First insert the video data
      const { error } = await supabase.from('videos').insert({
        user_id: user!.id,
        title,
        description: lessonPlan,
        script,
        characters: selectedCharacters.length > 0 ? selectedCharacters : null,
        music_style: musicStyle || null,
        status: 'processing',
        thumbnail_url: 'https://via.placeholder.com/640x360?text=Processing...',
      });
      
      if (error) throw error;
      
      // Simulate AI processing with a timeout
      setTimeout(() => {
        onVideoCreated();
        setIsSubmitting(false);
        
        // Reset form fields
        setTitle('');
        setLessonPlan('');
        setScript('');
        setSelectedCharacters([]);
        setMusicStyle('');
      }, 3000);
      
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      setIsSubmitting(false);
    }
  };

  const characterOptions = characters.map(character => ({
    value: character.id,
    label: character.name,
  }));

  const musicStyleOptions = musicStyles.map(style => ({
    value: style.id,
    label: style.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <Input
        label="Video Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for your educational video"
        required
        fullWidth
      />
      
      <Textarea
        label="Lesson Plan"
        value={lessonPlan}
        onChange={(e) => setLessonPlan(e.target.value)}
        placeholder="Describe what you want to teach in this video. Be specific about key points, concepts, and learning objectives."
        required
        fullWidth
      />
      
      <Textarea
        label="Script or Scene Notes (optional)"
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Add detailed script, scene directions, or other notes to guide the AI video generation."
        fullWidth
      />
      
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Select
            label="Characters"
            options={[{ value: '', label: 'Select characters' }, ...characterOptions]}
            value={selectedCharacters[0] || ''}
            onChange={(value) => {
              if (value) {
                setSelectedCharacters([value]);
              } else {
                setSelectedCharacters([]);
              }
            }}
            fullWidth
          />
          
          {selectedCharacters.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCharacters.map((charId) => {
                const char = characters.find((c) => c.id === charId);
                return (
                  <div 
                    key={charId}
                    className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-900"
                  >
                    <span>{char?.name || 'Character'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCharacters(selectedCharacters.filter((id) => id !== charId));
                      }}
                      className="ml-1 text-purple-700 hover:text-purple-900"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <Select
            label="Music Style"
            options={[{ value: '', label: 'Select music style' }, ...musicStyleOptions]}
            value={musicStyle}
            onChange={setMusicStyle}
            fullWidth
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText="Generating Video..."
          leftIcon={!isSubmitting ? <PlusCircle className="h-5 w-5" /> : undefined}
        >
          Generate Video
        </Button>
      </div>
    </form>
  );
};