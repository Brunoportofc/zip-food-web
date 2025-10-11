#!/bin/bash

echo "🌐 ZipFood - Finalização de Tradução para Hebraico"
echo "=================================================="
echo ""

echo "✅ ESTRUTURA JÁ IMPLEMENTADA:"
echo "  - LanguageContext com sistema completo de traduções"
echo "  - translations.ts com 800+ strings em hebraico"
echo "  - Suporte RTL completo no CSS"
echo "  - Translation helpers"
echo "  - Páginas principais traduzidas"
echo ""

echo "📝 ARQUIVOS QUE PRECISAM DE ATUALIZAÇÃO:"
echo ""
echo "ALTA PRIORIDADE:"
echo "  1. src/app/customer/restaurant/[id]/page.tsx"
echo "  2. src/app/customer/orders/page.tsx"
echo "  3. src/app/customer/profile/page.tsx"
echo "  4. src/components/AlertSystem.tsx"
echo "  5. src/components/NotificationCenter.tsx"
echo ""

echo "MÉDIA PRIORIDADE:"
echo "  6. src/app/restaurant/page.tsx"
echo "  7. src/app/restaurant/menu/page.tsx"
echo "  8. src/app/restaurant/pedidos/page.tsx"
echo "  9. src/components/AddressSelector.tsx"
echo " 10. src/components/DeliveryTracking.tsx"
echo ""

echo "BAIXA PRIORIDADE (APIs):"
echo " 11. src/app/api/restaurants/route.ts"
echo " 12. src/app/api/orders/route.ts"
echo " 13. src/app/api/menu/route.ts"
echo ""

echo "💡 PADRÃO DE CONVERSÃO:"
echo ""
echo "Para cada arquivo:"
echo "  1. Adicionar import: import { useLanguage } from '@/contexts/LanguageContext';"
echo "  2. Adicionar hook: const { t } = useLanguage();"
echo "  3. Substituir strings: 'Texto' → {t('chave.texto')}"
echo ""

echo "🔑 CHAVES JÁ DISPONÍVEIS:"
echo "  - common.* (loading, save, cancel, etc.)"
echo "  - restaurant.* (name, menu, open, closed, etc.)"
echo "  - order.* (myOrders, status.*, etc.)"
echo "  - cart.* (cart, addToCart, checkout, etc.)"
echo "  - menu.* (menuItem, available, etc.)"
echo "  - customerDashboard.* (title, search, etc.)"
echo "  - auth.* (signIn, signUp, etc.)"
echo "  - payment.* (payment, cardNumber, etc.)"
echo "  - address.* (address, street, city, etc.)"
echo "  - messages.* (success, error, etc.)"
echo "  - validation.* (required, invalidEmail, etc.)"
echo ""

echo "📖 Consulte TRANSLATION_GUIDE.md para exemplos completos"
echo ""

echo "🚀 TESTAR:"
echo "  npm run build"
echo ""

read -p "Deseja abrir o guia de tradução? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cat TRANSLATION_GUIDE.md
fi

