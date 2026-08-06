-- =====================================================
-- Supabase RLS 快速修复脚本（仅添加权限，不创建表）
-- 针对数据库中已存在的所有业务表
-- =====================================================

-- ===== 针对数据库中已存在的表添加 RLS =====

-- 1. activate_export_configs (存在)
ALTER TABLE IF EXISTS public.activate_export_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activate_export_configs_all_access" ON public.activate_export_configs;
CREATE POLICY "activate_export_configs_all_access" ON public.activate_export_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. cert_matrix_cells (存在)
ALTER TABLE IF EXISTS public.cert_matrix_cells ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_matrix_cells_all_access" ON public.cert_matrix_cells;
CREATE POLICY "cert_matrix_cells_all_access" ON public.cert_matrix_cells FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. cert_matrix_files (存在)
ALTER TABLE IF EXISTS public.cert_matrix_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_matrix_files_all_access" ON public.cert_matrix_files;
CREATE POLICY "cert_matrix_files_all_access" ON public.cert_matrix_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. cert_matrix_statuses (存在)
ALTER TABLE IF EXISTS public.cert_matrix_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_matrix_statuses_all_access" ON public.cert_matrix_statuses;
CREATE POLICY "cert_matrix_statuses_all_access" ON public.cert_matrix_statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. cert_matrix_templates (存在)
ALTER TABLE IF EXISTS public.cert_matrix_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_matrix_templates_all_access" ON public.cert_matrix_templates;
CREATE POLICY "cert_matrix_templates_all_access" ON public.cert_matrix_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. certification_file (用户已有，代码可能引用)
ALTER TABLE IF EXISTS public.certification_file ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certification_file_all_access" ON public.certification_file;
CREATE POLICY "certification_file_all_access" ON public.certification_file FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. customer_follow (用户已有)
ALTER TABLE IF EXISTS public.customer_follow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_follow_all_access" ON public.customer_follow;
CREATE POLICY "customer_follow_all_access" ON public.customer_follow FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. customer_follow_ups (存在)
ALTER TABLE IF EXISTS public.customer_follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_follow_ups_all_access" ON public.customer_follow_ups;
CREATE POLICY "customer_follow_ups_all_access" ON public.customer_follow_ups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. customer_groups (存在)
ALTER TABLE IF EXISTS public.customer_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_groups_all_access" ON public.customer_groups;
CREATE POLICY "customer_groups_all_access" ON public.customer_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. customer_payments (存在)
ALTER TABLE IF EXISTS public.customer_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_payments_all_access" ON public.customer_payments;
CREATE POLICY "customer_payments_all_access" ON public.customer_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. customers (存在)
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_all_access" ON public.customers;
CREATE POLICY "customers_all_access" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 12. daily_reminders (存在)
ALTER TABLE IF EXISTS public.daily_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_reminders_all_access" ON public.daily_reminders;
CREATE POLICY "daily_reminders_all_access" ON public.daily_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13. daily_todos (存在)
ALTER TABLE IF EXISTS public.daily_todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_todos_all_access" ON public.daily_todos;
CREATE POLICY "daily_todos_all_access" ON public.daily_todos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 14. inventory (存在)
ALTER TABLE IF EXISTS public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_all_access" ON public.inventory;
CREATE POLICY "inventory_all_access" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 15. inventory_logs (存在)
ALTER TABLE IF EXISTS public.inventory_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_logs_all_access" ON public.inventory_logs;
CREATE POLICY "inventory_logs_all_access" ON public.inventory_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 16. logistics_bill (用户已有)
ALTER TABLE IF EXISTS public.logistics_bill ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logistics_bill_all_access" ON public.logistics_bill;
CREATE POLICY "logistics_bill_all_access" ON public.logistics_bill FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 17. logistics_orders (存在)
ALTER TABLE IF EXISTS public.logistics_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logistics_orders_all_access" ON public.logistics_orders;
CREATE POLICY "logistics_orders_all_access" ON public.logistics_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 18. package_freight_records (存在)
ALTER TABLE IF EXISTS public.package_freight_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "package_freight_records_all_access" ON public.package_freight_records;
CREATE POLICY "package_freight_records_all_access" ON public.package_freight_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 19. package_sample_follows (存在)
ALTER TABLE IF EXISTS public.package_sample_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "package_sample_follows_all_access" ON public.package_sample_follows;
CREATE POLICY "package_sample_follows_all_access" ON public.package_sample_follows FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 20. price_history (存在)
ALTER TABLE IF EXISTS public.price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "price_history_all_access" ON public.price_history;
CREATE POLICY "price_history_all_access" ON public.price_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 21. product_models (存在)
ALTER TABLE IF EXISTS public.product_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_models_all_access" ON public.product_models;
CREATE POLICY "product_models_all_access" ON public.product_models FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 22. projects (存在)
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_all_access" ON public.projects;
CREATE POLICY "projects_all_access" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 23. sales_orders (存在)
ALTER TABLE IF EXISTS public.sales_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_orders_all_access" ON public.sales_orders;
CREATE POLICY "sales_orders_all_access" ON public.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 24. sample_deliveries (存在)
ALTER TABLE IF EXISTS public.sample_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sample_deliveries_all_access" ON public.sample_deliveries;
CREATE POLICY "sample_deliveries_all_access" ON public.sample_deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 25. stages (存在)
ALTER TABLE IF EXISTS public.stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stages_all_access" ON public.stages;
CREATE POLICY "stages_all_access" ON public.stages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 26. suppliers (存在)
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_all_access" ON public.suppliers;
CREATE POLICY "suppliers_all_access" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 27. tasks (存在)
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_all_access" ON public.tasks;
CREATE POLICY "tasks_all_access" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 28. todo_remind_logs (存在)
ALTER TABLE IF EXISTS public.todo_remind_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "todo_remind_logs_all_access" ON public.todo_remind_logs;
CREATE POLICY "todo_remind_logs_all_access" ON public.todo_remind_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== 完成提示 =====
SELECT '✅ RLS 权限已配置，请刷新页面重新登录' as result;
