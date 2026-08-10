-- =====================================================
-- 完整数据库重建脚本（清空旧数据 + 按面板功能重建表）
-- 用途：彻底清除 Supabase 旧数据/旧表/旧字段映射残留，
--       按当前前端面板实际使用的字段一次性重建所有表。
-- 执行方式：在 Supabase Dashboard → SQL Editor 中整段粘贴执行。
-- 安全性：会 DROP 所有业务表及其数据，执行前请确认无需保留旧数据。
-- =====================================================

BEGIN;

-- =====================================================
-- 0. 删除所有旧业务表（CASCADE 一并清理依赖、策略、索引）
-- =====================================================
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.sample_deliveries CASCADE;
DROP TABLE IF EXISTS public.sales_orders CASCADE;
DROP TABLE IF EXISTS public.product_models CASCADE;
DROP TABLE IF EXISTS public.cert_records CASCADE;
DROP TABLE IF EXISTS public.product_certs CASCADE;
DROP TABLE IF EXISTS public.cert_matrix_files CASCADE;
DROP TABLE IF EXISTS public.cert_matrix_cells CASCADE;
DROP TABLE IF EXISTS public.cert_matrix_templates CASCADE;
DROP TABLE IF EXISTS public.cert_matrix_statuses CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.logistics_bills CASCADE;
DROP TABLE IF EXISTS public.logistics_orders CASCADE;
DROP TABLE IF EXISTS public.daily_todos CASCADE;
DROP TABLE IF EXISTS public.customer_follow_ups CASCADE;
DROP TABLE IF EXISTS public.customer_payments CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.stages CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.package_sample_follows CASCADE;
DROP TABLE IF EXISTS public.activate_export_configs CASCADE;
DROP TABLE IF EXISTS public.daily_reminders CASCADE;
DROP TABLE IF EXISTS public.todo_remind_logs CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.inventory_logs CASCADE;
DROP TABLE IF EXISTS public.price_history CASCADE;

-- =====================================================
-- 设计说明：
-- 1. 除 created_at/updated_at 用 TIMESTAMPTZ、id 用 TEXT 主键外，
--    其余字段统一使用 TEXT 类型，避免 Excel 导入时数字/布尔/JSON
--    类型转换失败导致整行写入失败（前端会自行做类型处理）。
-- 2. 字段命名采用 snake_case，与前端 camelCase 字段经 camelToSnake
--    转换后的结果一一对应；少量语义重命名字段（如 product_models.name
--    → model_name）与 supabase.js 中 FIELD_MAPPING 保持一致。
-- 3. 每个表都包含 created_at / updated_at，方便排序与冲突检测。
-- =====================================================

-- =====================================================
-- 1. customers 客户主台账
-- =====================================================
CREATE TABLE public.customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  "group" TEXT,
  country TEXT,
  region TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  model TEXT,
  first_contact_date TEXT,
  sample_count TEXT,
  notes TEXT,
  remark TEXT,
  local_material_path TEXT,
  attachments TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. sample_deliveries 样机寄样
