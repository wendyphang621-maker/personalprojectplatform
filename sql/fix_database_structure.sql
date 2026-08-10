-- =====================================================
-- 数据库结构修复脚本
-- 修复代码与数据库表结构不匹配的问题
-- =====================================================

-- 1. 修复 customers 表：添加 group 列
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'group') THEN
      ALTER TABLE public.customers ADD COLUMN "group" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'address') THEN
      ALTER TABLE public.customers ADD COLUMN address TEXT;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'group_name') THEN
      UPDATE public.customers SET "group" = group_name WHERE "group" IS NULL AND group_name IS NOT NULL;
    END IF;
  END IF;
END $$;

-- 2. 修复 activate_export_configs 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activate_export_configs') THEN
    ALTER TABLE public.activate_export_configs ALTER COLUMN id TYPE TEXT;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activate_export_configs' AND column_name = 'model_name') THEN
      ALTER TABLE public.activate_export_configs ADD COLUMN model_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activate_export_configs' AND column_name = 'software_version') THEN
      ALTER TABLE public.activate_export_configs ADD COLUMN software_version TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activate_export_configs' AND column_name = 'need_imei') THEN
      ALTER TABLE public.activate_export_configs ADD COLUMN need_imei BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activate_export_configs' AND column_name = 'need_filter') THEN
      ALTER TABLE public.activate_export_configs ADD COLUMN need_filter BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activate_export_configs' AND column_name = 'export_table_name') THEN
      ALTER TABLE public.activate_export_configs ADD COLUMN export_table_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activate_export_configs' AND column_name = 'fota_source') THEN
      ALTER TABLE public.activate_export_configs ADD COLUMN fota_source TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activate_export_configs' AND column_name = 'enabled') THEN
      ALTER TABLE public.activate_export_configs ADD COLUMN enabled BOOLEAN DEFAULT true;
    END IF;
  END IF;
END $$;

-- 3. 修复 product_models 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_models') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'name') THEN
      ALTER TABLE public.product_models ADD COLUMN name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'chip') THEN
      ALTER TABLE public.product_models ADD COLUMN chip TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'screen') THEN
      ALTER TABLE public.product_models ADD COLUMN screen TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'certifications') THEN
      ALTER TABLE public.product_models ADD COLUMN certifications TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'supplier_id') THEN
      ALTER TABLE public.product_models ADD COLUMN supplier_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_models' AND column_name = 'render_image_path') THEN
      ALTER TABLE public.product_models ADD COLUMN render_image_path TEXT;
    END IF;
    
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
  END IF;
END $$;

-- 4. 修复 sales_orders 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'order_no') THEN
      ALTER TABLE public.sales_orders ADD COLUMN order_no TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'customer_name') THEN
      ALTER TABLE public.sales_orders ADD COLUMN customer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'model') THEN
      ALTER TABLE public.sales_orders ADD COLUMN model TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'quantity') THEN
      ALTER TABLE public.sales_orders ADD COLUMN quantity INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'order_date') THEN
      ALTER TABLE public.sales_orders ADD COLUMN order_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'logistics_no') THEN
      ALTER TABLE public.sales_orders ADD COLUMN logistics_no TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'status') THEN
      ALTER TABLE public.sales_orders ADD COLUMN status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'amount') THEN
      ALTER TABLE public.sales_orders ADD COLUMN amount NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'order_type') THEN
      ALTER TABLE public.sales_orders ADD COLUMN order_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'currency') THEN
      ALTER TABLE public.sales_orders ADD COLUMN currency TEXT;
    END IF;
  END IF;
END $$;

-- 5. 修复 daily_todos 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_todos') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_todos' AND column_name = 'todo_date') THEN
      ALTER TABLE public.daily_todos ADD COLUMN todo_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_todos' AND column_name = 'title') THEN
      ALTER TABLE public.daily_todos ADD COLUMN title TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_todos' AND column_name = 'content') THEN
      ALTER TABLE public.daily_todos ADD COLUMN content TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_todos' AND column_name = 'completed') THEN
      ALTER TABLE public.daily_todos ADD COLUMN completed BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_todos' AND column_name = 'priority') THEN
      ALTER TABLE public.daily_todos ADD COLUMN priority TEXT;
    END IF;
  END IF;
END $$;

