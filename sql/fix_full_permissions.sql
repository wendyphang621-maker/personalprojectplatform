-- =====================================================
-- Trae 项目：Supabase 全表权限修复脚本
-- 功能：建表 + 补字段 + RLS 策略 + GRANT 权限 + 索引
-- 可重复执行，无报错
-- =====================================================

-- ============ Part 0: 补全缺失字段（针对已存在的表） ============

-- customers 表可能缺少的字段
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- product_models 表
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS chip_scheme TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS screen_param TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS cert_list TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- sales_orders 表
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS order_no TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 0;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS order_date DATE;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS logistics_no TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS bulk_freight NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS freight_currency TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS order_type TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 其他业务表的关键字段（按需补充）
ALTER TABLE IF EXISTS public.logistics_orders ADD COLUMN IF NOT EXISTS order_no TEXT;
ALTER TABLE IF EXISTS public.logistics_orders ADD COLUMN IF NOT EXISTS tracking_no TEXT;
ALTER TABLE IF EXISTS public.logistics_orders ADD COLUMN IF NOT EXISTS logistics_company TEXT;
ALTER TABLE IF EXISTS public.logistics_orders ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE IF EXISTS public.logistics_orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;
ALTER TABLE IF EXISTS public.logistics_orders ADD COLUMN IF NOT EXISTS actual_delivery DATE;

ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS remark TEXT;

ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS priority TEXT;

ALTER TABLE IF EXISTS public.package_sample_follows ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE IF EXISTS public.package_sample_follows ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE IF EXISTS public.package_sample_follows ADD COLUMN IF NOT EXISTS follow_content TEXT;
ALTER TABLE IF EXISTS public.package_sample_follows ADD COLUMN IF NOT EXISTS next_follow_date DATE;
ALTER TABLE IF EXISTS public.package_sample_follows ADD COLUMN IF NOT EXISTS last_follow_date DATE;
ALTER TABLE IF EXISTS public.package_sample_follows ADD COLUMN IF NOT EXISTS follow_type TEXT;

ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS customer TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS update_frequency TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS receive_email TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS software_version TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS need_imei BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS need_filter BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS export_table_name TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS fota_source TEXT;

ALTER TABLE IF EXISTS public.cert_matrix_files ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_files ADD COLUMN IF NOT EXISTS template TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_files ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_files ADD COLUMN IF NOT EXISTS "order" INT DEFAULT 0;
ALTER TABLE IF EXISTS public.cert_matrix_files ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_files ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS public.cert_matrix_cells ADD COLUMN IF NOT EXISTS file_id TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_cells ADD COLUMN IF NOT EXISTS model_id TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_cells ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_cells ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_cells ADD COLUMN IF NOT EXISTS cert_id TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_cells ADD COLUMN IF NOT EXISTS cert_type TEXT;
ALTER TABLE IF EXISTS public.cert_matrix_cells ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- ============ Part 1: Schema 级权限 ============
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============ Part 2: 建表语句（带触发器） ============

-- 2.1 客户表
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

-- 2.2 机型参数库
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

-- 2.3 认证档案
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

-- 2.4 物流单据
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

-- 2.5 销售订单
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

-- 2.6 客户分组
CREATE TABLE IF NOT EXISTS public.customer_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 激活数据导出配置
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

-- 2.8 认证矩阵文件
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

-- 2.9 认证矩阵单元格
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

-- 2.10 认证矩阵模板
CREATE TABLE IF NOT EXISTS public.cert_matrix_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  files JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.11 认证矩阵状态
CREATE TABLE IF NOT EXISTS public.cert_matrix_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT,
  name TEXT,
  color TEXT,
  bg TEXT
);

-- 2.12 样单交付
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

-- 2.13 供应商
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

-- 2.14 样单跟进
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

-- 2.15 每日待办
CREATE TABLE IF NOT EXISTS public.daily_todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE,
  title TEXT,
  content TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.16 每日提醒
CREATE TABLE IF NOT EXISTS public.daily_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time TIME,
  content TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.17 提醒日志
CREATE TABLE IF NOT EXISTS public.todo_remind_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  remind_date DATE,
  todo_id TEXT,
  reminded_at TIMESTAMPTZ DEFAULT now()
);

