import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Save, Trash2, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface QuickNotesProps {
  className?: string;
}

export const QuickNotes: React.FC<QuickNotesProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const [currentNote, setCurrentNote] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (user) {
      loadDraft();
      loadNotes();
    }
  }, [user]);

  const loadDraft = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_draft", true)
      .single();

    if (data) {
      setCurrentNote(data.content);
    }
  };

  const loadNotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_draft", false)
      .order("updated_at", { ascending: false });

    setSavedNotes(data || []);
  };

  const loadSavedNotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_draft", false)
      .order("updated_at", { ascending: false });

    setSavedNotes(data || []);
  };

  const saveDraft = async (content: string) => {
    if (!user) return;

    const { data: existingDraft } = await supabase
      .from("user_notes")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_draft", true)
      .single();

    if (existingDraft) {
      await supabase
        .from("user_notes")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", existingDraft.id);
    } else {
      await supabase
        .from("user_notes")
        .insert({
          user_id: user.id,
          content,
          title: null,
          is_draft: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }
  };

  const saveAsNote = async () => {
    if (!user || !currentNote.trim()) return;

    // Save as a new note (not draft)
    await supabase
      .from("user_notes")
      .insert({
        user_id: user.id,
        content: currentNote,
        title: currentNote.split('\n')[0]|| 'Untitled Note',
        is_draft: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    // Clear the draft
    const { data: existingDraft } = await supabase
      .from("user_notes")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_draft", true)
      .single();

    if (existingDraft) {
      await supabase
        .from("user_notes")
        .delete()
        .eq("id", existingDraft.id);
    }

    setCurrentNote("");
    loadNotes();
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setCurrentNote(content);

    // Auto-save draft after a delay
    const timeoutId = setTimeout(() => {
      if (content.trim()) {
        saveDraft(content);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const loadNoteAsDraft = async (note: any) => {
    setCurrentNote(note.content);
    setShowSidebar(false);
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (!error) {
        // Remove from local state
        setSavedNotes(savedNotes.filter(note => note.id !== noteId));
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return (
    <Card className={`border-0 bg-transparent backdrop-blur ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#07111f]/10 bg-white/20 dark:border-white/10 dark:bg-[#102a53]/30">
        <div>
          <CardTitle className="text-lg text-[#07111f] dark:text-white">📝 Quick Notes</CardTitle>
          <CardDescription className="text-[#07111f]/70 dark:text-white/80">Jot down ideas and thoughts</CardDescription>
        </div>
        <Popover open={showSidebar} onOpenChange={(open) => {
          setShowSidebar(open);
          if (open) {
            loadSavedNotes();
          }
          }}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2 border-[#07111f]/10 bg-white/30 text-[#07111f] hover:bg-white/50 hover:text-[#1a5fb4] dark:border-white/40 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Saved Notes
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-96 overflow-y-auto border-[#07111f]/10 bg-white text-[#07111f] dark:border-white/10 dark:bg-[#102a53] dark:text-white" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm mb-3">Saved Notes</h4>
              {savedNotes.map((note) => (
                <div
                  key={note.id}
                  className="group relative cursor-pointer rounded-lg bg-[#1a5fb4]/10 p-3 transition-colors hover:bg-[#1a5fb4]/10 dark:bg-white/10 dark:hover:bg-white/10"
                  onClick={() => loadNoteAsDraft(note)}
                >
                  <div className="font-medium text-sm mb-1">{note.title || 'Untitled'}</div>
                  <div className="mb-2 text-xs text-[#07111f]/60 dark:text-white/60">
                    {new Date(note.updated_at).toLocaleString()}
                  </div>
                  <div className="line-clamp-3 text-sm text-[#07111f]/70 dark:text-white/70">{note.content}</div>

                  {/* Delete button - appears on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="absolute top-0 right-0 w-1/6 h-full opacity-0 group-hover:opacity-100 transition-colors duration-200 bg-red-300 hover:bg-red-500 text-white flex items-center justify-center rounded-r-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {savedNotes.length === 0 && (
                <div className="py-4 text-center text-[#07111f]/60 dark:text-white/60">
                  No saved notes yet
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          <textarea
            className="h-32 w-full resize-none rounded-lg border-0 bg-white/30 p-3 text-[#07111f] placeholder:text-[#07111f]/50 focus:border-transparent focus:ring-2 focus:ring-[#1a5fb4]/50 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:focus:ring-[#ffc72c]/70"
            placeholder="Write down your comedy ideas, material, or notes here..."
            value={currentNote}
            onChange={handleNoteChange}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="text-xs text-[#07111f]/60 dark:text-white/60">
            {currentNote.length} characters
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={saveAsNote}
            disabled={!currentNote.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
