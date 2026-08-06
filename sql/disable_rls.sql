-- =====================================================
-- Supabase 紧急方案：关闭 RLS（让所有 authenticated 用户直接访问）
-- 如果上面的权限修复都不行，这个是终极方案
-- =====================================================

-- 方法：临时关闭 RLS（只用于开发/个人项目，生产环境请保持 RLS）
ALTER TABLE public.activate_export_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cert_matrix_cells DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cert_matrix_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cert_matrix_statuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cert_matrix_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_file DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_follow DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_bill DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_freight_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_sample_follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_remind_logs DISABLE ROW LEVEL SECURITY;

SELECT '✅ 已关闭所有业务表的 RLS 限制，刷新页面重新登录即可' as result;
