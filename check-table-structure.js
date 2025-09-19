const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('=== ESTRUTURA DA TABELA RESTAURANTS ===');
    
    // Verificar estrutura da tabela
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'restaurants' })
      .select();
    
    if (error) {
      console.error('Erro ao verificar estrutura:', error);
      
      // Alternativa: tentar uma consulta simples para ver as colunas
      console.log('\nTentando consulta alternativa...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Erro na consulta alternativa:', sampleError);
      } else {
        console.log('Colunas disponíveis (baseado em dados de exemplo):');
        if (sampleData && sampleData.length > 0) {
          Object.keys(sampleData[0]).forEach(column => {
            console.log(`- ${column}: ${typeof sampleData[0][column]}`);
          });
        } else {
          console.log('Nenhum dado encontrado na tabela.');
        }
      }
      return;
    }
    
    console.log('Estrutura da tabela:');
    data.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });
    
  } catch (err) {
    console.error('Erro na verificação:', err);
  }
}

checkTableStructure();