-- 6. 修复 suppliers 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'contact') THEN
      ALTER TABLE public.suppliers ADD COLUMN contact TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'phone') THEN
      ALTER TABLE public.suppliers ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'email') THEN
      ALTER TABLE public.suppliers ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'address') THEN
      ALTER TABLE public.suppliers ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'remark') THEN
      ALTER TABLE public.suppliers ADD COLUMN remark TEXT;
    END IF;
  END IF;
END $$;

-- 7. 修复 customer_follow_ups 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_follow_ups') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_follow_ups' AND column_name = 'customer_id') THEN
      ALTER TABLE public.customer_follow_ups ADD COLUMN customer_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_follow_ups' AND column_name = 'content') THEN
      ALTER TABLE public.customer_follow_ups ADD COLUMN content TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_follow_ups' AND column_name = 'followup_date') THEN
      ALTER TABLE public.customer_follow_ups ADD COLUMN followup_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_follow_ups' AND column_name = 'result') THEN
      ALTER TABLE public.customer_follow_ups ADD COLUMN result TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_follow_ups' AND column_name = 'contact_method') THEN
      ALTER TABLE public.customer_follow_ups ADD COLUMN contact_method TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_follow_ups' AND column_name = 'po_number') THEN
      ALTER TABLE public.customer_follow_ups ADD COLUMN po_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_follow_ups' AND column_name = 'next_followup') THEN
      ALTER TABLE public.customer_follow_ups ADD COLUMN next_followup DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_follow_ups' AND column_name = 'operator') THEN
      ALTER TABLE public.customer_follow_ups ADD COLUMN operator TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_follow_ups' AND column_name = 'remark') THEN
      ALTER TABLE public.customer_follow_ups ADD COLUMN remark TEXT;
    END IF;
  END IF;
END $$;

-- 8. 修复 customer_payments 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_payments') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_payments' AND column_name = 'customer_id') THEN
      ALTER TABLE public.customer_payments ADD COLUMN customer_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_payments' AND column_name = 'amount') THEN
      ALTER TABLE public.customer_payments ADD COLUMN amount NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_payments' AND column_name = 'payment_date') THEN
      ALTER TABLE public.customer_payments ADD COLUMN payment_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_payments' AND column_name = 'method') THEN
      ALTER TABLE public.customer_payments ADD COLUMN method TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_payments' AND column_name = 'remark') THEN
      ALTER TABLE public.customer_payments ADD COLUMN remark TEXT;
    END IF;
  END IF;
END $$;

-- 9. 修复 sample_deliveries 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sample_deliveries') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'customer_name') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN customer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'model') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN model TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'quantity') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN quantity INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'order_date') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN order_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'logistics_no') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN logistics_no TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'status') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'tracking_no') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN tracking_no TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'logistics_company') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN logistics_company TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'actual_delivery') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN actual_delivery DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sample_deliveries' AND column_name = 'remark') THEN
      ALTER TABLE public.sample_deliveries ADD COLUMN remark TEXT;
    END IF;
  END IF;
END $$;

-- 10. 创建 logistics_bills 表（如果不存在）
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

-- 11. 修复 package_sample_follows 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_sample_follows') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'package_sample_follows' AND column_name = 'customer_id') THEN
      ALTER TABLE public.package_sample_follows ADD COLUMN customer_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'package_sample_follows' AND column_name = 'follow_content') THEN
      ALTER TABLE public.package_sample_follows ADD COLUMN follow_content TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'package_sample_follows' AND column_name = 'follow_type') THEN
      ALTER TABLE public.package_sample_follows ADD COLUMN follow_type TEXT;
    END IF;
  END IF;
END $$;

-- 12. 修复 todo_remind_logs 表
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'todo_remind_logs') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todo_remind_logs' AND column_name = 'remind_date') THEN
      ALTER TABLE public.todo_remind_logs ADD COLUMN remind_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todo_remind_logs' AND column_name = 'todo_id') THEN
      ALTER TABLE public.todo_remind_logs ADD COLUMN todo_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todo_remind_logs' AND column_name = 'reminded_at') THEN
      ALTER TABLE public.todo_remind_logs ADD COLUMN reminded_at TIMESTAMPTZ DEFAULT now();
    END IF;
  END IF;
END $$;

-- 13. 确保所有表都有 RLS 策略
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

-- 14. 确保 authenticated 角色有足够权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT '数据库结构修复完成！' as result;
