import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FileText, Save } from "lucide-react";
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
        title: currentNote.substring(0, 50) + (currentNote.length > 50 ? "..." : ""),
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

  return (
    <Card className={`border-blue-200 bg-white/80 backdrop-blur ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div>
          <CardTitle className="text-lg text-blue-800">📝 Quick Notes</CardTitle>
          <CardDescription className="text-blue-600">Jot down ideas and thoughts</CardDescription>
        </div>
        <Sheet open={showSidebar} onOpenChange={(open) => {
          setShowSidebar(open);
          if (open) {
            loadSavedNotes();
          }
        }}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              Saved Notes
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Saved Notes</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3 pb-4">
              {savedNotes.map((note) => (
                <div 
                  key={note.id} 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => loadNoteAsDraft(note)}
                >
                  <div className="font-medium text-sm mb-1">{note.title || 'Untitled'}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    {new Date(note.updated_at).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-3">{note.content}</div>
                </div>
              ))}
              {savedNotes.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No saved notes yet
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          <textarea
            className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Write down your comedy ideas, material, or notes here..."
            value={currentNote}
            onChange={handleNoteChange}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="text-xs text-gray-500">
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