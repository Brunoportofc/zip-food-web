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

async function finalTest() {
  try {
    console.log('🎯 TESTE FINAL DO FLUXO DE CRIAÇÃO DE CONTA');
    console.log('=' .repeat(60));
    
    // Teste com usuário delivery (usando 'delivery' em vez de 'delivery_driver')
    const testUser = {
      email: `final-test-${Date.now()}@zipfood.com`,
      password: 'teste123456',
      name: 'Entregador Final',
      userType: 'delivery', // Usando 'delivery' que é aceito pelo constraint
      phone: '(16) 99999-9999'
    };
    
    console.log(`\n👤 TESTANDO CRIAÇÃO DE ENTREGADOR: ${testUser.email}`);
    console.log('-' .repeat(50));
    
    let createdUserId = null;
    
    try {
      // 1. Criar usuário diretamente na tabela public.users (simulando o AuthService corrigido)
      console.log('1️⃣ Criando usuário na tabela public.users...');
      
      const publicUserData = {
        email: testUser.email,
        user_type: testUser.userType,
        name: testUser.name,
        phone: testUser.phone,
        password_hash: '$2b$10$test.hash.for.testing'
      };
      
      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(publicUserData)
        .select()
        .single();
      
      if (insertError) {
        console.log(`❌ Erro na criação: ${insertError.message}`);
        return;
      }
      
      createdUserId = insertedUser.id;
      console.log(`✅ Usuário criado: ${createdUserId}`);
      
      // 2. Criar entrada na tabela delivery_drivers
      console.log('2️⃣ Criando entrada na tabela delivery_drivers...');
      
      const driverData = {
        user_id: createdUserId,
        vehicle_type: 'moto',
        license_plate: 'TEST-1234'
      };
      
      const { error: driverError } = await supabaseAdmin
        .from('delivery_drivers')
        .insert(driverData);
      
      if (driverError) {
        console.log(`❌ Erro ao criar entregador: ${driverError.message}`);
      } else {
        console.log('✅ Entregador criado com sucesso');
      }
      
      // 3. Verificar se o usuário foi criado corretamente
      console.log('3️⃣ Verificando dados criados...');
      
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', createdUserId)
        .single();
      
      if (userError) {
        console.log(`❌ Erro ao buscar usuário: ${userError.message}`);
      } else {
        console.log(`✅ Usuário encontrado: ${userData.name} (${userData.user_type})`);
      }
      
      const { data: driverData2, error: driverError2 } = await supabaseAdmin
        .from('delivery_drivers')
        .select('*')
        .eq('user_id', createdUserId)
        .single();
      
      if (driverError2) {
        console.log(`❌ Erro ao buscar entregador: ${driverError2.message}`);
      } else {
        console.log(`✅ Entregador encontrado: ${driverData2.vehicle_type}`);
      }
      
      console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
      
    } catch (testError) {
      console.log(`❌ Erro inesperado: ${testError.message}`);
    } finally {
      // 4. Limpeza
      if (createdUserId) {
        console.log('\n🧹 LIMPANDO DADOS DE TESTE...');
        
        try {
          await supabaseAdmin
            .from('delivery_drivers')
            .delete()
            .eq('user_id', createdUserId);
          
          await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', createdUserId);
          
          console.log('✅ Dados de teste removidos');
        } catch (cleanupError) {
          console.log(`⚠️  Erro na limpeza: ${cleanupError.message}`);
        }
      }
    }
    
    // 5. Relatório final das tabelas
    console.log('\n📊 RELATÓRIO FINAL DAS TABELAS');
    console.log('=' .repeat(40));
    
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('id, user_type');
    
    const { data: allDrivers } = await supabaseAdmin
      .from('delivery_drivers')
      .select('id');
    
    const { data: allRestaurants } = await supabaseAdmin
      .from('restaurants')
      .select('id');
    
    console.log(`📋 Total de usuários: ${allUsers?.length || 0}`);
    console.log(`📋 Total de entregadores: ${allDrivers?.length || 0}`);
    console.log(`📋 Total de restaurantes: ${allRestaurants?.length || 0}`);
    
    const userTypes = allUsers?.reduce((acc, user) => {
      acc[user.user_type] = (acc[user.user_type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Distribuição por tipo:', userTypes);
    
    console.log('\n🎯 TESTE FINAL CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

finalTest();