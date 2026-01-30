-- =====================================================
-- GLAMO - ROW-LEVEL SECURITY POLICIES
-- =====================================================
-- Políticas de isolamento multi-tenant
-- Executar após setup-rls.sql

-- =====================================================
-- TENANT POLICIES
-- =====================================================

-- Tenants: Super admin vê todos, outros veem apenas o próprio
DROP POLICY IF EXISTS tenant_isolation ON public.tenants;
CREATE POLICY tenant_isolation ON public.tenants
  USING (
    auth.is_super_admin() 
    OR id = public.current_tenant_id()
  );

-- =====================================================
-- UNIT POLICIES
-- =====================================================

DROP POLICY IF EXISTS unit_tenant_isolation ON public.units;
CREATE POLICY unit_tenant_isolation ON public.units
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- =====================================================
-- USER POLICIES (AUTH SCHEMA)
-- =====================================================

DROP POLICY IF EXISTS user_tenant_isolation ON auth.users;
CREATE POLICY user_tenant_isolation ON auth.users
  FOR ALL
  USING (
    auth.is_super_admin() 
    OR tenant_id = public.current_tenant_id()
  )
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS refresh_token_user_isolation ON auth.refresh_tokens;
CREATE POLICY refresh_token_user_isolation ON auth.refresh_tokens
  FOR ALL
  USING (user_id = auth.current_user_id())
  WITH CHECK (user_id = auth.current_user_id());

DROP POLICY IF EXISTS session_user_isolation ON auth.sessions;
CREATE POLICY session_user_isolation ON auth.sessions
  FOR ALL
  USING (user_id = auth.current_user_id())
  WITH CHECK (user_id = auth.current_user_id());

-- =====================================================
-- CUSTOMER POLICIES
-- =====================================================

DROP POLICY IF EXISTS customer_tenant_isolation ON public.customers;
CREATE POLICY customer_tenant_isolation ON public.customers
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS anamnesis_tenant_isolation ON public.anamnesis;
CREATE POLICY anamnesis_tenant_isolation ON public.anamnesis
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- =====================================================
-- SERVICE POLICIES
-- =====================================================

DROP POLICY IF EXISTS service_category_tenant_isolation ON public.service_categories;
CREATE POLICY service_category_tenant_isolation ON public.service_categories
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS service_tenant_isolation ON public.services;
CREATE POLICY service_tenant_isolation ON public.services
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Service Professionals: Acesso via service
DROP POLICY IF EXISTS service_professional_isolation ON public.service_professionals;
CREATE POLICY service_professional_isolation ON public.service_professionals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.services s 
      WHERE s.id = service_id 
      AND s.tenant_id = public.current_tenant_id()
    )
  );

-- =====================================================
-- PROFESSIONAL POLICIES
-- =====================================================

DROP POLICY IF EXISTS professional_tenant_isolation ON public.professionals;
CREATE POLICY professional_tenant_isolation ON public.professionals
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Professional Schedules: Acesso via professional
DROP POLICY IF EXISTS professional_schedule_isolation ON public.professional_schedules;
CREATE POLICY professional_schedule_isolation ON public.professional_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p 
      WHERE p.id = professional_id 
      AND p.tenant_id = public.current_tenant_id()
    )
  );

-- Professional Absences
DROP POLICY IF EXISTS professional_absence_isolation ON public.professional_absences;
CREATE POLICY professional_absence_isolation ON public.professional_absences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p 
      WHERE p.id = professional_id 
      AND p.tenant_id = public.current_tenant_id()
    )
  );

-- =====================================================
-- APPOINTMENT POLICIES
-- =====================================================

DROP POLICY IF EXISTS appointment_tenant_isolation ON public.appointments;
CREATE POLICY appointment_tenant_isolation ON public.appointments
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Appointment Services: Acesso via appointment
DROP POLICY IF EXISTS appointment_service_isolation ON public.appointment_services;
CREATE POLICY appointment_service_isolation ON public.appointment_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a 
      WHERE a.id = appointment_id 
      AND a.tenant_id = public.current_tenant_id()
    )
  );

-- =====================================================
-- FINANCIAL POLICIES
-- =====================================================

