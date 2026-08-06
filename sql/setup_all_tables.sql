-- =====================================================
-- Supabase RLS 修复 + 建表脚本
-- 自动检查表是否存在，不存在则创建，存在则添加 RLS 权限
-- =====================================================

-- ============ 第一步：创建缺失的表 ============

-- 客户表
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  group_name TEXT,
  country TEXT,
  region TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 客户跟进记录
CREATE TABLE IF NOT EXISTS public.package_sample_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  model TEXT,
  follow_content TEXT,
  next_follow_date DATE,
  last_follow_date DATE,
  follow_type TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 机型参数库
CREATE TABLE IF NOT EXISTS public.product_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT,
  chip_scheme TEXT,
  screen_param TEXT,
  cert_list TEXT,
  supplier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 认证档案
CREATE TABLE IF NOT EXISTS public.product_certs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id TEXT,
  model_name TEXT,
  cert_type TEXT,
  cert_no TEXT,
  issue_date DATE,
  expire_date DATE,
  attachments TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 机型图片
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id TEXT,
  pic_url TEXT,
  pic_size TEXT,
  pic_type TEXT,
  upload_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 物流单据
CREATE TABLE IF NOT EXISTS public.logistics_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_no TEXT,
  tracking_no TEXT,
  logistics_company TEXT,
  status TEXT,
  estimated_delivery DATE,
  actual_delivery DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 样单运费
CREATE TABLE IF NOT EXISTS public.package_freight_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 销售订单
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_no TEXT,
  customer_name TEXT,
  model TEXT,
  quantity INT DEFAULT 0,
  order_date DATE,
  logistics_no TEXT,
  status TEXT,
  amount NUMERIC DEFAULT 0,
  bulk_freight NUMERIC DEFAULT 0,
  freight_currency TEXT,
  order_type TEXT,
  payment_status TEXT,
  currency TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 客户分组
CREATE TABLE IF NOT EXISTS public.customer_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 激活数据导出配置
CREATE TABLE IF NOT EXISTS public.activate_export_configs (
  id BIGSERIAL PRIMARY KEY,
  customer TEXT,
  update_frequency TEXT,
  receive_email TEXT,
  model TEXT,
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

-- 认证矩阵文件
CREATE TABLE IF NOT EXISTS public.cert_matrix_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  template TEXT,
  category TEXT,
  "order" INT DEFAULT 0,
  remark TEXT,
  is_deleted BOOLEAN DEFAULT false,
  update_time TIMESTAMPTZ DEFAULT now()
);

-- 认证矩阵单元格
CREATE TABLE IF NOT EXISTS public.cert_matrix_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id TEXT,
  model_id TEXT,
  status TEXT,
  remark TEXT,
  cert_id TEXT,
  cert_type TEXT,
  is_deleted BOOLEAN DEFAULT false,
  update_time TIMESTAMPTZ DEFAULT now()
);

-- 认证矩阵模板
CREATE TABLE IF NOT EXISTS public.cert_matrix_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  files JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 认证矩阵状态
CREATE TABLE IF NOT EXISTS public.cert_matrix_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT,
  name TEXT,
  color TEXT,
  bg TEXT
);

-- 样单交付
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 供应商
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 样单跟进
CREATE TABLE IF NOT EXISTS public.customer_follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT,
  content TEXT,
  date DATE,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 客户付款
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT,
  amount NUMERIC DEFAULT 0,
  date DATE,
  method TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 项目
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  description TEXT,
  color TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 阶段
CREATE TABLE IF NOT EXISTS public.stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  name TEXT,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 任务
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  stage_id TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  assignee TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 每日待办
CREATE TABLE IF NOT EXISTS public.daily_todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE,
  title TEXT,
  content TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 每日提醒
CREATE TABLE IF NOT EXISTS public.daily_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time TIME,
  content TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 提醒日志
CREATE TABLE IF NOT EXISTS public.todo_remind_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  remind_date DATE,
  todo_id TEXT,
  reminded_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 第二步：开启 RLS 并添加权限策略 ============

ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_all_access" ON public.customers;
CREATE POLICY "customers_all_access" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.package_sample_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "package_sample_follows_all_access" ON public.package_sample_follows;
CREATE POLICY "package_sample_follows_all_access" ON public.package_sample_follows FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.product_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_models_all_access" ON public.product_models;
CREATE POLICY "product_models_all_access" ON public.product_models FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.product_certs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_certs_all_access" ON public.product_certs;
CREATE POLICY "product_certs_all_access" ON public.product_certs FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_images_all_access" ON public.product_images;
CREATE POLICY "product_images_all_access" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.logistics_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logistics_orders_all_access" ON public.logistics_orders;
CREATE POLICY "logistics_orders_all_access" ON public.logistics_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.package_freight_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "package_freight_records_all_access" ON public.package_freight_records;
CREATE POLICY "package_freight_records_all_access" ON public.package_freight_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.sales_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_orders_all_access" ON public.sales_orders;
CREATE POLICY "sales_orders_all_access" ON public.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.customer_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_groups_all_access" ON public.customer_groups;
CREATE POLICY "customer_groups_all_access" ON public.customer_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.activate_export_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activate_export_configs_all_access" ON public.activate_export_configs;
CREATE POLICY "activate_export_configs_all_access" ON public.activate_export_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.cert_matrix_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_matrix_files_all_access" ON public.cert_matrix_files;
CREATE POLICY "cert_matrix_files_all_access" ON public.cert_matrix_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.cert_matrix_cells ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_matrix_cells_all_access" ON public.cert_matrix_cells;
CREATE POLICY "cert_matrix_cells_all_access" ON public.cert_matrix_cells FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.cert_matrix_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_matrix_templates_all_access" ON public.cert_matrix_templates;
CREATE POLICY "cert_matrix_templates_all_access" ON public.cert_matrix_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.cert_matrix_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_matrix_statuses_all_access" ON public.cert_matrix_statuses;
CREATE POLICY "cert_matrix_statuses_all_access" ON public.cert_matrix_statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.sample_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sample_deliveries_all_access" ON public.sample_deliveries;
CREATE POLICY "sample_deliveries_all_access" ON public.sample_deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_all_access" ON public.suppliers;
CREATE POLICY "suppliers_all_access" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.customer_follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_follow_ups_all_access" ON public.customer_follow_ups;
CREATE POLICY "customer_follow_ups_all_access" ON public.customer_follow_ups FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.customer_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_payments_all_access" ON public.customer_payments;
CREATE POLICY "customer_payments_all_access" ON public.customer_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_all_access" ON public.projects;
CREATE POLICY "projects_all_access" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stages_all_access" ON public.stages;
CREATE POLICY "stages_all_access" ON public.stages FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_all_access" ON public.tasks;
CREATE POLICY "tasks_all_access" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.daily_todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_todos_all_access" ON public.daily_todos;
CREATE POLICY "daily_todos_all_access" ON public.daily_todos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.daily_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_reminders_all_access" ON public.daily_reminders;
CREATE POLICY "daily_reminders_all_access" ON public.daily_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.todo_remind_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "todo_remind_logs_all_access" ON public.todo_remind_logs;
CREATE POLICY "todo_remind_logs_all_access" ON public.todo_remind_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ 完成提示 ============
SELECT '✅ 全部表已创建并配置 RLS 权限，请刷新页面重新登录' as result;
