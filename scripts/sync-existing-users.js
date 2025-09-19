require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncExistingUsers() {
  try {
    console.log('🔄 SINCRONIZANDO USUÁRIOS EXISTENTES');
    console.log('=' .repeat(50));
    
    // 1. Buscar todos os usuários de auth.users
    console.log('📋 Buscando usuários em auth.users...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Erro ao buscar auth.users: ${authError.message}`);
    }
    
    console.log(`✅ Encontrados ${authUsers.users.length} usuários em auth.users`);
    
    // 2. Buscar usuários existentes em public.users
    console.log('📋 Buscando usuários em public.users...');
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('id, email');
    
    if (publicError) {
      throw new Error(`Erro ao buscar public.users: ${publicError.message}`);
    }
    
    console.log(`✅ Encontrados ${publicUsers.length} usuários em public.users`);
    
    // 3. Identificar usuários que precisam ser sincronizados
    const publicUserIds = new Set(publicUsers.map(u => u.id));
    const usersToSync = authUsers.users.filter(u => !publicUserIds.has(u.id));
    
    console.log(`🔍 ${usersToSync.length} usuários precisam ser sincronizados`);
    
    if (usersToSync.length === 0) {
      console.log('✅ Todos os usuários já estão sincronizados!');
      return;
    }
    
    // 4. Sincronizar usuários em lotes
    const batchSize = 5;
    let syncedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < usersToSync.length; i += batchSize) {
      const batch = usersToSync.slice(i, i + batchSize);
      console.log(`\n📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(usersToSync.length/batchSize)}`);
      
      for (const authUser of batch) {
        try {
          console.log(`  👤 Sincronizando: ${authUser.email}`);
          
          // Preparar dados do usuário
          const userData = {
            id: authUser.id,
            email: authUser.email,
            user_type: authUser.user_metadata?.user_type || 'customer',
            name: authUser.user_metadata?.name || 
                  authUser.user_metadata?.full_name || 
                  authUser.email.split('@')[0],
            phone: authUser.user_metadata?.phone || null,
            password_hash: '$2b$10$default.hash.for.oauth.users',
            created_at: authUser.created_at,
            updated_at: authUser.updated_at || authUser.created_at
          };
          
          // Inserir em public.users
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert(userData);
          
          if (insertError) {
            console.log(`    ❌ Erro: ${insertError.message}`);
            errorCount++;
            continue;
          }
          
          console.log(`    ✅ Sincronizado com sucesso`);
          syncedCount++;
          
          // Se for restaurante, criar entrada na tabela restaurants
          if (userData.user_type === 'restaurant') {
            const restaurantData = {
              user_id: authUser.id,
              name: authUser.user_metadata?.restaurant_name || 
                    authUser.user_metadata?.name || 
                    'Restaurante Migrado',
              description: 'Restaurante migrado automaticamente',
              address: authUser.user_metadata?.address || null,
              phone: authUser.user_metadata?.phone || null,
              email: authUser.email,
              created_by: authUser.id,
              created_at: authUser.created_at,
              updated_at: authUser.updated_at || authUser.created_at
            };
            
            const { error: restError } = await supabaseAdmin
              .from('restaurants')
              .insert(restaurantData);
            
            if (restError && !restError.message.includes('duplicate key')) {
              console.log(`    ⚠️  Erro ao criar restaurante: ${restError.message}`);
            } else if (!restError) {
              console.log(`    🏪 Restaurante criado`);
            }
          }
          
          // Se for entregador, criar entrada na tabela delivery_drivers
          if (userData.user_type === 'delivery_driver') {
            const driverData = {
              user_id: authUser.id,
              name: userData.name,
              phone: userData.phone,
              email: authUser.email,
              vehicle_type: authUser.user_metadata?.vehicle_type || 'moto',
              license_plate: authUser.user_metadata?.license_plate || null,
              created_at: authUser.created_at,
              updated_at: authUser.updated_at || authUser.created_at
            };
            
            const { error: driverError } = await supabaseAdmin
              .from('delivery_drivers')
              .insert(driverData);
            
            if (driverError && !driverError.message.includes('duplicate key')) {
              console.log(`    ⚠️  Erro ao criar entregador: ${driverError.message}`);
            } else if (!driverError) {
              console.log(`    🚚 Entregador criado`);
            }
          }
          
        } catch (userError) {
          console.log(`    ❌ Erro inesperado: ${userError.message}`);
          errorCount++;
        }
        
        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 5. Relatório final
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('=' .repeat(30));
    console.log(`✅ Usuários sincronizados: ${syncedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total processado: ${usersToSync.length}`);
    
    // 6. Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL...');
    const { data: finalPublicUsers } = await supabaseAdmin
      .from('users')
      .select('id');
    
    const { data: finalAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    console.log(`📊 Auth.users: ${finalAuthUsers.users.length}`);
    console.log(`📊 Public.users: ${finalPublicUsers.length}`);
    
    if (finalAuthUsers.users.length === finalPublicUsers.length) {
      console.log('🎉 SUCESSO: Todas as tabelas estão sincronizadas!');
    } else {
      const remaining = finalAuthUsers.users.length - finalPublicUsers.length;
      console.log(`⚠️  Ainda restam ${remaining} usuários para sincronizar`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral na sincronização:', error.message);
  }
}

syncExistingUsers();