-- 2.18 客户跟进
CREATE TABLE IF NOT EXISTS public.customer_follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT,
  content TEXT,
  date DATE,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.19 客户付款
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT,
  amount NUMERIC DEFAULT 0,
  date DATE,
  method TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.20 项目
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  description TEXT,
  color TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.21 阶段
CREATE TABLE IF NOT EXISTS public.stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  name TEXT,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.22 任务
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

-- 2.23 样单运费
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

-- 2.24 库存
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT,
  quantity INT DEFAULT 0,
  warehouse TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.25 库存日志
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id TEXT,
  change_type TEXT,
  quantity_change INT DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.26 价格历史
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT,
  price NUMERIC DEFAULT 0,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ Part 3: updated_at 自动更新触发器 ============

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为有 updated_at 字段的表添加触发器
DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_product_models_updated_at ON public.product_models;
CREATE TRIGGER trg_product_models_updated_at BEFORE UPDATE ON public.product_models
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_product_certs_updated_at ON public.product_certs;
CREATE TRIGGER trg_product_certs_updated_at BEFORE UPDATE ON public.product_certs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_logistics_orders_updated_at ON public.logistics_orders;
CREATE TRIGGER trg_logistics_orders_updated_at BEFORE UPDATE ON public.logistics_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_sales_orders_updated_at ON public.sales_orders;
CREATE TRIGGER trg_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_activate_export_configs_updated_at ON public.activate_export_configs;
CREATE TRIGGER trg_activate_export_configs_updated_at BEFORE UPDATE ON public.activate_export_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_package_sample_follows_updated_at ON public.package_sample_follows;
CREATE TRIGGER trg_package_sample_follows_updated_at BEFORE UPDATE ON public.package_sample_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_package_freight_records_updated_at ON public.package_freight_records;
CREATE TRIGGER trg_package_freight_records_updated_at BEFORE UPDATE ON public.package_freight_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ Part 4: 常用查询字段索引（安全检查版） ============

DO $$
BEGIN
    -- 安全地创建索引，跳过可能不存在的字段
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
    EXCEPTION WHEN others THEN RAISE NOTICE 'Skip index on customers.name: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_customers_group ON public.customers(group_name);
    EXCEPTION WHEN others THEN RAISE NOTICE 'Skip index on customers.group_name: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_product_models_name ON public.product_models(model_name);
    EXCEPTION WHEN others THEN RAISE NOTICE 'Skip index on product_models.model_name: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_sales_orders_order_no ON public.sales_orders(order_no);
    EXCEPTION WHEN others THEN RAISE NOTICE 'Skip index on sales_orders.order_no: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders(customer_name);
    EXCEPTION WHEN others THEN RAISE NOTICE 'Skip index on sales_orders.customer_name: %', SQLERRM;
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_daily_todos_date ON public.daily_todos(date);
    EXCEPTION WHEN others THEN RAISE NOTICE 'Skip index on daily_todos.date: %', SQLERRM;
    END;
END $$;

-- ============ Part 5: RLS 策略（核心） ============
-- 为每张表启用 RLS 并添加 authenticated 用户通行策略
-- 使用 DROP POLICY IF EXISTS + CREATE POLICY（兼容性更好）

