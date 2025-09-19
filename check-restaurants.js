const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestRestaurants() {
  try {
    console.log('=== ÚLTIMOS RESTAURANTES CRIADOS ===');
    
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, user_id, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    console.log('Últimos 5 restaurantes:');
    data.forEach((restaurant, index) => {
      console.log(`${index + 1}. ${restaurant.name}`);
      console.log(`   ID: ${restaurant.id}`);
      console.log(`   user_id: ${restaurant.user_id || 'NULL'}`);
      console.log(`   created_by: ${restaurant.created_by || 'NULL'}`);
      console.log(`   created_at: ${restaurant.created_at}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('Erro na consulta:', err);
  }
}

checkLatestRestaurants();