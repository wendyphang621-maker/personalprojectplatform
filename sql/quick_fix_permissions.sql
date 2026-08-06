-- =====================================================
-- 快速修复脚本：仅修复 RLS 权限问题
-- =====================================================

-- 1. 确保 authenticated 角色有足够权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. 修复存储桶 MIME 类型配置
DO $$
BEGIN
  -- 更新 storage.buckets 表的 allowed_mime_types
  UPDATE storage.buckets 
  SET allowed_mime_types = ARRAY[
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
    'application/x-zip-compressed'
  ]
  WHERE id = 'customer_light_files';
  
  -- 设置存储桶为公开
  UPDATE storage.buckets SET public = true WHERE id = 'customer_light_files';
END $$;

-- 3. 确保存储桶有正确的访问策略
DO $$
BEGIN
  -- 允许公开读取
  EXECUTE 'DROP POLICY IF EXISTS "Public can read files" ON storage.objects';
  EXECUTE '
    CREATE POLICY "Public can read files" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = ''customer_light_files'')
  ';
  
  -- 允许认证用户上传
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects';
  EXECUTE '
    CREATE POLICY "Authenticated users can upload files" 
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = ''customer_light_files'')
  ';
  
  -- 允许认证用户更新
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects';
  EXECUTE '
    CREATE POLICY "Authenticated users can update files" 
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = ''customer_light_files'')
  ';
  
  -- 允许认证用户删除
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects';
  EXECUTE '
    CREATE POLICY "Authenticated users can delete files" 
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = ''customer_light_files'')
  ';
END $$;

-- 4. 为所有数据表添加 RLS 策略
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_record.tablename || '_all_access', table_record.tablename);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', table_record.tablename || '_all_access', table_record.tablename);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '修复表 % 时出错: %', table_record.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

SELECT '权限修复完成！请刷新浏览器重试。' as result;
