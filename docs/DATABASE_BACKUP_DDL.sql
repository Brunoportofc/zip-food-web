-- =====================================================
-- BACKUP DAS ESTRUTURAS DAS TABELAS REMOVIDAS
-- Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Projeto: zip-food (ctmiudrsijgodaptyheu)
-- =====================================================
-- 
-- IMPORTANTE: Todas essas tabelas estavam VAZIAS no momento da remoção
-- Este backup contém apenas as estruturas (DDL) para referência futura
--

-- =====================================================
-- TABELA: marketing_campaigns
-- =====================================================
CREATE TABLE public.marketing_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    restaurant_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,
    target_audience JSONB NOT NULL,
    coupon_id UUID,
    promotion_id UUID,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'draft'::character varying,
    recipients_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA: order_items
-- =====================================================
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- TABELA: promotion_applications
-- =====================================================
CREATE TABLE public.promotion_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    promotion_id UUID,
    order_id UUID,
    discount_amount NUMERIC NOT NULL,
    free_items JSONB,
    applied_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA: promotions
-- =====================================================
CREATE TABLE public.promotions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    restaurant_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    conditions JSONB NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value NUMERIC,
    free_item_id UUID,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    applicable_days ARRAY DEFAULT '{0,1,2,3,4,5,6}'::integer[],
    applicable_hours JSONB DEFAULT '{"end": "23:59", "start": "00:00"}'::jsonb,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA: restaurant_reviews
-- =====================================================
CREATE TABLE public.restaurant_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    order_id UUID,
    rating INTEGER NOT NULL,
    title VARCHAR(200),
    comment TEXT,
    delivery_rating INTEGER,
    food_quality_rating INTEGER,
    service_rating INTEGER,
    is_verified BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA: review_helpful_votes
-- =====================================================
CREATE TABLE public.review_helpful_votes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA: review_responses
-- =====================================================
CREATE TABLE public.review_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL,
    restaurant_id UUID NOT NULL,
    response_text TEXT NOT NULL,
    responded_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- FOREIGN KEYS E CONSTRAINTS IDENTIFICADAS
-- =====================================================
-- 
-- marketing_campaigns:
--   - marketing_campaigns_coupon_id_fkey: coupon_id → coupons.id
--   - marketing_campaigns_promotion_id_fkey: promotion_id → promotions.id
--   - marketing_campaigns_restaurant_id_fkey: restaurant_id → restaurants.id
--
-- order_items:
--   - order_items_order_id_fkey: order_id → orders.id
--
-- promotion_applications:
--   - promotion_applications_order_id_fkey: order_id → orders.id
--   - promotion_applications_promotion_id_fkey: promotion_id → promotions.id
--
-- promotions:
--   - promotions_free_item_id_fkey: free_item_id → menu_items.id
--   - promotions_restaurant_id_fkey: restaurant_id → restaurants.id
--
-- restaurant_reviews:
--   - restaurant_reviews_order_id_fkey: order_id → orders.id
--   - restaurant_reviews_restaurant_id_fkey: restaurant_id → restaurants.id
--
-- review_helpful_votes:
--   - review_helpful_votes_review_id_fkey: review_id → restaurant_reviews.id
--
-- review_responses:
--   - review_responses_restaurant_id_fkey: restaurant_id → restaurants.id
--   - review_responses_review_id_fkey: review_id → restaurant_reviews.id
--
-- =====================================================
-- FIM DO BACKUP
-- =====================================================