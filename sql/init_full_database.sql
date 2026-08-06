-- =====================================================
-- 完整数据库初始化脚本
-- 一次性创建所有表、字段、权限
-- =====================================================

-- 开始事务
BEGIN;

-- =====================================================
-- 1. customers 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  "group" TEXT,
  country TEXT,
  region TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  attachments TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. sample_deliveries 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sample_deliveries (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  model TEXT,
  quantity INT DEFAULT 0,
  order_date DATE,
  logistics_no TEXT,
  status TEXT,
  tracking_no TEXT,
  logistics_company TEXT,
  actual_delivery DATE,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. sales_orders 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT,
  customer_name TEXT,
  model TEXT,
  quantity INT DEFAULT 0,
  order_date DATE,
  logistics_no TEXT,
  status TEXT,
  amount NUMERIC DEFAULT 0,
  order_type TEXT,
  currency TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. product_models 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_models (
  id TEXT PRIMARY KEY,
  name TEXT,
  model_name TEXT,
  chip TEXT,
  chip_scheme TEXT,
  screen TEXT,
  screen_param TEXT,
  certifications TEXT DEFAULT '[]',
  cert_list TEXT DEFAULT '[]',
  supplier_id TEXT,
  supplier_name TEXT,
  render_image_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. cert_records 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cert_records (
  id TEXT PRIMARY KEY,
  model_id TEXT,
  model_name TEXT,
  cert_type TEXT,
  cert_no TEXT,
  issue_date DATE,
  expire_date DATE,
  attachments TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. cert_matrix_files 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cert_matrix_files (
  id TEXT PRIMARY KEY,
  name TEXT,
  template TEXT,
  category TEXT,
  order_no INT DEFAULT 0,
  remark TEXT,
  is_deleted BOOLEAN DEFAULT false,
  update_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. cert_matrix_cells 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cert_matrix_cells (
  id TEXT PRIMARY KEY,
  file_id TEXT,
  model_id TEXT,
  status TEXT,
  remark TEXT,
  cert_id TEXT,
  cert_type TEXT,
  is_deleted BOOLEAN DEFAULT false,
  update_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. cert_matrix_templates 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cert_matrix_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  files TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 9. cert_matrix_statuses 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cert_matrix_statuses (
  id TEXT PRIMARY KEY,
  "key" TEXT,
  name TEXT,
  color TEXT,
  bg TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. suppliers 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 11. logistics_bills 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.logistics_bills (
  id TEXT PRIMARY KEY,
  tracking_no TEXT,
  customer_id TEXT,
  customer_name TEXT,
  country TEXT,
  freight_forwarder TEXT,
  freight_amount NUMERIC DEFAULT 0,
  payment_status TEXT,
  write_off_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 12. daily_todos 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_todos (
  id TEXT PRIMARY KEY,
  todo_date DATE,
  date_value DATE,
  title TEXT,
  content TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 13. customer_follow_ups 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customer_follow_ups (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT,
  content TEXT,
  followup_date DATE,
  result TEXT,
  contact_method TEXT,
  po_number TEXT,
  next_followup DATE,
  operator TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 14. customer_payments 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT,
  amount NUMERIC DEFAULT 0,
  payment_date DATE,
  method TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 15. projects 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  color TEXT,
  status TEXT,
  project_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 16. stages 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stages (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  name TEXT,
  order_no INT DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 17. tasks 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  stage_id TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  assignee TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 18. package_sample_follows 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.package_sample_follows (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  customer_id TEXT,
  model TEXT,
  follow_content TEXT,
  follow_type TEXT,
  next_follow_date DATE,
  last_follow_date DATE,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 19. activate_export_configs 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activate_export_configs (
  id TEXT PRIMARY KEY,
  customer TEXT,
  update_frequency TEXT,
  receive_email TEXT,
  model TEXT,
  model_name TEXT,
  country TEXT,
  software_version TEXT,
  need_imei BOOLEAN DEFAULT false,
  need_filter BOOLEAN DEFAULT false,
  export_table_name TEXT,
  fota_source TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 20. daily_reminders 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_reminders (
  id TEXT PRIMARY KEY,
  time_value TEXT,
  content TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 21. todo_remind_logs 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.todo_remind_logs (
  id TEXT PRIMARY KEY,
  remind_date DATE,
  todo_id TEXT,
  reminded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 22. logistics_orders 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.logistics_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT,
  tracking_no TEXT,
  logistics_company TEXT,
  status TEXT,
  estimated_delivery DATE,
  actual_delivery DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 23. package_freight_records 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.package_freight_records (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  model TEXT,
  invoice_no TEXT,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  unpaid_amount NUMERIC DEFAULT 0,
  currency TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 24. customer_groups 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customer_groups (
  id TEXT PRIMARY KEY,
  group_name TEXT,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 25. product_images 表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id TEXT PRIMARY KEY,
  model_id TEXT,
  pic_url TEXT,
  pic_size TEXT,
  pic_type TEXT,
  upload_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 提交
COMMIT;

-- =====================================================
-- 授权所有表
-- =====================================================

-- 1. Schema 级权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. 为所有刚创建的表授权
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    BEGIN
      -- 授权给 authenticated 角色
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_record.tablename);
      -- 授权给 anon 角色（只读）
      EXECUTE format('GRANT SELECT ON public.%I TO anon', table_record.tablename);
      -- 启用 RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
      -- 创建全访问策略
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_record.tablename || '_all_access', table_record.tablename);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', table_record.tablename || '_all_access', table_record.tablename);
      -- 公共读取策略
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_record.tablename || '_public_read', table_record.tablename);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)', table_record.tablename || '_public_read', table_record.tablename);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '授权表 % 时出错: %', table_record.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

-- 3. 序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- 修复存储桶权限
-- =====================================================

DO $$
BEGIN
  -- 确保 storage 表也有正确的权限
  EXECUTE 'GRANT ALL ON storage.buckets TO authenticated';
  EXECUTE 'GRANT ALL ON storage.objects TO authenticated';
  
  -- 设置 customer_light_files 存储桶为公开
  EXECUTE 'UPDATE storage.buckets SET public = true WHERE id = ''customer_light_files''';
  
  -- 更新允许的 MIME 类型
  EXECUTE 'UPDATE storage.buckets SET 
    allowed_mime_types = ARRAY[
      ''image/jpeg'',
      ''image/png'',
      ''image/gif'',
      ''image/bmp'',
      ''image/tiff'',
      ''application/pdf'',
      ''application/msword'',
      ''application/vnd.openxmlformats-officedocument.wordprocessingml.document'',
      ''application/vnd.ms-excel'',
      ''application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'',
      ''application/vnd.ms-powerpoint'',
      ''application/vnd.openxmlformats-officedocument.presentationml.presentation'',
      ''text/plain'',
      ''text/csv'',
      ''application/zip'',
      ''application/x-zip-compressed'',
      ''application/vnd.oasis.opendocument.spreadsheet''
    ],
    file_size_limit = 52428800
    WHERE id = ''customer_light_files''';
  
  -- 存储桶 RLS 策略
  EXECUTE 'DROP POLICY IF EXISTS "Public can read files" ON storage.objects';
  EXECUTE 'CREATE POLICY "Public can read files" ON storage.objects FOR SELECT USING (bucket_id = ''customer_light_files'')';
  
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects';
  EXECUTE 'CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''customer_light_files'')';
  
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects';
  EXECUTE 'CREATE POLICY "Authenticated users can update files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''customer_light_files'')';
  
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects';
  EXECUTE 'CREATE POLICY "Authenticated users can delete files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''customer_light_files'')';
END $$;

-- 完成
SELECT '✅ 数据库初始化完成！所有表和权限已配置好。' as result;
