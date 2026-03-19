// Soluty Graf - Premium Scripts
(function () {
  'use strict';

  // ========================================
  // HEADER - scroll effect
  // ========================================
  const header = document.getElementById('header');
  let lastScroll = 0;

  function handleScroll() {
    const scrollY = window.scrollY;
    header.classList.toggle('scrolled', scrollY > 60);
    lastScroll = scrollY;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ========================================
  // MOBILE MENU
  // ========================================
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const navBackdrop = document.getElementById('navBackdrop');

  function openMenu() {
    menuToggle.classList.add('active');
    nav.classList.add('open');
    navBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuToggle.classList.remove('active');
    nav.classList.remove('open');
    navBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', function () {
    nav.classList.contains('open') ? closeMenu() : openMenu();
  });

  navBackdrop.addEventListener('click', closeMenu);

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // ========================================
  // ACTIVE NAV LINK on scroll
  // ========================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;

    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ========================================
  // SCROLL ANIMATIONS (Intersection Observer)
  // ========================================
  function initAnimations() {
    var animElements = document.querySelectorAll('[data-anim]');

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );

      animElements.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      animElements.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  }

  initAnimations();

  // ========================================
  // COUNTER ANIMATION for stats
  // ========================================
  var counters = document.querySelectorAll('[data-count]');
  var counterDone = new Set();

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var duration = 2000;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !counterDone.has(entry.target)) {
            counterDone.add(entry.target);
            animateCounter(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  // ========================================
  // SMOOTH PARALLAX on hero (subtle)
  // ========================================
  var heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        heroBg.style.transform = 'scale(1.05) translateY(' + scrollY * 0.15 + 'px)';
      }
    }, { passive: true });
  }

  // ========================================
  // LOCAL API - Load dynamic data
  // ========================================
  if (typeof api !== 'undefined') {
    loadSiteData();
  }

  async function loadSiteData() {
    try {
      await Promise.all([loadSiteSettings(), loadAmbientes(), loadReviews()]);
    } catch (err) {
      console.error('Error loading site data:', err);
    }
  }

  // Load site settings
  async function loadSiteSettings() {
    try {
      var data = await api.get('/api/settings');
      if (!data) return;

      // Logo
      var logo = document.getElementById('siteLogo');
      if (logo && data.logo_url) {
        logo.src = data.logo_url;
        logo.style.display = '';
      }

      // Footer logo
      var footerLogoImg = document.getElementById('footerLogoImg');
      if (footerLogoImg && data.logo_url) {
        footerLogoImg.src = data.logo_url;
        footerLogoImg.style.display = '';
      }

      // Hero image
      if (data.hero_image_url) {
        var heroImg = document.getElementById('heroImg');
        if (heroImg) heroImg.src = data.hero_image_url;
        var ctaBg = document.getElementById('ctaBg');
        if (ctaBg) ctaBg.src = data.hero_image_url;
      }

      // About image
      if (data.about_image_url) {
        var aboutImg = document.getElementById('aboutImg');
        if (aboutImg) aboutImg.src = data.about_image_url;
      }

      // WhatsApp - adiciona 55 se não tiver código do país
      var waNumber = '';
      if (data.whatsapp) {
        waNumber = data.whatsapp.replace(/\D/g, '');
        if (waNumber.length <= 11) waNumber = '55' + waNumber;
        var waUrl = 'https://wa.me/' + waNumber;
        var navWa = document.getElementById('navWhatsapp');
        if (navWa) { navWa.href = waUrl; navWa.style.display = ''; }
        var floatWa = document.getElementById('whatsappFloat');
        if (floatWa) { floatWa.href = waUrl; floatWa.style.display = ''; }
      }

      // Format phone for display
      var formattedPhone = '';
      if (data.whatsapp) {
        var w = data.whatsapp.replace(/\D/g, '');
        if (w.length === 13) {
          formattedPhone = '(' + w.slice(2,4) + ') ' + w.slice(4,5) + ' ' + w.slice(5,9) + '-' + w.slice(9);
        } else if (w.length === 11) {
          formattedPhone = '(' + w.slice(0,2) + ') ' + w.slice(2,3) + ' ' + w.slice(3,7) + '-' + w.slice(7);
        } else if (w.length === 10) {
          formattedPhone = '(' + w.slice(0,2) + ') ' + w.slice(2,6) + '-' + w.slice(6);
        } else {
          formattedPhone = data.whatsapp;
        }
      }

      // Format landline for display: (XX) XXXX-XXXX
      var formattedFixo = '';
      if (data.telefone_fixo) {
        var f = data.telefone_fixo.replace(/\D/g, '');
        if (f.length === 10) {
          formattedFixo = '(' + f.slice(0,2) + ') ' + f.slice(2,6) + '-' + f.slice(6);
        } else if (f.length === 12) {
          formattedFixo = '(' + f.slice(2,4) + ') ' + f.slice(4,8) + '-' + f.slice(8);
        } else {
          formattedFixo = data.telefone_fixo;
        }
      }

      // Nota do Google
      var notaEl = document.getElementById('statNotaGoogle');
      if (notaEl && data.nota_google) {
        notaEl.textContent = data.nota_google;
      }

      // Build contato grid dynamically
      var contatoGrid = document.getElementById('contatoGrid');
      if (contatoGrid) {
        contatoGrid.innerHTML = '';

        if (data.telefone_fixo || data.whatsapp) {
          var phoneLines = '';
          if (formattedFixo) phoneLines += formattedFixo;
          if (formattedFixo && formattedPhone) phoneLines += '<br>';
          if (formattedPhone) phoneLines += formattedPhone;
          var phoneHref = data.whatsapp ? 'https://wa.me/' + waNumber : (data.telefone_fixo ? 'tel:' + data.telefone_fixo.replace(/\D/g, '') : '#');
          var phoneTag = data.whatsapp ? 'a' : 'div';
          var phoneTarget = data.whatsapp ? ' target="_blank"' : '';
          contatoGrid.innerHTML +=
            '<' + phoneTag + ' href="' + phoneHref + '"' + phoneTarget + ' class="contato-item" data-anim>' +
              '<div class="contato-icone"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg></div>' +
              '<h3>Telefone</h3><p>' + phoneLines + '</p>' +
            '</' + phoneTag + '>';
        }

        if (data.email) {
          contatoGrid.innerHTML +=
            '<a href="mailto:' + data.email + '" class="contato-item" data-anim>' +
              '<div class="contato-icone"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>' +
              '<h3>E-mail</h3><p>' + data.email + '</p>' +
            '</a>';
        }

        if (data.endereco_rua) {
          var endFull = data.endereco_rua + ', ' + (data.endereco_numero || '') + ', ' + (data.endereco_bairro || '') + ', ' + (data.endereco_cidade || '') + ' - ' + (data.endereco_estado || '') + ', ' + (data.endereco_cep || '');
          var endDisplay = data.endereco_rua + ', ' + (data.endereco_numero || '') +
            (data.endereco_bairro ? '<br>' + data.endereco_bairro : '') +
            (data.endereco_cidade ? '<br>' + data.endereco_cidade + (data.endereco_estado ? ' - ' + data.endereco_estado : '') : '') +
            (data.endereco_cep ? '<br>' + data.endereco_cep : '');
          contatoGrid.innerHTML +=
            '<a href="https://www.google.com/maps/search/' + encodeURIComponent(endFull) + '" target="_blank" class="contato-item" data-anim>' +
              '<div class="contato-icone"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>' +
              '<h3>Endereço</h3><p>' + endDisplay + '</p>' +
            '</a>';
        }

        if (data.horario_funcionamento) {
          contatoGrid.innerHTML +=
            '<div class="contato-item" data-anim>' +
              '<div class="contato-icone"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>' +
              '<h3>Horário</h3><p>' + data.horario_funcionamento + '</p>' +
            '</div>';
        }
      }

      // Build footer social dynamically
      var footerSocial = document.getElementById('footerSocial');
      if (footerSocial) {
        footerSocial.innerHTML = '';

        if (data.instagram) {
          footerSocial.innerHTML +=
            '<a href="' + data.instagram + '" target="_blank" aria-label="Instagram" class="social-icon">' +
              '<span class="social-icon-inner"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></span>' +
            '</a>';
        }

        if (data.facebook) {
          footerSocial.innerHTML +=
            '<a href="' + data.facebook + '" target="_blank" aria-label="Facebook" class="social-icon">' +
              '<span class="social-icon-inner"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></span>' +
            '</a>';
        }

        if (data.whatsapp) {
          footerSocial.innerHTML +=
            '<a href="https://wa.me/' + data.whatsapp + '" target="_blank" aria-label="WhatsApp" class="social-icon">' +
              '<span class="social-icon-inner"><svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.93 15.93 0 0016.004 32C24.826 32 32 24.826 32 16.004S24.826 0 16.004 0zm9.316 22.594c-.39 1.1-1.932 2.014-3.17 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.826-6.81-8.064-7.124-.23-.314-1.932-2.572-1.932-4.904s1.224-3.476 1.658-3.952c.434-.476.948-.596 1.264-.596.314 0 .63.002.904.016.29.016.68-.11 1.064.812.39.948 1.328 3.238 1.444 3.472.116.234.194.506.038.82-.156.314-.234.508-.468.782-.234.274-.492.612-.702.822-.234.234-.478.488-.206.96s1.214 2.004 2.606 3.248c1.79 1.598 3.298 2.094 3.77 2.328.47.234.746.196 1.02-.118.274-.314 1.178-1.374 1.492-1.846.314-.476.63-.39 1.064-.234.434.156 2.762 1.302 3.234 1.538.476.234.79.352.906.548.116.196.116 1.138-.274 2.236z"/></svg></span>' +
            '</a>';
        }

        if (data.tiktok) {
          footerSocial.innerHTML +=
            '<a href="' + data.tiktok + '" target="_blank" aria-label="TikTok" class="social-icon">' +
              '<span class="social-icon-inner"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg></span>' +
            '</a>';
        }
      }

      // Build footer contato dynamically
      var footerContato = document.getElementById('footerContato');
      if (footerContato) {
        var footerContatoHtml = '<h4>Contato</h4>';
        if (formattedFixo) {
          footerContatoHtml += '<p>' + formattedFixo + '</p>';
        }
        if (data.whatsapp) {
          footerContatoHtml += '<a href="https://wa.me/' + data.whatsapp + '" target="_blank">' + formattedPhone + '</a>';
        }
        if (data.email) {
          footerContatoHtml += '<a href="mailto:' + data.email + '">' + data.email + '</a>';
        }
        if (data.endereco_rua) {
          var footerEndFull = data.endereco_rua + ', ' + (data.endereco_numero || '') + ', ' + (data.endereco_bairro || '') + ', ' + (data.endereco_cidade || '') + ' - ' + (data.endereco_estado || '');
          var footerEndDisplay = data.endereco_rua + ', ' + (data.endereco_numero || '') +
            (data.endereco_bairro ? '<br>' + data.endereco_bairro : '') +
            (data.endereco_cidade ? '<br>' + data.endereco_cidade + (data.endereco_estado ? ' - ' + data.endereco_estado : '') : '');
          footerContatoHtml += '<a href="https://www.google.com/maps/search/' + encodeURIComponent(footerEndFull) + '" target="_blank">' + footerEndDisplay + '</a>';
        }
        footerContato.innerHTML = footerContatoHtml;
      }

    } catch (err) {
      console.error('Settings load error:', err);
    }
  }

  // Load environments for gallery
  async function loadAmbientes() {
    try {
      var data = await api.get('/api/environments?show_on_home=true&limit=6');
      var allData = await api.get('/api/environments?show_on_home=true');
      var totalCount = allData.length;

      var galeria = document.getElementById('galeriaAmbientes');
      if (!galeria) return;

      if (!data || data.length === 0) {
        galeria.innerHTML = '<p style="text-align:center;color:var(--gray-500);grid-column:1/-1;padding:40px 0">Em breve nossos trabalhos.</p>';
        return;
      }

      // Build footer services from environments
      var footerServicos = document.getElementById('footerServicos');
      if (footerServicos) {
        var servicosHtml = '<h4>Serviços</h4>';
        data.forEach(function (env) {
          servicosHtml += '<a href="/ambiente/' + (env.slug || env.id) + '/">' + env.name + '</a>';
        });
        footerServicos.innerHTML = servicosHtml;
      }

      galeria.innerHTML = '';
      data.forEach(function (env, index) {
        var card = document.createElement('a');
        card.href = '/ambiente/' + (env.slug || env.id) + '/';
        card.className = 'card';
        card.setAttribute('data-anim', '');
        if (index > 0) card.style.transitionDelay = (index * 0.15) + 's';

        card.innerHTML =
          '<div class="card-img">' +
            '<img src="' + (env.cover_image_url || '') + '" alt="' + env.name + '">' +
            '<div class="card-overlay">' +
              '<div class="card-overlay-content">' +
                '<span class="card-category">' + env.name + '</span>' +
                '<span class="card-overlay-btn">Ver Fotos</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="card-info">' +
            '<h3>' + env.name + '</h3>' +
            '<p>' + (env.description || 'Serviço gráfico profissional') + '</p>' +
          '</div>';

        galeria.appendChild(card);
      });

      // Show "Ver Todos" button if more than 6
      if (totalCount > 6) {
        var btnWrap = document.createElement('div');
        btnWrap.style.cssText = 'text-align:center;grid-column:1/-1;margin-top:20px';
        btnWrap.innerHTML = '<a href="ambientes.html" class="btn btn-primario"><span>Ver Todos os Serviços</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>';
        galeria.appendChild(btnWrap);
      }

      // Re-init animations for new elements
      initAnimations();
    } catch (err) {
      console.error('Ambientes load error:', err);
    }
  }

  // Load Reviews (Elfsight widget)
  async function loadReviews() {
    try {
      var settings = await api.get('/api/settings');
      if (!settings || !settings.google_reviews_enabled || !settings.elfsight_code) return;

      var section = document.querySelector('.avaliacoes');
      if (section) section.style.display = '';

      var widget = document.getElementById('avaliacoesWidget');
      if (widget) {
        widget.innerHTML = settings.elfsight_code;
        var scripts = widget.querySelectorAll('script');
        scripts.forEach(function (oldScript) {
          var newScript = document.createElement('script');
          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }
          oldScript.parentNode.replaceChild(newScript, oldScript);
        });
      }
    } catch (err) {
      console.error('Reviews load error:', err);
    }
  }
})();