-- customers
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customers_all_auth ON public.customers;
CREATE POLICY customers_all_auth ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_models
ALTER TABLE IF EXISTS public.product_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_models_all_auth ON public.product_models;
CREATE POLICY product_models_all_auth ON public.product_models FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- sales_orders
ALTER TABLE IF EXISTS public.sales_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sales_orders_all_auth ON public.sales_orders;
CREATE POLICY sales_orders_all_auth ON public.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- logistics_orders
ALTER TABLE IF EXISTS public.logistics_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS logistics_orders_all_auth ON public.logistics_orders;
CREATE POLICY logistics_orders_all_auth ON public.logistics_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- sample_deliveries
ALTER TABLE IF EXISTS public.sample_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sample_deliveries_all_auth ON public.sample_deliveries;
CREATE POLICY sample_deliveries_all_auth ON public.sample_deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- suppliers
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS suppliers_all_auth ON public.suppliers;
CREATE POLICY suppliers_all_auth ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- package_sample_follows
ALTER TABLE IF EXISTS public.package_sample_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS package_sample_follows_all_auth ON public.package_sample_follows;
CREATE POLICY package_sample_follows_all_auth ON public.package_sample_follows FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- daily_todos
ALTER TABLE IF EXISTS public.daily_todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_todos_all_auth ON public.daily_todos;
CREATE POLICY daily_todos_all_auth ON public.daily_todos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- daily_reminders
ALTER TABLE IF EXISTS public.daily_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_reminders_all_auth ON public.daily_reminders;
CREATE POLICY daily_reminders_all_auth ON public.daily_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- todo_remind_logs
ALTER TABLE IF EXISTS public.todo_remind_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS todo_remind_logs_all_auth ON public.todo_remind_logs;
CREATE POLICY todo_remind_logs_all_auth ON public.todo_remind_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- projects
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS projects_all_auth ON public.projects;
CREATE POLICY projects_all_auth ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- stages
ALTER TABLE IF EXISTS public.stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stages_all_auth ON public.stages;
CREATE POLICY stages_all_auth ON public.stages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- tasks
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tasks_all_auth ON public.tasks;
CREATE POLICY tasks_all_auth ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- customer_groups
ALTER TABLE IF EXISTS public.customer_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_groups_all_auth ON public.customer_groups;
CREATE POLICY customer_groups_all_auth ON public.customer_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- customer_follow_ups
ALTER TABLE IF EXISTS public.customer_follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_follow_ups_all_auth ON public.customer_follow_ups;
CREATE POLICY customer_follow_ups_all_auth ON public.customer_follow_ups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- customer_payments
ALTER TABLE IF EXISTS public.customer_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_payments_all_auth ON public.customer_payments;
CREATE POLICY customer_payments_all_auth ON public.customer_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- activate_export_configs
ALTER TABLE IF EXISTS public.activate_export_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activate_export_configs_all_auth ON public.activate_export_configs;
CREATE POLICY activate_export_configs_all_auth ON public.activate_export_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cert_matrix_files
ALTER TABLE IF EXISTS public.cert_matrix_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cert_matrix_files_all_auth ON public.cert_matrix_files;
CREATE POLICY cert_matrix_files_all_auth ON public.cert_matrix_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cert_matrix_cells
ALTER TABLE IF EXISTS public.cert_matrix_cells ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cert_matrix_cells_all_auth ON public.cert_matrix_cells;
CREATE POLICY cert_matrix_cells_all_auth ON public.cert_matrix_cells FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cert_matrix_templates
ALTER TABLE IF EXISTS public.cert_matrix_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cert_matrix_templates_all_auth ON public.cert_matrix_templates;
CREATE POLICY cert_matrix_templates_all_auth ON public.cert_matrix_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cert_matrix_statuses
ALTER TABLE IF EXISTS public.cert_matrix_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cert_matrix_statuses_all_auth ON public.cert_matrix_statuses;
CREATE POLICY cert_matrix_statuses_all_auth ON public.cert_matrix_statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_certs
ALTER TABLE IF EXISTS public.product_certs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_certs_all_auth ON public.product_certs;
CREATE POLICY product_certs_all_auth ON public.product_certs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- package_freight_records
ALTER TABLE IF EXISTS public.package_freight_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS package_freight_records_all_auth ON public.package_freight_records;
CREATE POLICY package_freight_records_all_auth ON public.package_freight_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- inventory
ALTER TABLE IF EXISTS public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventory_all_auth ON public.inventory;
CREATE POLICY inventory_all_auth ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- inventory_logs
ALTER TABLE IF EXISTS public.inventory_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventory_logs_all_auth ON public.inventory_logs;
CREATE POLICY inventory_logs_all_auth ON public.inventory_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- price_history
ALTER TABLE IF EXISTS public.price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS price_history_all_auth ON public.price_history;
CREATE POLICY price_history_all_auth ON public.price_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ Part 6: 直接 GRANT 权限（双保险） ============

-- Schema 级
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 所有现有表的完整权限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- 序列权限（自增 ID 需要）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 未来新表的默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- ============ 完成 ============
SELECT '✅ 全部完成：建表 + RLS + GRANT + 索引' as result;
