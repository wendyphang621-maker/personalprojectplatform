-- =====================================================
-- 创建 Supabase 存储桶脚本
-- 创建 customer_light_files 存储桶用于客户附件存储
-- =====================================================

-- 创建存储桶（bucket）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer_light_files',
  'customer_light_files',
  true,
  10485760,  -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'multipart/form-data'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 设置存储桶的安全策略：允许 authenticated 用户读写
DO $$
BEGIN
  -- 删除旧的策略
  EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON storage.objects');
  EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects');
  EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update their files" ON storage.objects');
  EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete their files" ON storage.objects');
  EXECUTE format('DROP POLICY IF EXISTS "Public can read files" ON storage.objects');
  
  -- 允许公开读取
  EXECUTE format('
    CREATE POLICY "Public can read files" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = ''customer_light_files'')
  ');
  
  -- 允许认证用户上传
  EXECUTE format('
    CREATE POLICY "Authenticated users can upload files" 
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = ''customer_light_files'')
  ');
  
  -- 允许认证用户更新
  EXECUTE format('
    CREATE POLICY "Authenticated users can update files" 
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = ''customer_light_files'')
  ');
  
  -- 允许认证用户删除
  EXECUTE format('
    CREATE POLICY "Authenticated users can delete files" 
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = ''customer_light_files'')
  ');
END $$;

SELECT '存储桶 customer_light_files 配置完成！' as result;
