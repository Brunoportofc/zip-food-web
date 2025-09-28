// src/utils/sync-restaurant-claims.ts
// Utilitário para sincronizar custom claims de restaurantes

import { adminAuth, adminDb } from '@/lib/firebase/admin';

/**
 * Sincroniza custom claims para todos os usuários restaurante que possuem restaurante cadastrado
 * mas não têm os custom claims definidos
 */
export async function syncRestaurantClaims() {
  try {
    console.log('🔄 [Sync] Iniciando sincronização de custom claims para restaurantes...');
    
    // Buscar todos os restaurantes
    const restaurantsSnapshot = await adminDb.collection('restaurants').get();
    
    if (restaurantsSnapshot.empty) {
      console.log('📭 [Sync] Nenhum restaurante encontrado');
      return { success: true, updated: 0 };
    }

    let updatedCount = 0;
    const promises = [];

    for (const doc of restaurantsSnapshot.docs) {
      const restaurantData = doc.data();
      const ownerId = restaurantData.owner_id;
      
      if (!ownerId) {
        console.log('⚠️ [Sync] Restaurante sem owner_id:', doc.id);
        continue;
      }

      promises.push(
        (async () => {
          try {
            // Verificar custom claims atuais
            const userRecord = await adminAuth.getUser(ownerId);
            const currentClaims = userRecord.customClaims || {};
            
            // Se já tem os claims corretos, pular
            if (currentClaims.hasRestaurant && currentClaims.restaurantId === doc.id) {
              console.log('✅ [Sync] Claims já corretos para:', ownerId);
              return;
            }
            
            // Atualizar custom claims
            await adminAuth.setCustomUserClaims(ownerId, {
              ...currentClaims,
              hasRestaurant: true,
              restaurantId: doc.id
            });
            
            console.log('✅ [Sync] Claims atualizados para:', {
              ownerId: '***',
              restaurantId: doc.id,
              restaurantName: restaurantData.name
            });
            
            updatedCount++;
          } catch (error) {
            console.error('❌ [Sync] Erro ao atualizar claims para:', ownerId, error);
          }
        })()
      );
    }

    await Promise.all(promises);
    
    console.log(`✅ [Sync] Sincronização concluída. ${updatedCount} claims atualizados.`);
    return { success: true, updated: updatedCount };
    
  } catch (error) {
    console.error('❌ [Sync] Erro durante sincronização:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sincroniza custom claims para um usuário específico
 */
export async function syncUserRestaurantClaims(userId: string) {
  try {
    console.log('🔄 [Sync] Sincronizando claims para usuário:', userId);
    
    // Buscar restaurante do usuário
    const restaurantQuery = adminDb.collection('restaurants')
      .where('owner_id', '==', userId)
      .limit(1);
    
    const snapshot = await restaurantQuery.get();
    
    if (snapshot.empty) {
      // Usuário não tem restaurante, remover claims se existir
      await adminAuth.setCustomUserClaims(userId, {
        hasRestaurant: false,
        restaurantId: null
      });
      console.log('✅ [Sync] Claims removidos (usuário sem restaurante):', userId);
      return { success: true, hasRestaurant: false };
    }
    
    // Usuário tem restaurante, definir claims
    const restaurantDoc = snapshot.docs[0];
    await adminAuth.setCustomUserClaims(userId, {
      hasRestaurant: true,
      restaurantId: restaurantDoc.id
    });
    
    console.log('✅ [Sync] Claims definidos para usuário:', {
      userId: '***',
      restaurantId: restaurantDoc.id
    });
    
    return { success: true, hasRestaurant: true, restaurantId: restaurantDoc.id };
    
  } catch (error) {
    console.error('❌ [Sync] Erro ao sincronizar claims para usuário:', userId, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
