// =============================================
// Vercel Serverless - Soluty Graf API (shared handler)
// =============================================
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');

let settings, environments, admin;

function loadInitialData() {
  if (!settings) {
    try { settings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'settings.json'), 'utf-8')); } catch (e) { settings = {}; }
    if (settings.google_reviews_enabled === undefined) settings.google_reviews_enabled = false;
    if (settings.elfsight_code === undefined) settings.elfsight_code = '';
    if (settings.nota_google === undefined) settings.nota_google = '';
  }
  if (!environments) {
    try { environments = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'environments.json'), 'utf-8')); } catch (e) { environments = []; }
  }
  if (!admin) {
    try { admin = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'admin.json'), 'utf-8')); } catch (e) { admin = { username: 'admin', password_hash: '' }; }
  }
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

function handle(req, res) {
  loadInitialData();

  const url = new URL(req.url, 'http://localhost');
  const fullPath = url.pathname.replace(/\/+$/, '');
  const apiPath = fullPath.replace(/^\/api\/?/, '');
  const parts = apiPath.split('/').filter(Boolean);
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') return res.status(200).end();

  try {
    // SETTINGS
    if (parts[0] === 'settings' && parts.length === 1) {
      if (method === 'GET') return res.json(settings);
      if (method === 'PUT') { Object.assign(settings, req.body); return res.json(settings); }
    }

    // ADMIN LOGIN
    if (parts[0] === 'admin' && parts[1] === 'login' && method === 'POST') {
      if (req.body.username === admin.username && req.body.password_hash === admin.password_hash) {
        return res.json({ ok: true });
      }
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // ENVIRONMENTS
    if (parts[0] === 'environments') {
      if (parts[1] === 'count' && method === 'GET') {
        return res.json({
          total: environments.length,
          home: environments.filter(e => e.show_on_home).length,
          images: environments.reduce((s, e) => s + (e.images ? e.images.length : 0), 0)
        });
      }

      if (parts.length >= 2 && parts[1] !== 'count') {
        const env = environments.find(e => e.id === parts[1] || e.slug === parts[1]);

        if (parts[2] === 'images') {
          if (parts[4] === 'cover' && method === 'PUT') {
            if (!env) return res.status(404).json({ error: 'Não encontrado' });
            env.images.forEach(i => { i.is_cover = false; });
            const img = env.images.find(i => i.id === parts[3]);
            if (img) { img.is_cover = true; env.cover_image_url = img.image_url; }
            return res.json({ ok: true });
          }
          if (parts.length === 4 && method === 'DELETE') {
            if (!env) return res.status(404).json({ error: 'Não encontrado' });
            const idx = env.images.findIndex(i => i.id === parts[3]);
            if (idx === -1) return res.status(404).json({ error: 'Imagem não encontrada' });
            const wasCover = env.images[idx].is_cover;
            env.images.splice(idx, 1);
            if (wasCover && env.images.length > 0) { env.images[0].is_cover = true; env.cover_image_url = env.images[0].image_url; }
            else if (!env.images.length) env.cover_image_url = '';
            return res.json({ ok: true });
          }
          if (method === 'POST') return res.status(501).json({ error: 'Upload não disponível no modo demo' });
        }

        if (method === 'GET' && parts.length === 2) {
          if (!env) return res.status(404).json({ error: 'Não encontrado' });
          return res.json(env);
        }
        if (method === 'PUT' && parts.length === 2) {
          if (!env) return res.status(404).json({ error: 'Não encontrado' });
          if (req.body.name !== undefined) env.name = req.body.name;
          if (req.body.description !== undefined) env.description = req.body.description;
          if (req.body.show_on_home !== undefined) env.show_on_home = req.body.show_on_home;
          if (req.body.name) env.slug = generateSlug(req.body.name);
          return res.json(env);
        }
        if (method === 'DELETE' && parts.length === 2) {
          environments = environments.filter(e => e.id !== parts[1]);
          return res.json({ ok: true });
        }
      }

      if (parts.length === 1 && method === 'GET') {
        let result = [...environments];
        if (url.searchParams.get('show_on_home') === 'true') result = result.filter(e => e.show_on_home);
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const limit = url.searchParams.get('limit');
        if (limit) result = result.slice(0, parseInt(limit));
        return res.json(result);
      }
      if (parts.length === 1 && method === 'POST') {
        const env = {
          id: generateId(), name: req.body.name, description: req.body.description || '',
          slug: generateSlug(req.body.name), show_on_home: req.body.show_on_home !== false,
          cover_image_url: '', images: [], created_at: new Date().toISOString()
        };
        environments.push(env);
        return res.json(env);
      }
    }

    // UPLOAD
    if (parts[0] === 'upload' || parts[0] === 'upload-multiple') {
      return res.status(501).json({ error: 'Upload não disponível no modo demo' });
    }

    // REVIEWS
    if (parts[0] === 'reviews') {
      if (method === 'GET') return res.json([]);
      return res.json({ ok: true });
    }

    return res.status(404).json({ error: 'Rota não encontrada' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports = handle;
