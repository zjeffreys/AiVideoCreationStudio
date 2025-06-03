import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CharacterCard } from '../components/characters/CharacterCard';
import { CharacterForm } from '../components/characters/CharacterForm';
import { Character, Voice } from '../types';

export const Characters = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | undefined>(undefined);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');
      
      if (charactersError) throw charactersError;
      
      // In a real app, you would fetch voices from your API or Supabase
      // Here we'll use a mock list of voices
      const mockVoices: Voice[] = [
        { id: 'v1', name: 'Male Teacher (US)', gender: 'male', accent: 'American' },
        { id: 'v2', name: 'Female Instructor (US)', gender: 'female', accent: 'American' },
        { id: 'v3', name: 'Male Professor (UK)', gender: 'male', accent: 'British' },
        { id: 'v4', name: 'Female Narrator (AU)', gender: 'female', accent: 'Australian' },
        { id: 'v5', name: 'Child Voice', gender: 'neutral', accent: 'American' },
      ];
      
      setCharacters(charactersData as Character[]);
      setVoices(mockVoices);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter characters locally based on search query
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setIsFormOpen(true);
  };

  const handleDeleteCharacter = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      try {
        const { error } = await supabase
          .from('characters')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh characters list
        fetchData();
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An error occurred while deleting the character');
        }
      }
    }
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingCharacter(undefined);
    fetchData();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingCharacter(undefined);
  };

  const filteredCharacters = searchQuery
    ? characters.filter(character => 
        character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (character.personality && character.personality.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : characters;

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Characters</h1>
        <p className="text-slate-500">
          Create and manage characters for your educational videos
        </p>
      </div>
      
      {isFormOpen ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            {editingCharacter ? 'Edit Character' : 'Create New Character'}
          </h2>
          <CharacterForm
            character={editingCharacter}
            voices={voices}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </form>
            
            <Button
              leftIcon={<PlusCircle className="h-5 w-5" />}
              onClick={() => setIsFormOpen(true)}
            >
              New Character
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-600"></div>
                <p className="text-lg font-medium text-slate-700">Loading characters...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-red-600">
              <p className="font-medium">Error loading characters</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-3">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-slate-900">No characters found</h3>
              <p className="mb-4 max-w-md text-slate-500">
                {searchQuery
                  ? `No characters matching "${searchQuery}"`
                  : "You haven't created any characters yet. Create your first character!"}
              </p>
              <Button
                leftIcon={<PlusCircle className="h-5 w-5" />}
                onClick={() => setIsFormOpen(true)}
              >
                Create New Character
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onEdit={handleEditCharacter}
                  onDelete={handleDeleteCharacter}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};