-- =====================================================
CREATE TABLE public.sample_deliveries (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  model TEXT,
  area TEXT,
  logistics TEXT,
  tracking_no TEXT,
  send_date TEXT,
  qty TEXT,
  freight TEXT,
  status TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. sales_orders 销售订单总台账
-- 字段映射：customerId→customer_id, customerName→customer_name,
--   qty→quantity, bookingDate→order_date, logisticsNo→logistics_no,
--   bulkFreight→bulk_freight, orderType→order_type,
--   balanceSettled→payment_status（前端 id 保持 id，不再映射到 order_no）
-- =====================================================
CREATE TABLE public.sales_orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT,
  model TEXT,
  quantity TEXT,
  order_date TEXT,
  logistics_no TEXT,
  status TEXT,
  amount TEXT,
  currency TEXT,
  bulk_freight TEXT,
  order_type TEXT,
  payment_status TEXT,
  order_no TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. product_models 机型参数库
-- 字段映射：name→model_name, chip→chip_scheme, screen→screen_param,
--   certifications→cert_list, supplierId→supplier_name
-- =====================================================
CREATE TABLE public.product_models (
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
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. cert_records 合规认证档案（前端 key: certRecords）
-- 字段映射：modelId→model_id, modelName→model_name, certType→cert_type,
--   certNo→cert_no, issueDate→issue_date, expireDate→expire_date
-- =====================================================
CREATE TABLE public.cert_records (
  id TEXT PRIMARY KEY,
  model_id TEXT,
  model_name TEXT,
  model TEXT,
  cert_type TEXT,
  cert_no TEXT,
  issue_date TEXT,
  expire_date TEXT,
  expiry_date TEXT,
  cert_file_path TEXT,
  attachments TEXT DEFAULT '[]',
  organization TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. cert_matrix_files 认证矩阵文件项
-- 字段映射：isDeleted→is_deleted, updateTime→update_time
-- =====================================================
CREATE TABLE public.cert_matrix_files (
  id TEXT PRIMARY KEY,
  name TEXT,
  template TEXT,
  category TEXT,
  "order" TEXT,
  order_no TEXT,
  remark TEXT,
  is_deleted TEXT DEFAULT 'false',
  update_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. cert_matrix_cells 认证矩阵单元格
-- 字段映射：fileId→file_id, modelId→model_id, certId→cert_id,
--   certType→cert_type, isDeleted→is_deleted, updateTime→update_time
-- =====================================================
CREATE TABLE public.cert_matrix_cells (
  id TEXT PRIMARY KEY,
  file_id TEXT,
  model_id TEXT,
  status TEXT,
  remark TEXT,
  cert_id TEXT,
  cert_type TEXT,
  is_deleted TEXT DEFAULT 'false',
  update_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. cert_matrix_templates 认证矩阵自定义模板
-- =====================================================
CREATE TABLE public.cert_matrix_templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  files TEXT DEFAULT '[]',
  snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 9. cert_matrix_statuses 认证矩阵自定义状态
-- =====================================================
CREATE TABLE public.cert_matrix_statuses (
  id TEXT PRIMARY KEY,
  "key" TEXT,
  key_value TEXT,
  name TEXT,
  color TEXT,
  bg TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. suppliers 供应商
-- =====================================================
CREATE TABLE public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  supply_models TEXT,
  qualification_path TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 11. logistics_bills 物流账单（前端 key: logisticsBills）
-- 字段映射：logisticsNo→logistics_no, customerName→customer_name,
--   freightForwarder→freight_forwarder, freightAmount→freight_amount,
--   paymentStatus→payment_status, writeOffDate→write_off_date
-- =====================================================
CREATE TABLE public.logistics_bills (
  id TEXT PRIMARY KEY,
  logistics_no TEXT,
  customer_id TEXT,
  customer_name TEXT,
  country TEXT,
  freight_forwarder TEXT,
  freight_amount TEXT,
  payment_status TEXT,
  bill_image TEXT,
  write_off_date TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 12. daily_todos 日常待办
-- 字段映射：todoDate→todo_date, dateValue→date
-- =====================================================
CREATE TABLE public.daily_todos (
  id TEXT PRIMARY KEY,
  todo_date TEXT,
  date TEXT,
  date_value TEXT,
  title TEXT,
  content TEXT,
  completed TEXT DEFAULT 'false',
  priority TEXT,
  category TEXT,
  customer_id TEXT,
  customer_name TEXT,
  model_id TEXT,
  model TEXT,
  deadline TEXT,
  tags TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 13. customer_follow_ups 客户跟进记录
-- 字段映射：customerId→customer_id, customerName→customer_name,
--   followupDate→followup_date, contactMethod→contact_method,
--   poNumber→po_number, nextFollowup→next_followup
-- =====================================================
CREATE TABLE public.customer_follow_ups (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT,
  content TEXT,
  followup_date TEXT,
  result TEXT,
  contact_method TEXT,
  po_number TEXT,
  next_followup TEXT,
  operator TEXT,
  attachments TEXT DEFAULT '[]',
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 14. customer_payments 客户付款记录
-- 字段映射：customerId→customer_id, customerName→customer_name,
--   orderNo→order_no, orderDate→order_date, productName→product_name,
--   specModel→spec_model, unitPrice→unit_price, orderAmount→order_amount,
--   deliveryDate→delivery_date, paymentBatch→payment_batch,
--   paymentType→payment_type, paymentDate→payment_date,
--   paymentAmount→payment_amount, paymentMethod→payment_method,
--   arrivalStatus→arrival_status
-- =====================================================
CREATE TABLE public.customer_payments (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT,
  order_no TEXT,
  order_date TEXT,
  product_name TEXT,
  spec_model TEXT,
  quantity TEXT,
  unit_price TEXT,
  order_amount TEXT,
  delivery_date TEXT,
  payment_batch TEXT,
  payment_type TEXT,
  payment_date TEXT,
  payment_amount TEXT,
  payment_method TEXT,
  arrival_status TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 15. projects 项目空间
-- 字段映射：projectType→project_type
-- =====================================================
CREATE TABLE public.projects (
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
-- 16. stages 项目阶段
-- 字段映射：projectId→project_id, order→order_no（避免 SQL 保留字）
-- =====================================================
CREATE TABLE public.stages (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  name TEXT,
  order_no TEXT,
  "order" TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 17. tasks 项目任务（甘特图）
-- 字段映射：projectId→project_id, stageId→stage_id, startDate→start_date,
--   customerName→customer_name, logisticsNo→logistics_no, sampleQty→sample_qty
-- =====================================================
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  stage_id TEXT,
  name TEXT,
  title TEXT,
  description TEXT,
  duration TEXT,
  start_date TEXT,
  completed TEXT DEFAULT 'false',
  milestone TEXT DEFAULT 'false',
  status TEXT,
  priority TEXT,
  assignee TEXT,
  due_date TEXT,
  customer_name TEXT,
  model TEXT,
  logistics_no TEXT,
  email TEXT,
  sample_qty TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 18. package_sample_follows 包装样机跟进
-- 字段映射：projectName→project_name, internalModel→internal_model,
--   businessType→business_type, followStatus→follow_status,
--   sendDate→send_date, receiveDate→receive_date,
--   nextFollowDate→next_follow_date, followLogs→follow_logs,
--   customField1→custom_field1, emailSubject→email_subject,
--   overseasContact→overseas_contact, colorBoxVersion→color_box_version,
--   fileLink→file_link, sendTime→send_time, logisticsNo→logistics_no,
--   logisticsCompany→logistics_company, sendPurpose→send_purpose,
--   sendQty→send_qty, customerId→customer_name
-- =====================================================
CREATE TABLE public.package_sample_follows (
  id TEXT PRIMARY KEY,
  project_name TEXT,
  internal_model TEXT,
  business_type TEXT,
  follow_status TEXT,
  send_date TEXT,
  receive_date TEXT,
  next_follow_date TEXT,
  follow_logs TEXT DEFAULT '[]',
  remark TEXT,
  custom_field1 TEXT,
  attachments TEXT DEFAULT '[]',
  email_subject TEXT,
  customer TEXT,
  customer_name TEXT,
  overseas_contact TEXT,
  color_box_version TEXT,
  file_link TEXT,
  send_time TEXT,
  logistics_no TEXT,
  logistics_company TEXT,
  receiver TEXT,
  destination TEXT,
  send_purpose TEXT,
  send_qty TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 19. activate_export_configs 激活导出配置
-- 字段映射：updateFrequency→update_frequency, receiveEmail→receive_email,
--   softwareVersion→software_version, needImei→need_imei,
--   needFilter→need_filter, exportTableName→export_table_name,
--   fotaSource→fota_source
-- 注：前端 id 由代码生成（AEC-XXX），保留 TEXT 主键 + UPSERT。
-- =====================================================
CREATE TABLE public.activate_export_configs (
  id TEXT PRIMARY KEY,
  customer TEXT,
  update_frequency TEXT,
  receive_email TEXT,
  model TEXT,
  model_name TEXT,
  country TEXT,
  software_version TEXT,
  need_imei TEXT DEFAULT 'false',
  need_filter TEXT DEFAULT 'false',
  export_table_name TEXT,
  fota_source TEXT,
  enabled TEXT DEFAULT 'true',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 20. daily_reminders 每日提醒
-- 字段映射：businessType→business_type, activateConfigId→activate_config_id,
--   remindTime→remind_time, repeatRule→repeat_rule
-- =====================================================
CREATE TABLE public.daily_reminders (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  business_type TEXT,
  activate_config_id TEXT,
  remind_time TEXT,
  time_value TEXT,
  repeat_rule TEXT,
  status TEXT,
  enabled TEXT DEFAULT 'true',
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 21. todo_remind_logs 提醒日志
-- =====================================================
CREATE TABLE public.todo_remind_logs (
  id TEXT PRIMARY KEY,
  remind_date TEXT,
  todo_id TEXT,
  reminded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 22. product_images 机型图片
-- 字段映射：modelId→model_id, picUrl→pic_url, picSize→pic_size,
--   picType→pic_type, uploadTime→upload_time
-- =====================================================
CREATE TABLE public.product_images (
  id TEXT PRIMARY KEY,
  model_id TEXT,
  pic_url TEXT,
  pic_size TEXT,
  pic_type TEXT,
  upload_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMIT;

-- =====================================================
-- 授权与 RLS 策略（对所有业务表统一配置）
-- =====================================================

-- 1. Schema 级权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. 逐表授权 + 启用 RLS + 全访问策略
DO $$
DECLARE
  tbl RECORD;
  policy_all TEXT;
  policy_read TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.tablename);
      EXECUTE format('GRANT SELECT ON public.%I TO anon', tbl.tablename);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);

      policy_all  := tbl.tablename || '_all_access';
      policy_read := tbl.tablename || '_public_read';
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_all, tbl.tablename);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', policy_all, tbl.tablename);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_read, tbl.tablename);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)', policy_read, tbl.tablename);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '配置表 % 出错: %', tbl.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

-- 3. 序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- 4. 存储桶权限修复（customer_light_files）
-- =====================================================
DO $$
BEGIN
  -- 确保 storage 表权限
  GRANT ALL ON storage.buckets TO authenticated;
  GRANT ALL ON storage.objects TO authenticated;

  -- 若桶不存在则创建
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'customer_light_files') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'customer_light_files',
      'customer_light_files',
      true,
      52428800,
      ARRAY[
        'image/jpeg','image/png','image/gif','image/bmp','image/tiff',
        'application/pdf','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain','text/csv','application/zip','application/x-zip-compressed',
        'application/vnd.oasis.opendocument.spreadsheet'
      ]
    );
  ELSE
    UPDATE storage.buckets
    SET public = true,
        file_size_limit = 52428800,
        allowed_mime_types = ARRAY[
          'image/jpeg','image/png','image/gif','image/bmp','image/tiff',
          'application/pdf','application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain','text/csv','application/zip','application/x-zip-compressed',
          'application/vnd.oasis.opendocument.spreadsheet'
        ]
    WHERE id = 'customer_light_files';
  END IF;

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

-- =====================================================
-- 完成
-- =====================================================
SELECT '✅ 数据库重建完成！已清空旧数据并按面板功能重建所有业务表，RLS 与存储桶权限已配置。' as result;
