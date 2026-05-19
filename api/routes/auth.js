const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const sb      = require('../services/supabase');
const auth    = require('../middleware/auth');

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'E-mail e senha obrigatórios' });

  const { data: admin, error } = await sb
    .from('admins').select('*').eq('email', email.toLowerCase()).single();

  if (error || !admin) return res.status(401).json({ message: 'Credenciais inválidas' });

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

  const token = jwt.sign(
    { id: admin.id, email: admin.email, nome: admin.nome, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, data: { id: admin.id, email: admin.email, nome: admin.nome, role: admin.role } });
});

/* POST /api/auth/logout */
router.post('/logout', (_req, res) => res.json({ message: 'Logout realizado' }));

/* GET /api/auth/me */
router.get('/me', auth, (req, res) => res.json({ data: req.admin }));

/* POST /api/auth/seed — cria primeiro admin (usar apenas 1x em prod) */
router.post('/seed', async (req, res) => {
  const email    = process.env.ADMIN_EMAIL    || 'admin@casacerta.com.br';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const hash = await bcrypt.hash(password, 12);
  const { data, error } = await sb.from('admins')
    .upsert({ email, password_hash: hash, nome: 'Administrador', role: 'admin' }, { onConflict: 'email' })
    .select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Admin criado/atualizado', email });
});

module.exports = router;
