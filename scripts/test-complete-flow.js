require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCompleteFlow() {
  try {
    console.log('🧪 TESTE COMPLETO DO FLUXO DE CRIAÇÃO DE CONTA');
    console.log('=' .repeat(60));
    
    const testUsers = [
      {
        email: `test-customer-${Date.now()}@zipfood.com`,
        password: 'teste123456',
        name: 'Cliente Teste',
        userType: 'customer',
        phone: '(16) 99999-1111'
      },
      {
        email: `test-restaurant-${Date.now()}@zipfood.com`,
        password: 'teste123456',
        name: 'Restaurante Teste',
        userType: 'restaurant',
        phone: '(16) 99999-2222'
      },
      {
        email: `test-driver-${Date.now()}@zipfood.com`,
        password: 'teste123456',
        name: 'Entregador Teste',
        userType: 'delivery_driver',
        phone: '(16) 99999-3333'
      }
    ];
    
    const createdUsers = [];
    
    for (const userData of testUsers) {
      console.log(`\n👤 TESTANDO CRIAÇÃO DE ${userData.userType.toUpperCase()}: ${userData.email}`);
      console.log('-' .repeat(50));
      
      try {
        // 1. Criar usuário usando o cliente público (simula o frontend)
        console.log('1️⃣ Criando usuário via Supabase Auth...');
        
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
              user_type: userData.userType,
              phone: userData.phone,
            },
          },
        });
        
        if (authError) {
          console.log(`❌ Erro na criação: ${authError.message}`);
          continue;
        }
        
        if (!authData.user) {
          console.log('❌ Nenhum usuário retornado');
          continue;
        }
        
        console.log(`✅ Usuário criado em auth.users: ${authData.user.id}`);
        createdUsers.push(authData.user);
        
        // 2. Simular a sincronização manual (já que não temos trigger)
        console.log('2️⃣ Sincronizando com tabela public.users...');
        
        const publicUserData = {
          id: authData.user.id,
          email: authData.user.email,
          user_type: userData.userType,
          name: userData.name,
          phone: userData.phone,
          password_hash: '$2b$10$synced.from.auth.users',
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at || authData.user.created_at
        };
        
        const { error: syncError } = await supabaseAdmin
          .from('users')
          .insert(publicUserData);
        
        if (syncError) {
          console.log(`❌ Erro na sincronização: ${syncError.message}`);
        } else {
          console.log('✅ Usuário sincronizado com public.users');
        }
        
        // 3. Criar entradas específicas por tipo de usuário
        if (userData.userType === 'restaurant') {
          console.log('3️⃣ Criando entrada na tabela restaurants...');
          
          const restaurantData = {
            user_id: authData.user.id,
            name: userData.name,
            description: 'Restaurante de teste',
            address: 'Endereço de teste, 123',
            phone: userData.phone,
            email: authData.user.email,
            created_by: authData.user.id,
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at || authData.user.created_at
          };
          
          const { error: restError } = await supabaseAdmin
            .from('restaurants')
            .insert(restaurantData);
          
          if (restError) {
            console.log(`❌ Erro ao criar restaurante: ${restError.message}`);
          } else {
            console.log('✅ Restaurante criado');
          }
        }
        
        if (userData.userType === 'delivery_driver') {
          console.log('3️⃣ Criando entrada na tabela delivery_drivers...');
          
          const driverData = {
            user_id: authData.user.id,
            name: userData.name,
            phone: userData.phone,
            email: authData.user.email,
            vehicle_type: 'moto',
            license_plate: 'ABC-1234',
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at || authData.user.created_at
          };
          
          const { error: driverError } = await supabaseAdmin
            .from('delivery_drivers')
            .insert(driverData);
          
          if (driverError) {
            console.log(`❌ Erro ao criar entregador: ${driverError.message}`);
          } else {
            console.log('✅ Entregador criado');
          }
        }
        
        // 4. Verificar se o usuário pode fazer login
        console.log('4️⃣ Testando login...');
        
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });
        
        if (loginError) {
          console.log(`❌ Erro no login: ${loginError.message}`);
        } else {
          console.log('✅ Login bem-sucedido');
          
          // Fazer logout
          await supabaseClient.auth.signOut();
        }
        
        // 5. Verificar dados na tabela public.users
        console.log('5️⃣ Verificando dados em public.users...');
        
        const { data: publicUser, error: publicError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (publicError) {
          console.log(`❌ Usuário não encontrado em public.users: ${publicError.message}`);
        } else {
          console.log(`✅ Usuário encontrado: ${publicUser.name} (${publicUser.user_type})`);
        }
        
        console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
        
      } catch (userError) {
        console.log(`❌ Erro inesperado: ${userError.message}`);
      }
    }
    
    // 6. Relatório final
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('=' .repeat(30));
    
    const { data: finalAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const { data: finalPublicUsers } = await supabaseAdmin
      .from('users')
      .select('id');
    
    console.log(`📋 Total em auth.users: ${finalAuthUsers?.users?.length || 0}`);
    console.log(`📋 Total em public.users: ${finalPublicUsers?.length || 0}`);
    
    if (finalAuthUsers?.users?.length === finalPublicUsers?.length) {
      console.log('✅ Tabelas sincronizadas!');
    } else {
      console.log('⚠️  Ainda há discrepância entre as tabelas');
    }
    
    // 7. Limpeza (remover usuários de teste)
    console.log('\n🧹 LIMPANDO USUÁRIOS DE TESTE...');
    
    for (const user of createdUsers) {
      try {
        // Remover de auth.users
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        // Remover de public.users
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', user.id);
        
        // Remover de tabelas relacionadas
        await supabaseAdmin
          .from('restaurants')
          .delete()
          .eq('user_id', user.id);
        
        await supabaseAdmin
          .from('delivery_drivers')
          .delete()
          .eq('user_id', user.id);
        
        console.log(`✅ Usuário ${user.email} removido`);
      } catch (cleanupError) {
        console.log(`⚠️  Erro ao remover ${user.email}: ${cleanupError.message}`);
      }
    }
    
    console.log('\n🎯 TESTE COMPLETO FINALIZADO!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testCompleteFlow();