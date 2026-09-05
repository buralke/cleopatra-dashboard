CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  "from" TEXT,
  "to" TEXT,
  text TEXT,
  timestamp BIGINT,
  direction TEXT DEFAULT 'incoming',
  status TEXT DEFAULT 'received',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read messages" ON public.messages;
CREATE POLICY "Allow public read messages" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert messages" ON public.messages;
CREATE POLICY "Allow public insert messages" ON public.messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update messages" ON public.messages;
CREATE POLICY "Allow public update messages" ON public.messages FOR UPDATE USING (true);
