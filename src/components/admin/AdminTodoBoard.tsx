import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, CheckCircle, Circle, Clock, Trash2, ListTodo } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminTodo {
  id: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { key: 'scrape_target', label: 'Clubs to Scrape', icon: '🎭' },
  { key: 'advertiser_outreach', label: 'Advertisers to Contact', icon: '📧' },
  { key: 'host_target', label: 'Show Hosts to Target', icon: '🎤' },
] as const;

const STATUS_CYCLE = ['todo', 'in_progress', 'done'] as const;

const priorityColor = (p: string) => {
  switch (p) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-muted text-muted-foreground';
  }
};

const statusIcon = (s: string) => {
  switch (s) {
    case 'done': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'in_progress': return <Clock className="w-4 h-4 text-orange-400" />;
    default: return <Circle className="w-4 h-4 text-gray-400" />;
  }
};

export function AdminTodoBoard() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<AdminTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_todos')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTodos(data as AdminTodo[]);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setLoading(false);
  };

  const addTodo = async (category: string) => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase.from('admin_todos').insert({
      category,
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      priority: newPriority,
      created_by: user?.id || null,
    }).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setTodos(prev => [data as AdminTodo, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
      setAddingCategory(null);
    }
  };

  const cycleStatus = async (todo: AdminTodo) => {
    const idx = STATUS_CYCLE.indexOf(todo.status as any);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const { error } = await supabase.from('admin_todos').update({ status: next }).eq('id', todo.id);
    if (!error) {
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, status: next } : t));
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('admin_todos').delete().eq('id', id);
    if (!error) setTodos(prev => prev.filter(t => t.id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
      </div>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl border-0">
      <CardContent className="p-4 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <ListTodo className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-foreground">Admin To-Dos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.map(cat => {
            const catTodos = todos.filter(t => t.category === cat.key);
            const activeTodos = catTodos.filter(t => t.status !== 'done');
            const doneTodos = catTodos.filter(t => t.status === 'done');

            return (
              <div key={cat.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span>{cat.icon}</span> {cat.label}
                    <Badge variant="secondary" className="text-xs">{activeTodos.length}</Badge>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setAddingCategory(addingCategory === cat.key ? null : cat.key)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {addingCategory === cat.key && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <Input
                      placeholder="Title"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={e => e.key === 'Enter' && addTodo(cat.key)}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      className="text-sm min-h-[40px]"
                    />
                    <div className="flex gap-2">
                      <Select value={newPriority} onValueChange={setNewPriority}>
                        <SelectTrigger className="h-7 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="h-7 text-xs" onClick={() => addTodo(cat.key)}>
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {[...activeTodos, ...doneTodos].map(todo => (
                    <div
                      key={todo.id}
                      className={`rounded-lg border p-3 transition-all ${
                        todo.status === 'done' ? 'opacity-50 bg-muted/30' : 'bg-background'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button onClick={() => cycleStatus(todo)} className="mt-0.5 shrink-0">
                          {statusIcon(todo.status)}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${todo.status === 'done' ? 'line-through' : ''}`}>
                            {todo.title}
                          </p>
                          {todo.description && (
                            <p className="text-xs text-muted-foreground mt-1">{todo.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-2">
                            <Badge className={`text-[10px] px-1.5 py-0 ${priorityColor(todo.priority)}`}>
                              {todo.priority}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {todo.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {catTodos.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No items yet</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