DROP POLICY IF EXISTS transaction_tenant_isolation ON public.transactions;
CREATE POLICY transaction_tenant_isolation ON public.transactions
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Transaction Items
DROP POLICY IF EXISTS transaction_item_isolation ON public.transaction_items;
CREATE POLICY transaction_item_isolation ON public.transaction_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_id 
      AND t.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS payment_tenant_isolation ON public.payments;
CREATE POLICY payment_tenant_isolation ON public.payments
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS commission_tenant_isolation ON public.commissions;
CREATE POLICY commission_tenant_isolation ON public.commissions
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS cash_register_tenant_isolation ON public.cash_registers;
CREATE POLICY cash_register_tenant_isolation ON public.cash_registers
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Cash Movements
DROP POLICY IF EXISTS cash_movement_isolation ON public.cash_movements;
CREATE POLICY cash_movement_isolation ON public.cash_movements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cash_registers cr 
      WHERE cr.id = cash_register_id 
      AND cr.tenant_id = public.current_tenant_id()
    )
  );

-- =====================================================
-- INVENTORY POLICIES
-- =====================================================

DROP POLICY IF EXISTS product_category_tenant_isolation ON public.product_categories;
CREATE POLICY product_category_tenant_isolation ON public.product_categories
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS product_tenant_isolation ON public.products;
CREATE POLICY product_tenant_isolation ON public.products
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS supplier_tenant_isolation ON public.suppliers;
CREATE POLICY supplier_tenant_isolation ON public.suppliers
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS stock_movement_tenant_isolation ON public.stock_movements;
CREATE POLICY stock_movement_tenant_isolation ON public.stock_movements
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- =====================================================
-- MARKETING & CAMPAIGN POLICIES
-- =====================================================

DROP POLICY IF EXISTS campaign_tenant_isolation ON public.campaigns;
CREATE POLICY campaign_tenant_isolation ON public.campaigns
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- =====================================================
-- LOYALTY POLICIES
-- =====================================================

DROP POLICY IF EXISTS loyalty_program_tenant_isolation ON public.loyalty_programs;
CREATE POLICY loyalty_program_tenant_isolation ON public.loyalty_programs
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Loyalty Rewards
DROP POLICY IF EXISTS loyalty_reward_isolation ON public.loyalty_rewards;
CREATE POLICY loyalty_reward_isolation ON public.loyalty_rewards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.loyalty_programs lp 
      WHERE lp.id = loyalty_program_id 
      AND lp.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS customer_points_tenant_isolation ON public.customer_points;
CREATE POLICY customer_points_tenant_isolation ON public.customer_points
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- =====================================================
-- NOTIFICATION POLICIES
-- =====================================================

DROP POLICY IF EXISTS notification_template_tenant_isolation ON public.notification_templates;
CREATE POLICY notification_template_tenant_isolation ON public.notification_templates
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS notification_tenant_isolation ON public.notifications;
CREATE POLICY notification_tenant_isolation ON public.notifications
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- =====================================================
-- REVIEW POLICIES
-- =====================================================

DROP POLICY IF EXISTS review_tenant_isolation ON public.reviews;
CREATE POLICY review_tenant_isolation ON public.reviews
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Permissões para funções de contexto
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.current_user_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.is_super_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_tenant_context(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.set_user_context(UUID, UUID, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.clear_user_context() TO PUBLIC;

-- =====================================================
-- COMENTÁRIOS DAS POLICIES
-- =====================================================

COMMENT ON POLICY tenant_isolation ON public.tenants IS 
'Super admins podem ver todos os tenants; usuários comuns veem apenas seu próprio tenant.';

COMMENT ON POLICY user_tenant_isolation ON auth.users IS 
'Isolamento de usuários por tenant. Super admins podem ver todos.';

COMMENT ON POLICY customer_tenant_isolation ON public.customers IS 
'Isolamento total de clientes por tenant.';

COMMENT ON POLICY appointment_tenant_isolation ON public.appointments IS 
'Isolamento total de agendamentos por tenant.';

COMMENT ON POLICY transaction_tenant_isolation ON public.transactions IS 
'Isolamento total de transações financeiras por tenant.';
