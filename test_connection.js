const sb = require('./api/services/supabase');

async function test() {
  try {
    console.log("Testando conexão e buscando dados...");
    const { data: configs, error: err1 } = await sb.from('configuracoes_site').select('chave, valor').limit(5);
    if (err1) {
      console.error("Erro ao buscar configurações:", err1);
    } else {
      console.log("Configurações encontradas:", configs);
    }

    const { data: admins, error: err2 } = await sb.from('admins').select('email, nome');
    if (err2) {
      console.error("Erro ao buscar admins:", err2);
    } else {
      console.log("Admins cadastrados:", admins);
    }
  } catch (err) {
    console.error("Falha ao executar teste:", err);
  }
}

test();
