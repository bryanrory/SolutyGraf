const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Diretórios de dados
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Criar diretórios se não existem
[DATA_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Arquivos JSON de dados
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ENVIRONMENTS_FILE = path.join(DATA_DIR, 'environments.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Inicializar arquivos se não existem
function initFile(file, defaultData) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
  }
}

initFile(SETTINGS_FILE, {
  logo_url: '',
  hero_image_url: '',
  about_image_url: '',
  whatsapp: '',
  telefone_fixo: '',
  email: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  endereco_rua: '',
  endereco_numero: '',
  endereco_bairro: '',
  endereco_cidade: '',
  endereco_estado: '',
  endereco_cep: '',
  horario_funcionamento: 'Seg a Sex: 8h às 18h | Sáb: 8h às 12h'
});

initFile(ENVIRONMENTS_FILE, []);

initFile(ADMIN_FILE, {
  username: 'admin',
  // SHA-256 de "admin123"
  password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
});

// Helpers
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function generateSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const subfolder = req.query.folder || 'general';
    const dest = path.join(UPLOADS_DIR, subfolder);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });

// ========================================
// API - Settings
// ========================================
app.get('/api/settings', (req, res) => {
  res.json(readJSON(SETTINGS_FILE));
});

app.put('/api/settings', (req, res) => {
  const current = readJSON(SETTINGS_FILE);
  const updated = { ...current, ...req.body };
  writeJSON(SETTINGS_FILE, updated);
  res.json(updated);
});

// ========================================
// API - Upload
// ========================================
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const folder = req.query.folder || 'general';
  const url = '/uploads/' + folder + '/' + req.file.filename;
  res.json({ url });
});

app.post('/api/upload-multiple', upload.array('files', 20), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const folder = req.query.folder || 'general';
  const urls = req.files.map(f => '/uploads/' + folder + '/' + f.filename);
  res.json({ urls });
});

// ========================================
// API - Environments (Serviços)
// ========================================
app.get('/api/environments', (req, res) => {
  let envs = readJSON(ENVIRONMENTS_FILE);
  if (req.query.show_on_home === 'true') {
    envs = envs.filter(e => e.show_on_home);
  }
  // Ordenar por created_at desc
  envs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (req.query.limit) {
    envs = envs.slice(0, parseInt(req.query.limit));
  }
  res.json(envs);
});

app.get('/api/environments/count', (req, res) => {
  let envs = readJSON(ENVIRONMENTS_FILE);
  const total = envs.length;
  const home = envs.filter(e => e.show_on_home).length;
  const images = envs.reduce((sum, e) => sum + (e.images ? e.images.length : 0), 0);
  res.json({ total, home, images });
});

app.get('/api/environments/:idOrSlug', (req, res) => {
  const envs = readJSON(ENVIRONMENTS_FILE);
  const param = req.params.idOrSlug;
  const env = envs.find(e => e.id === param || e.slug === param);
  if (!env) return res.status(404).json({ error: 'Não encontrado' });
  res.json(env);
});

app.post('/api/environments', (req, res) => {
  const envs = readJSON(ENVIRONMENTS_FILE);
  const env = {
    id: generateId(),
    name: req.body.name,
    description: req.body.description || '',
    slug: generateSlug(req.body.name),
    show_on_home: req.body.show_on_home !== false,
    cover_image_url: '',
    images: [],
    created_at: new Date().toISOString()
  };
  envs.push(env);
  writeJSON(ENVIRONMENTS_FILE, envs);
  res.json(env);
});

app.put('/api/environments/:id', (req, res) => {
  const envs = readJSON(ENVIRONMENTS_FILE);
  const idx = envs.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Não encontrado' });

  if (req.body.name !== undefined) envs[idx].name = req.body.name;
  if (req.body.description !== undefined) envs[idx].description = req.body.description;
  if (req.body.show_on_home !== undefined) envs[idx].show_on_home = req.body.show_on_home;
  if (req.body.name) envs[idx].slug = generateSlug(req.body.name);

  writeJSON(ENVIRONMENTS_FILE, envs);
  res.json(envs[idx]);
});

app.delete('/api/environments/:id', (req, res) => {
  let envs = readJSON(ENVIRONMENTS_FILE);
  envs = envs.filter(e => e.id !== req.params.id);
  writeJSON(ENVIRONMENTS_FILE, envs);
  res.json({ ok: true });
});

// ========================================
// API - Environment Images
// ========================================
app.post('/api/environments/:id/images', upload.array('files', 20), (req, res) => {
  const envs = readJSON(ENVIRONMENTS_FILE);
  const env = envs.find(e => e.id === req.params.id);
  if (!env) return res.status(404).json({ error: 'Não encontrado' });

  if (!env.images) env.images = [];

  const newImages = [];
  req.files.forEach(f => {
    const folder = req.query.folder || 'environments';
    const url = '/uploads/' + folder + '/' + f.filename;
    const img = {
      id: generateId(),
      image_url: url,
      is_cover: env.images.length === 0 && newImages.length === 0,
      created_at: new Date().toISOString()
    };
    newImages.push(img);
    env.images.push(img);
  });

  // Se primeira imagem, definir como capa
  if (newImages.length > 0 && newImages[0].is_cover) {
    env.cover_image_url = newImages[0].image_url;
  }

  writeJSON(ENVIRONMENTS_FILE, envs);
  res.json({ images: newImages });
});

app.put('/api/environments/:envId/images/:imgId/cover', (req, res) => {
  const envs = readJSON(ENVIRONMENTS_FILE);
  const env = envs.find(e => e.id === req.params.envId);
  if (!env) return res.status(404).json({ error: 'Não encontrado' });

  env.images.forEach(img => { img.is_cover = false; });
  const img = env.images.find(i => i.id === req.params.imgId);
  if (img) {
    img.is_cover = true;
    env.cover_image_url = img.image_url;
  }

  writeJSON(ENVIRONMENTS_FILE, envs);
  res.json({ ok: true });
});

app.delete('/api/environments/:envId/images/:imgId', (req, res) => {
  const envs = readJSON(ENVIRONMENTS_FILE);
  const env = envs.find(e => e.id === req.params.envId);
  if (!env) return res.status(404).json({ error: 'Não encontrado' });

  const imgIdx = env.images.findIndex(i => i.id === req.params.imgId);
  if (imgIdx === -1) return res.status(404).json({ error: 'Imagem não encontrada' });

  const wasCover = env.images[imgIdx].is_cover;
  env.images.splice(imgIdx, 1);

  // Se removeu a capa, promover a primeira
  if (wasCover && env.images.length > 0) {
    env.images[0].is_cover = true;
    env.cover_image_url = env.images[0].image_url;
  } else if (env.images.length === 0) {
    env.cover_image_url = '';
  }

  writeJSON(ENVIRONMENTS_FILE, envs);
  res.json({ ok: true });
});

// ========================================
// API - Admin Auth
// ========================================
app.post('/api/admin/login', (req, res) => {
  const admin = readJSON(ADMIN_FILE);
  if (req.body.username === admin.username && req.body.password_hash === admin.password_hash) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// ========================================
// SPA fallback para rotas /ambiente/:slug/
// ========================================
app.get('/ambiente/:slug/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ambiente.html'));
});

app.get('/ambiente/:slug', (req, res) => {
  res.redirect('/ambiente/' + req.params.slug + '/');
});

// ========================================
// Start
// ========================================
app.listen(PORT, () => {
  console.log('Soluty Graf rodando em http://localhost:' + PORT);
  console.log('Admin: http://localhost:' + PORT + '/admin/');
  console.log('Login padrão: admin / admin123');
});
