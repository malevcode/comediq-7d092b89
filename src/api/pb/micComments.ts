import { pb } from '@/integrations/pocketbase/client';

export interface MicComment {
  id: string;
  mic_unique_identifier: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  username?: string;
}

export async function fetchMicComments(micUniqueIdentifier: string): Promise<MicComment[]> {
  const comments = await pb.collection('mic_comments').getFullList({
    filter: `mic_unique_identifier = "${micUniqueIdentifier}"`,
    sort: '-created',
  });

  const userIds = [...new Set(comments.map(c => c.user_id as string).filter(Boolean))];
  const profiles = userIds.length > 0
    ? await pb.collection('profiles').getFullList({
        filter: userIds.map(id => `supabase_user_id = "${id}" || user = "${id}"`).join(' || '),
        fields: 'supabase_user_id,user,username,stage_name',
      })
    : [];

  const profileMap = new Map(
    profiles.map(p => [p.supabase_user_id || p.user, p.stage_name || p.username || 'Anonymous'])
  );

  return comments.map(c => ({
    ...c,
    username: profileMap.get(c.user_id as string) || 'Anonymous',
  })) as unknown as MicComment[];
}

export async function addComment(micUniqueIdentifier: string, userId: string, commentText: string) {
  return pb.collection('mic_comments').create({
    mic_unique_identifier: micUniqueIdentifier,
    user_id: userId,
    comment_text: commentText.trim(),
  });
}

export async function updateComment(commentId: string, commentText: string) {
  return pb.collection('mic_comments').update(commentId, {
    comment_text: commentText.trim(),
    updated_at: new Date().toISOString(),
  });
}

export async function deleteComment(commentId: string) {
  await pb.collection('mic_comments').delete(commentId);
}
