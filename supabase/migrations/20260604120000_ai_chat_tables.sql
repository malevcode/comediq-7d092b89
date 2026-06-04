-- Daily token usage tracking per user
CREATE TABLE IF NOT EXISTS ai_chat_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  messages_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai usage" ON ai_chat_usage
  FOR SELECT USING (auth.uid() = user_id);

-- AI-submitted mic change requests queue for admin review
CREATE TABLE IF NOT EXISTS ai_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('add_new', 'update', 'deactivate')),
  venue_name TEXT,
  day TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  raw_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai change requests" ON ai_change_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ai change requests" ON ai_change_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND isadmin = true
    )
  );

-- Atomic upsert to avoid race conditions on concurrent requests
CREATE OR REPLACE FUNCTION increment_ai_chat_usage(
  p_user_id UUID,
  p_tokens INTEGER
) RETURNS TABLE(tokens_used_today INTEGER, messages_today INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO ai_chat_usage (user_id, date, tokens_used, messages_count)
  VALUES (p_user_id, CURRENT_DATE, p_tokens, 1)
  ON CONFLICT (user_id, date) DO UPDATE
  SET
    tokens_used = ai_chat_usage.tokens_used + p_tokens,
    messages_count = ai_chat_usage.messages_count + 1,
    updated_at = NOW();

  RETURN QUERY
  SELECT au.tokens_used, au.messages_count
  FROM ai_chat_usage au
  WHERE au.user_id = p_user_id AND au.date = CURRENT_DATE;
END;
$$;
