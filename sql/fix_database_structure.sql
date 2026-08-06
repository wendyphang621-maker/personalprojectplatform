-- =====================================================
-- 数据库结构修复脚本
-- 修复代码与数据库表结构不匹配的问题
-- =====================================================

-- 1. 修复 customers 表：添加 group 列（代码使用 group，但SQL用 group_name）
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS "group" TEXT;
-- 将 group_name 数据迁移到 group（如果存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'group_name') THEN
    UPDATE public.customers SET "group" = group_name WHERE "group" IS NULL AND group_name IS NOT NULL;
  END IF;
END $$;

-- 2. 修复 customers 表：添加 address 列
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. 修复 activate_export_configs 表：将 id 改为 TEXT 类型（代码期望字符串ID）
ALTER TABLE IF EXISTS public.activate_export_configs ALTER COLUMN id TYPE TEXT;

-- 4. 修复 activate_export_configs 表：添加缺失的列
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS software_version TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS need_imei BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS need_filter BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS export_table_name TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS fota_source TEXT;
ALTER TABLE IF EXISTS public.activate_export_configs ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- 5. 修复 product_models 表：添加缺失的列
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS chip TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS screen TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS certifications TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE IF EXISTS public.product_models ADD COLUMN IF NOT EXISTS render_image_path TEXT;

-- 将旧列数据迁移到新列
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'model_name') THEN
    UPDATE public.product_models SET name = model_name WHERE name IS NULL AND model_name IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'chip_scheme') THEN
    UPDATE public.product_models SET chip = chip_scheme WHERE chip IS NULL AND chip_scheme IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'screen_param') THEN
    UPDATE public.product_models SET screen = screen_param WHERE screen IS NULL AND screen_param IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'cert_list') THEN
    UPDATE public.product_models SET certifications = cert_list WHERE certifications IS NULL AND cert_list IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'supplier_name') THEN
    UPDATE public.product_models SET supplier_id = supplier_name WHERE supplier_id IS NULL AND supplier_name IS NOT NULL;
  END IF;
END $$;

-- 6. 修复 sales_orders 表：添加缺失的列
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS order_no TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 0;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS order_date DATE;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS logistics_no TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS order_type TEXT;
ALTER TABLE IF EXISTS public.sales_orders ADD COLUMN IF NOT EXISTS currency TEXT;

-- 7. 修复 daily_todos 表：添加缺失的列
ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS todo_date DATE;
ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.daily_todos ADD COLUMN IF NOT EXISTS priority TEXT;

-- 8. 修复 suppliers 表：添加缺失的列
ALTER TABLE IF NOT EXISTS public.suppliers ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS remark TEXT;

-- 9. 修复 customer_follow_ups 表：添加缺失的列
ALTER TABLE IF NOT EXISTS public.customer_follow_ups ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE IF EXISTS public.customer_follow_ups ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE IF EXISTS public.customer_follow_ups ADD COLUMN IF NOT EXISTS followup_date DATE;
ALTER TABLE IF EXISTS public.customer_follow_ups ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE IF EXISTS public.customer_follow_ups ADD COLUMN IF NOT EXISTS contact_method TEXT;
ALTER TABLE IF EXISTS public.customer_follow_ups ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE IF EXISTS public.customer_follow_ups ADD COLUMN IF NOT EXISTS next_followup DATE;
ALTER TABLE IF EXISTS public.customer_follow_ups ADD COLUMN IF NOT EXISTS operator TEXT;
ALTER TABLE IF NOT EXISTS public.customer_follow_ups ADD COLUMN IF NOT EXISTS remark TEXT;

-- 10. 修复 customer_payments 表：添加缺失的列
ALTER TABLE IF EXISTS public.customer_payments ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE IF EXISTS public.customer_payments ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.customer_payments ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE IF EXISTS public.customer_payments ADD COLUMN IF NOT EXISTS method TEXT;
ALTER TABLE IF EXISTS public.customer_payments ADD COLUMN IF NOT EXISTS remark TEXT;

-- 11. 修复 sample_deliveries 表：添加缺失的列
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 0;
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS order_date DATE;
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS logistics_no TEXT;
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS tracking_no TEXT;
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS logistics_company TEXT;
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS actual_delivery DATE;
ALTER TABLE IF EXISTS public.sample_deliveries ADD COLUMN IF NOT EXISTS remark TEXT;

-- 12. 修复 logistics_bills 表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS public.logistics_bills (
  id TEXT PRIMARY KEY,
  tracking_no TEXT,
  customer_id TEXT,
  country TEXT,
  freight_forwarder TEXT,
  freight_amount NUMERIC DEFAULT 0,
  payment_status TEXT,
  write_off_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. 修复 package_sample_follows 表：添加缺失的列
ALTER TABLE IF EXISTS public.package_sample_follows ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE IF EXISTS public.package_sample_follows ADD COLUMN IF NOT EXISTS follow_content TEXT;
ALTER TABLE IF EXISTS public.package_sample_follows ADD COLUMN IF NOT EXISTS follow_type TEXT;

-- 14. 修复 todo_remind_logs 表：添加缺失的列
ALTER TABLE IF EXISTS public.todo_remind_logs ADD COLUMN IF NOT EXISTS remind_date DATE;
ALTER TABLE IF EXISTS public.todo_remind_logs ADD COLUMN IF NOT EXISTS todo_id TEXT;
ALTER TABLE IF EXISTS public.todo_remind_logs ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ DEFAULT now();

-- 15. 确保所有表都有 RLS 策略
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

-- 16. 确保 authenticated 角色有足够权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT '数据库结构修复完成！' as result;
