// =============================================
// API Config - Soluty Graf (Local)
// =============================================
// API local - sem Supabase por enquanto
var API_BASE = '';

var api = {
  async get(url) {
    var res = await fetch(API_BASE + url);
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  },
  async post(url, data) {
    var res = await fetch(API_BASE + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  },
  async put(url, data) {
    var res = await fetch(API_BASE + url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  },
  async del(url) {
    var res = await fetch(API_BASE + url, { method: 'DELETE' });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  },
  async uploadFile(file, folder) {
    var form = new FormData();
    form.append('file', file);
    var res = await fetch(API_BASE + '/api/upload?folder=' + encodeURIComponent(folder), {
      method: 'POST',
      body: form
    });
    if (!res.ok) throw new Error('Upload error');
    var data = await res.json();
    return data.url;
  },
  async uploadFiles(files, folder) {
    var form = new FormData();
    for (var i = 0; i < files.length; i++) {
      form.append('files', files[i]);
    }
    var res = await fetch(API_BASE + '/api/upload-multiple?folder=' + encodeURIComponent(folder), {
      method: 'POST',
      body: form
    });
    if (!res.ok) throw new Error('Upload error');
    var data = await res.json();
    return data.urls;
  }
};
