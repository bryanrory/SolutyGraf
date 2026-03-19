// =============================================
// Vercel Serverless - Soluty Graf API
// Dados em memória (carregados dos JSONs do repo)
// =============================================
const fs = require('fs');
const path = require('path');

// Carregar dados iniciais dos JSONs do repo
const DATA_DIR = path.join(process.cwd(), 'data');

let settings, environments, admin;

function loadInitialData() {
  if (!settings) {
    try { settings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'settings.json'), 'utf-8')); } catch (e) { settings = {}; }
    // Garantir campos novos
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

module.exports = function handler(req, res) {
  loadInitialData();

  // Extrair o path da URL
  const url = new URL(req.url, 'http://localhost');
  const fullPath = url.pathname; // ex: /api/settings, /api/environments/123

  // Remover /api/ do início
  const apiPath = fullPath.replace(/^\/api\/?/, '');
  const parts = apiPath.split('/').filter(Boolean);
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') return res.status(200).end();

  try {
    // ==================== SETTINGS ====================
    if (parts[0] === 'settings' && parts.length === 1) {
      if (method === 'GET') {
        return res.json(settings);
      }
      if (method === 'PUT') {
        Object.assign(settings, req.body);
        return res.json(settings);
      }
    }

    // ==================== ADMIN LOGIN ====================
    if (parts[0] === 'admin' && parts[1] === 'login' && method === 'POST') {
      if (req.body.username === admin.username && req.body.password_hash === admin.password_hash) {
        return res.json({ ok: true });
      }
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // ==================== ENVIRONMENTS ====================
    if (parts[0] === 'environments') {

      // GET /api/environments/count
      if (parts[1] === 'count' && method === 'GET') {
        const total = environments.length;
        const home = environments.filter(e => e.show_on_home).length;
        const images = environments.reduce((sum, e) => sum + (e.images ? e.images.length : 0), 0);
        return res.json({ total, home, images });
      }

      // GET /api/environments/:id/... or GET /api/environments/:id
      if (parts.length >= 2 && parts[1] !== 'count') {
        const envIdOrSlug = parts[1];
        const env = environments.find(e => e.id === envIdOrSlug || e.slug === envIdOrSlug);

        // Imagens do ambiente
        if (parts.length >= 3 && parts[2] === 'images') {

          // PUT /api/environments/:id/images/:imgId/cover
          if (parts.length === 5 && parts[4] === 'cover' && method === 'PUT') {
            if (!env) return res.status(404).json({ error: 'Não encontrado' });
            env.images.forEach(img => { img.is_cover = false; });
            const img = env.images.find(i => i.id === parts[3]);
            if (img) { img.is_cover = true; env.cover_image_url = img.image_url; }
            return res.json({ ok: true });
          }

          // DELETE /api/environments/:id/images/:imgId
          if (parts.length === 4 && method === 'DELETE') {
            if (!env) return res.status(404).json({ error: 'Não encontrado' });
            const imgIdx = env.images.findIndex(i => i.id === parts[3]);
            if (imgIdx === -1) return res.status(404).json({ error: 'Imagem não encontrada' });
            const wasCover = env.images[imgIdx].is_cover;
            env.images.splice(imgIdx, 1);
            if (wasCover && env.images.length > 0) {
              env.images[0].is_cover = true;
              env.cover_image_url = env.images[0].image_url;
            } else if (env.images.length === 0) {
              env.cover_image_url = '';
            }
            return res.json({ ok: true });
          }

          // POST /api/environments/:id/images (upload - limitado no serverless)
          if (method === 'POST') {
            return res.status(501).json({ error: 'Upload não disponível no modo demo (Vercel)' });
          }
        }

        // GET /api/environments/:id
        if (method === 'GET') {
          if (!env) return res.status(404).json({ error: 'Não encontrado' });
          return res.json(env);
        }

        // PUT /api/environments/:id
        if (method === 'PUT' && parts.length === 2) {
          if (!env) return res.status(404).json({ error: 'Não encontrado' });
          if (req.body.name !== undefined) env.name = req.body.name;
          if (req.body.description !== undefined) env.description = req.body.description;
          if (req.body.show_on_home !== undefined) env.show_on_home = req.body.show_on_home;
          if (req.body.name) env.slug = generateSlug(req.body.name);
          return res.json(env);
        }

        // DELETE /api/environments/:id
        if (method === 'DELETE' && parts.length === 2) {
          environments = environments.filter(e => e.id !== envIdOrSlug);
          return res.json({ ok: true });
        }
      }

      // GET /api/environments
      if (parts.length === 1 && method === 'GET') {
        let result = [...environments];
        if (url.searchParams.get('show_on_home') === 'true') {
          result = result.filter(e => e.show_on_home);
        }
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const limit = url.searchParams.get('limit');
        if (limit) result = result.slice(0, parseInt(limit));
        return res.json(result);
      }

      // POST /api/environments
      if (parts.length === 1 && method === 'POST') {
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
        environments.push(env);
        return res.json(env);
      }
    }

    // ==================== UPLOAD (não suportado no serverless) ====================
    if (parts[0] === 'upload' || parts[0] === 'upload-multiple') {
      return res.status(501).json({ error: 'Upload não disponível no modo demo (Vercel)' });
    }

    // ==================== REVIEWS ====================
    if (parts[0] === 'reviews') {
      // Reviews foram removidas (agora usa Elfsight), mas manter rota vazia
      if (method === 'GET') return res.json([]);
      return res.json({ ok: true });
    }

    // 404
    return res.status(404).json({ error: 'Rota não encontrada: ' + fullPath });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};
