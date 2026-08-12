-- 开发信存档表
CREATE TABLE IF NOT EXISTS public.email_letters (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  send_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  content TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS 策略
ALTER TABLE IF EXISTS public.email_letters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_letters_all_access" ON public.email_letters;
CREATE POLICY "email_letters_all_access" ON public.email_letters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 字段注释
COMMENT ON TABLE public.email_letters IS '开发信存档';
COMMENT ON COLUMN public.email_letters.subject IS '邮件主题';
COMMENT ON COLUMN public.email_letters.customer_name IS '客户姓名';
COMMENT ON COLUMN public.email_letters.email IS '客户邮箱';
COMMENT ON COLUMN public.email_letters.send_date IS '发送日期';
COMMENT ON COLUMN public.email_letters.status IS '状态：draft/sent/replied';
COMMENT ON COLUMN public.email_letters.content IS '邮件正文内容';
COMMENT ON COLUMN public.email_letters.tags IS '标签，JSON数组格式';
