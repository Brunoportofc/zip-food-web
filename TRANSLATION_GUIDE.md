# 🌐 Guia de Tradução - ZipFood Hebrew

## ✅ Status Atual

### Completo (100%)
- [x] Infraestrutura base (LanguageContext, translations.ts)
- [x] Suporte RTL completo (CSS)
- [x] Constants (categoryConfig, orderStatus)
- [x] Página Home (app/page.tsx)
- [x] Translation helpers (utils/translation-helper.ts)

### Em Progresso (30-70%)
- [~] Customer Dashboard (app/customer/page.tsx) - hook adicionado
- [ ] Restaurant pages
- [ ] Components principais

## 📝 Padrão de Conversão

### 1. Adicionar Hook no Componente

```typescript
// NO INÍCIO DO ARQUIVO
import { useLanguage } from '@/contexts/LanguageContext';

// NO COMPONENTE
const { t } = useLanguage();
```

### 2. Converter Strings

**Antes:**
```typescript
<h1>Meu Restaurante</h1>
<button>Salvar</button>
<p>Carregando...</p>
```

**Depois:**
```typescript
<h1>{t('restaurant.myRestaurant')}</h1>
<button>{t('common.save')}</button>
<p>{t('common.loading')}</p>
```

### 3. Usar Helpers para Categorias/Status

**Antes:**
```typescript
{categoryDisplayNames[restaurant.category]}
{orderStatusLabels[order.status]}
```

**Depois:**
```typescript
import { getCategoryName, getOrderStatusName } from '@/utils/translation-helper';

{getCategoryName(restaurant.category, t)}
{getOrderStatusName(order.status, t)}
```

## 🔑 Chaves de Tradução Principais

### Common
- `common.loading` - טוען...
- `common.save` - שמור
- `common.cancel` - ביטול
- `common.delete` - מחק
- `common.edit` - ערוך
- `common.search` - חיפוש
- `common.back` - חזור

### Restaurant
- `restaurant.name` - שם המסעדה
- `restaurant.menu` - תפריט
- `restaurant.open` - פתוח
- `restaurant.closed` - סגור
- `restaurant.rating` - דירוג

### Order
- `order.myOrders` - ההזמנות שלי
- `order.orderDetails` - פרטי הזמנה
- `order.status.pending` - ממתין
- `order.status.confirmed` - אושר
- `order.status.delivered` - נמסר

### Cart
- `cart.cart` - עגלה
- `cart.addToCart` - הוסף לעגלה
- `cart.checkout` - המשך לתשלום
- `cart.emptyCart` - העגלה ריקה

### Menu
- `menu.menuItem` - פריט בתפריט
- `menu.addItem` - הוסף פריט
- `menu.available` - זמין
- `menu.unavailable` - לא זמין

### Customer Dashboard
- `customerDashboard.title` - מה תרצה להזמין היום?
- `customerDashboard.searchPlaceholder` - חפש מסעדות...
- `customerDashboard.noRestaurants` - לא נמצאו מסעדות

### Messages
- `messages.successfullyUpdated` - עודכן בהצלחה
- `messages.errorOccurred` - אירעה שגיאה
- `messages.confirmDelete` - האם אתה בטוח שברצונך למחוק?

### Validation
- `validation.required` - שדה חובה
- `validation.invalidEmail` - אימייל לא תקין
- `validation.passwordTooShort` - סיסמה קצרה מדי

## 📁 Arquivos que Ainda Precisam de Tradução

### Alta Prioridade
1. **src/app/customer/page.tsx** - Dashboard do cliente (já tem hook)
2. **src/app/customer/restaurant/[id]/page.tsx** - Página de restaurante
3. **src/components/cart/CartDrawer.tsx** - Carrinho de compras
4. **src/components/AlertSystem.tsx** - Sistema de alertas
5. **src/app/customer/orders/page.tsx** - Pedidos do cliente
6. **src/app/customer/profile/page.tsx** - Perfil do cliente

### Média Prioridade
7. **src/app/restaurant/page.tsx** - Dashboard do restaurante
8. **src/app/restaurant/menu/page.tsx** - Menu do restaurante
9. **src/app/restaurant/pedidos/page.tsx** - Pedidos do restaurante
10. **src/components/NotificationCenter.tsx** - Central de notificações
11. **src/components/AddressSelector.tsx** - Seletor de endereço

### APIs (Mensagens de Erro)
12. **src/app/api/restaurants/route.ts**
13. **src/app/api/orders/route.ts**
14. **src/app/api/menu/route.ts**

## 🚀 Como Aplicar

### Exemplo Prático: CartDrawer.tsx

1. **Adicione o import:**
```typescript
import { useLanguage } from '@/contexts/LanguageContext';
```

2. **Adicione o hook:**
```typescript
export default function CartDrawer() {
  const { t } = useLanguage();
  // ... rest
}
```

3. **Substitua strings:**
```typescript
// Antes
<h2>Carrinho</h2>
<button>Finalizar Pedido</button>
<p>Seu carrinho está vazio</p>

// Depois
<h2>{t('cart.cart')}</h2>
<button>{t('cart.checkout')}</button>
<p>{t('cart.emptyCart')}</p>
```

## 📋 Checklist de Conversão

Para cada arquivo:
- [ ] Import do `useLanguage`
- [ ] Hook `const { t } = useLanguage()` no componente
- [ ] Substituir todas as strings hardcoded
- [ ] Usar helpers para categorias/status
- [ ] Testar localmente

## 🔧 Ferramentas Úteis

### Buscar strings não traduzidas:
```bash
# Procurar strings em português
grep -r "className.*>.*[a-zà-ú]" src/app/customer --include="*.tsx"
```

### Testar build:
```bash
npm run build
```

## 📞 Próximos Passos

1. ✅ Completar customer dashboard
2. ✅ Traduzir CartDrawer
3. ✅ Traduzir AlertSystem
4. ✅ Traduzir páginas de restaurante
5. ✅ Traduzir APIs
6. ✅ Build final e teste completo

---

**Última atualização:** Fase 3 - 50% completo

