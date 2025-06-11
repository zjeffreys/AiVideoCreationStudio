import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CharacterCard } from '../components/characters/CharacterCard';
import { CharacterForm } from '../components/characters/CharacterForm';
import { Character, Voice } from '../types';
import { getVoice } from '../lib/elevenlabs';

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
      
      // Fetch voices from ElevenLabs
      const voicesData = await getVoice();
      
      setCharacters(charactersData as Character[]);
      setVoices(voicesData);
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
    <div className="min-h-screen bg-white dark:bg-slate-900 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Characters</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Create and manage characters for your educational videos
        </p>
      </div>
      
      {isFormOpen ? (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
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
                className="pl-9 bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400"
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
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-400"></div>
                <p className="text-lg font-medium text-slate-500 dark:text-slate-300">Loading characters...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 text-red-600 dark:text-red-400">
              <p className="font-medium">Error loading characters</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 p-12 text-center">
              <div className="mb-4 rounded-full bg-slate-200 dark:bg-slate-700 p-3">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-slate-700 dark:text-white">No characters found</h3>
              <p className="mb-4 max-w-md text-slate-500 dark:text-slate-400">
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