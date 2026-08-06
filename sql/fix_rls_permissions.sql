-- =====================================================
-- Supabase RLS 权限修复脚本
-- 请在 Supabase Dashboard → SQL Editor 中执行
-- 作用：为所有业务表开启 authenticated 用户的完整读写权限
-- =====================================================

-- 1. 对所有已开启 RLS 的表，添加 authenticated 用户的完整权限策略
-- 如果之前有冲突的策略，可以先删除

-- 客户表
DROP POLICY IF EXISTS "customers_all_access" ON public.customers;
CREATE POLICY "customers_all_access"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 客户跟进记录
DROP POLICY IF EXISTS "package_sample_follows_all_access" ON public.package_sample_follows;
CREATE POLICY "package_sample_follows_all_access"
  ON public.package_sample_follows
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 机型参数库
DROP POLICY IF EXISTS "product_models_all_access" ON public.product_models;
CREATE POLICY "product_models_all_access"
  ON public.product_models
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 认证档案
DROP POLICY IF EXISTS "product_certs_all_access" ON public.product_certs;
CREATE POLICY "product_certs_all_access"
  ON public.product_certs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 机型图片
DROP POLICY IF EXISTS "product_images_all_access" ON public.product_images;
CREATE POLICY "product_images_all_access"
  ON public.product_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 物流单据
DROP POLICY IF EXISTS "logistics_orders_all_access" ON public.logistics_orders;
CREATE POLICY "logistics_orders_all_access"
  ON public.logistics_orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 样单运费
DROP POLICY IF EXISTS "package_freight_records_all_access" ON public.package_freight_records;
CREATE POLICY "package_freight_records_all_access"
  ON public.package_freight_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 销售订单
DROP POLICY IF EXISTS "sales_orders_all_access" ON public.sales_orders;
CREATE POLICY "sales_orders_all_access"
  ON public.sales_orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 客户分组
DROP POLICY IF EXISTS "customer_groups_all_access" ON public.customer_groups;
CREATE POLICY "customer_groups_all_access"
  ON public.customer_groups
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 激活数据导出配置
DROP POLICY IF EXISTS "activate_export_configs_all_access" ON public.activate_export_configs;
CREATE POLICY "activate_export_configs_all_access"
  ON public.activate_export_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 认证矩阵文件
DROP POLICY IF EXISTS "cert_matrix_files_all_access" ON public.cert_matrix_files;
CREATE POLICY "cert_matrix_files_all_access"
  ON public.cert_matrix_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 认证矩阵单元格
DROP POLICY IF EXISTS "cert_matrix_cells_all_access" ON public.cert_matrix_cells;
CREATE POLICY "cert_matrix_cells_all_access"
  ON public.cert_matrix_cells
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 认证矩阵模板
DROP POLICY IF EXISTS "cert_matrix_templates_all_access" ON public.cert_matrix_templates;
CREATE POLICY "cert_matrix_templates_all_access"
  ON public.cert_matrix_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 认证矩阵状态
DROP POLICY IF EXISTS "cert_matrix_statuses_all_access" ON public.cert_matrix_statuses;
CREATE POLICY "cert_matrix_statuses_all_access"
  ON public.cert_matrix_statuses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 样单交付
DROP POLICY IF EXISTS "sample_deliveries_all_access" ON public.sample_deliveries;
CREATE POLICY "sample_deliveries_all_access"
  ON public.sample_deliveries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 完成后，刷新页面重新登录即可
-- 如果仍然失败，请检查：
-- 1. 用户是否已登录（Settings → 账户 → 登录状态）
-- 2. 是否使用了 Service Role Key（仅限后端，前端只能用 anon key）
-- =====================================================
