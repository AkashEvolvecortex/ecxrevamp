/* =========================================================
   XEye360 Homepage JavaScript

   IMPORTANT:
   - template.js is NOT loaded by index-staging.html.
   - template.js is loaded dynamically by loadHomepageTemplate().
   - The template is injected only when loadHomepageTemplate()
     is explicitly called.
   - All existing homepage functionality runs AFTER injection.
   ========================================================= */


/* ================= TEMPLATE SCRIPT LOADER ================= */

/**
 * Dynamically load a JavaScript file.
 *
 * This does NOT run until loadHomepageTemplate() is called.
 */

const LOAD_HOMEPAGE_TEMPLATE = false; // Set to true to load the homepage template automatically on DOM ready.

function loadTemplateScript(src) {

  return new Promise(function (resolve, reject) {

    /*
     * template.js has already loaded.
     */
    if (window.homepageTemplate) {
      resolve();
      return;
    }

    /*
     * template.js is already being loaded.
     * Reuse the existing script instead of adding another one.
     */
    const existingScript =
      document.querySelector(
        'script[data-homepage-template]'
      );

    if (existingScript) {

      existingScript.addEventListener(
        'load',
        resolve,
        { once: true }
      );

      existingScript.addEventListener(
        'error',
        reject,
        { once: true }
      );

      return;
    }

    /*
     * Create <script src="template.js"></script>
     * dynamically.
     */
    const script =
      document.createElement('script');

    script.src = src;
    script.async = false;

    script.dataset.homepageTemplate = 'true';

    script.onload = resolve;

    script.onerror = function () {
      reject(
        new Error(
          'Unable to load homepage template: ' + src
        )
      );
    };

    document.head.appendChild(script);

  });

}


function getDefaultTemplateUrl() {

  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="home.js"]');

  if (
    currentScript &&
    currentScript.src
  ) {
    return new URL(
      'template.js',
      currentScript.src
    ).href;
  }

  return './template.js';
}


function runWhenIdle(callback, timeout = 1200) {

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }

  window.setTimeout(callback, Math.min(timeout, 300));
}


/* ================= LOAD + INJECT TEMPLATE ================= */

/**
 * Load template.js and inject its HTML into .homepageecx.
 *
 * NOTHING calls this automatically.
 *
 * Call manually:
 *
 *     loadHomepageTemplate();
 *
 * Or:
 *
 *     loadHomepageTemplate('./template.js');
 */
async function loadHomepageTemplate(
  templateUrl = getDefaultTemplateUrl()
) {

  const homepage =
    document.querySelector('.homepageecx');

  if (!homepage) {

    console.warn(
      'Homepage container ".homepageecx" was not found.'
    );

    return false;
  }

  /*
   * Prevent duplicate injection.
   */
  if (
    homepage.dataset.templateLoaded === 'true'
  ) {
    return true;
  }

  try {

    /*
     * THIS is where template.js is loaded.
     */
    await loadTemplateScript(templateUrl);

    /*
     * template.js must create:
     *
     * window.homepageTemplate = `...`;
     */
    if (
      typeof window.homepageTemplate !== 'string' ||
      !window.homepageTemplate.trim()
    ) {

      console.error(
        'template.js loaded, but window.homepageTemplate was not found.'
      );

      return false;
    }

    const criticalTemplate =
      typeof window.homepageTemplateCritical === 'string'
        ? window.homepageTemplateCritical
        : window.homepageTemplate;

    const deferredTemplate =
      typeof window.homepageTemplateRest === 'string'
        ? window.homepageTemplateRest
        : '';

    /*
     * Inject the first visible sections immediately, then append the
     * lower-page markup when the browser has breathing room.
     */
    // homepage.innerHTML =
    //   criticalTemplate;
    homepage.replaceChildren();

homepage.insertAdjacentHTML(
    'afterbegin',
    criticalTemplate
);

    homepage.dataset.templateLoaded = 'true';

    runWhenIdle(function () {

      if (deferredTemplate) {
        homepage.insertAdjacentHTML(
          'beforeend',
          deferredTemplate
        );
      }

      /*
       * Initialize all existing homepage JS
       * AFTER the full HTML has been injected.
       */
      initHomepage();

    }, 700);

    return true;

  } catch (error) {

    console.error(
      'Homepage template loading failed:',
      error
    );

    return false;
  }

}


/* ================= HOMEPAGE INITIALIZATION ================= */

/*
 * Existing homepage functionality starts here.
 *
 * It is intentionally NOT called automatically.
 */
function initHomepage() {

  function runHomepageScripts() {

    /* =========================================================
       XEye360 Page JavaScript
       Extracted from the WordPress Custom HTML page
       No functional changes
       ========================================================= */


    /* ================= LAZY LOAD ASSETS ================= */
    (function () {
      const lazySelector = 'img[data-lazy-src], video[data-lazy-video], [data-lazy-bg]';
      let observer;

      function playLoadedVideo(video) {
        if (!video.autoplay || document.hidden) return;
        video.play().catch(function () { });
      }

      function loadImage(img) {
        img.addEventListener('load', function () {
          img.classList.add('is-lazy-loaded');
        }, { once: true });

        img.src = img.getAttribute('data-lazy-src');
        img.removeAttribute('data-lazy-src');
      }

      function loadVideo(video) {
        const poster = video.getAttribute('data-lazy-poster');

        if (poster) {
          video.poster = poster;
          video.removeAttribute('data-lazy-poster');
        }

        video.querySelectorAll('source[data-lazy-src]').forEach(function (source) {
          source.src = source.getAttribute('data-lazy-src');
          source.removeAttribute('data-lazy-src');
        });

        video.dataset.lazyLoaded = 'true';
        video.classList.add('is-lazy-loaded');

        video.load();
        playLoadedVideo(video);
      }

      function loadBackground(el) {
        el.style.backgroundImage =
          'url("' + el.getAttribute('data-lazy-bg') + '")';

        el.removeAttribute('data-lazy-bg');
        el.classList.add('is-lazy-loaded');
      }

      function loadLazyAsset(el) {
        if (!el || el.dataset.lazyLoaded === 'true') return;

        if (el.tagName === 'IMG') {
          loadImage(el);
        } else if (el.tagName === 'VIDEO') {
          loadVideo(el);
        } else if (el.hasAttribute('data-lazy-bg')) {
          loadBackground(el);
        }

        el.dataset.lazyLoaded = 'true';
      }

      function observeLazyAssets(root) {
        const scope = root || document;

        const assets = scope.matches && scope.matches(lazySelector)
          ? [scope]
          : Array.from(scope.querySelectorAll(lazySelector));

        assets.forEach(function (asset) {
          if (asset.dataset.lazyLoaded === 'true') return;

          if (observer) {
            observer.observe(asset);
          } else {
            loadLazyAsset(asset);
          }
        });
      }

      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;

            loadLazyAsset(entry.target);
            observer.unobserve(entry.target);
          });
        }, {
          rootMargin: '120px 0px',
          threshold: 0.01
        });
      }

      window.lazyLoadAssets = observeLazyAssets;
      window.loadLazyAsset = loadLazyAsset;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          observeLazyAssets(document);
        }, { once: true });
      } else {
        observeLazyAssets(document);
      }
    })();


    function playVideoWhenReady(video) {
      if (!video) return;

      if (
        video.dataset.lazyVideo !== undefined &&
        video.dataset.lazyLoaded !== 'true'
      ) {
        return;
      }

      video.play().catch(function () { });
    }


    /* ================= HOVER-PAUSE VIDEOS ================= */
    (function () {

      function wireHoverPause(cardSelector, videoSelector) {

        document.addEventListener('mouseover', function (e) {

          const card = e.target.closest(cardSelector);

          if (
            !card ||
            !card.contains(e.target) ||
            card.contains(e.relatedTarget)
          ) {
            return;
          }

          const video = card.querySelector(videoSelector);

          if (!video) return;

          video.pause();
        });


        document.addEventListener('mouseout', function (e) {

          const card = e.target.closest(cardSelector);

          if (
            !card ||
            !card.contains(e.target) ||
            card.contains(e.relatedTarget)
          ) {
            return;
          }

          const video = card.querySelector(videoSelector);

          if (!video) return;

          playVideoWhenReady(video);
        });

      }

      wireHoverPause('.pillar-card', '.pillar-video');
      wireHoverPause('.industry-card', '.industry-video');
      wireHoverPause('.xsecure-card', '.xsecure-video');


      runWhenIdle(function () {

        document.querySelectorAll('video').forEach(function (video) {

          video.muted = true;
          video.setAttribute('muted', '');
          video.setAttribute('playsinline', '');

          playVideoWhenReady(video);

        });

      }, 1800);

    })();


    /* ================= COMPARE SLIDER ================= */
    (function () {

      const wrap = document.getElementById('compareImgs');
      const overlay = document.getElementById('compareOverlay');
      const handle = document.getElementById('compareHandle');

      if (!wrap || !overlay || !handle) return;

      const overlayInner = overlay.querySelector('.compare-overlay-inner');
      const vaiBadge = wrap.querySelector('.compare-badge.vai');

      if (!overlayInner) return;

      let dragging = false;


      function syncInnerWidth() {
        overlayInner.style.width = wrap.offsetWidth + 'px';
      }

      syncInnerWidth();

      window.addEventListener('resize', syncInnerWidth);


      function setPosition(clientX) {

        const rect = wrap.getBoundingClientRect();

        let pct = ((clientX - rect.left) / rect.width) * 100;

        pct = Math.max(0, Math.min(100, pct));

        overlay.style.width = pct + '%';
        handle.style.left = pct + '%';

        if (vaiBadge) {
          const badgeRect = vaiBadge.getBoundingClientRect();
          const handleX = rect.left + (rect.width * pct / 100);

          vaiBadge.classList.toggle(
            'is-hidden',
            handleX >= badgeRect.left
          );
        }
      }


      function startDrag(e) {
        dragging = true;
        wrap.style.cursor = 'ew-resize';
      }


      function stopDrag() {
        dragging = false;
        wrap.style.cursor = '';
      }


      function onMove(e) {

        if (!dragging) return;

        const clientX = e.touches
          ? e.touches[0].clientX
          : e.clientX;

        setPosition(clientX);
      }


      handle.addEventListener('mousedown', startDrag);

      handle.addEventListener(
        'touchstart',
        startDrag,
        { passive: true }
      );


      wrap.addEventListener(
        'mousedown',
        function (e) {
          startDrag(e);
          setPosition(e.clientX);
        }
      );


      wrap.addEventListener(
        'touchstart',
        function (e) {
          startDrag(e);
          setPosition(e.touches[0].clientX);
        },
        { passive: true }
      );


      window.addEventListener('mousemove', onMove);

      window.addEventListener(
        'touchmove',
        onMove,
        { passive: true }
      );


      window.addEventListener('mouseup', stopDrag);

      window.addEventListener('touchend', stopDrag);

      window.addEventListener('touchcancel', stopDrag);

      window.addEventListener('blur', stopDrag);

    })();


    /* ================= SWIPER ================= */

    function initSwiperSlider(trackId, dotsId) {

      const track = document.getElementById(trackId);
      const dots = document.getElementById(dotsId);

      if (
        !track ||
        !dots ||
        typeof Swiper === 'undefined'
      ) {
        return;
      }


      const slider = track.parentElement;

      slider.classList.add('swiper');

      track.classList.add('swiper-wrapper');

      Array.from(track.children).forEach(card =>
        card.classList.add('swiper-slide')
      );


      return new Swiper(slider, {

        wrapperClass: 'industries-track',

        slideClass: 'industry-card',

        loop: true,

        speed: 650,

        grabCursor: true,

        watchOverflow: true,

        keyboard: {
          enabled: true
        },

        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },

        pagination: {
          el: dots,
          clickable: true,
          bulletClass: 'dot-btn',
          bulletActiveClass: 'active'
        },

        breakpoints: {

          0: {
            slidesPerView: 1,
            spaceBetween: 15
          },

          576: {
            slidesPerView: 2,
            spaceBetween: 15
          },

          992: {
            slidesPerView: 4,
            spaceBetween: 15
          }

        },

        on: {

          init(swiper) {

            if (window.lazyLoadAssets) {
              window.lazyLoadAssets(swiper.el);
            }

            swiper.el.querySelectorAll('video').forEach(video => {

              video.muted = true;

              video.setAttribute('muted', '');

              video.setAttribute('playsinline', '');

              playVideoWhenReady(video);

            });

          }

        }

      });

    }


    runWhenIdle(function () {

      initSwiperSlider(
        'industriesTrack',
        'industriesDots'
      );


      initSwiperSlider(
        'otherSolutionsTrack',
        'otherSolutionsDots'
      );

    }, 1600);


    /* ================= DETECT / DECIDE / RESPOND CARDS ================= */

    (function () {

      function initStepFlow() {

        const flow = document.querySelector(".step-flow");

        if (
          !flow ||
          flow.dataset.ready === "true"
        ) {
          return;
        }

        flow.dataset.ready = "true";


        const cards =
          Array.from(
            flow.querySelectorAll(".step-item")
          );


        const arrows =
          Array.from(
            flow.querySelectorAll(".step-arrow")
          );


        const flowSteps = [

          {
            element: cards[0],
            duration: 1500
          },

          {
            element: arrows[0],
            duration: 1200
          },

          {
            element: cards[1],
            duration: 1500
          },

          {
            element: arrows[1],
            duration: 1200
          },

          {
            element: cards[2],
            duration: 1500
          }

        ].filter(step => step.element);


        if (!flowSteps.length) return;


        let current = 0;

        let flowTimer;

        let running = false;


        function clearFlowActive() {

          cards.forEach(card =>
            card.classList.remove("active")
          );

          arrows.forEach(arrow =>
            arrow.classList.remove("active")
          );

        }


        function setFirstStep() {

          clearFlowActive();

          cards[0].classList.add("active");

        }


        function playFlow() {

          if (!running) return;

          clearFlowActive();

          const step =
            flowSteps[current];

          step.element.classList.add("active");


          flowTimer =
            window.setTimeout(() => {

              current =
                (current + 1) %
                flowSteps.length;

              playFlow();

            }, step.duration);

        }


        function startFlow() {

          window.clearTimeout(flowTimer);

          current = 0;

          running = true;

          playFlow();

        }


        function stopFlow() {

          running = false;

          window.clearTimeout(flowTimer);

          setFirstStep();

        }


        setFirstStep();


        if ("IntersectionObserver" in window) {

          const section =
            flow.closest(".step-flow-section") ||
            flow;


          const observer =
            new IntersectionObserver(
              entries => {

                if (entries[0].isIntersecting) {

                  startFlow();

                } else {

                  stopFlow();

                }

              },
              {
                threshold: 0.35
              }
            );


          observer.observe(section);

        } else {

          startFlow();

        }


        document.addEventListener(
          "visibilitychange",
          () => {

            if (document.hidden) {

              stopFlow();

            } else {

              startFlow();

            }

          }
        );

      }


      if (document.readyState === "loading") {

        document.addEventListener(
          "DOMContentLoaded",
          initStepFlow,
          { once: true }
        );

      } else {

        initStepFlow();

      }

    })();


    /* ================= VIDEO MODAL ================= */

    const modalElement =
      document.getElementById('xeyeModal');

    const iframe =
      document.getElementById('youtubeIframe');

    if (modalElement && iframe) {

      // Auto-play when modal opens
      modalElement.addEventListener(
        'show.bs.modal',
        function () {

          iframe.src =
            iframe.getAttribute('data-src');

        }
      );


      // Stop and clear when modal closes
      modalElement.addEventListener(
        'hidden.bs.modal',
        function () {

          iframe.src = '';

        }
      );

    }


    /* ================= OTHER SOLUTIONS ================= */

    const bars =
      document.getElementById('bars');

    const items =
      Array.from(
        document.querySelectorAll('.acc-item')
      );

    let activeIndex = 0;


    const GAP = 10;


    function isMobile() {

      return window.matchMedia(
        '(max-width: 900px)'
      ).matches;

    }


    // Compute exact pixel widths (or heights on mobile) ourselves,
    // then set them as plain inline styles. Animating a single plain
    // "width"/"height" value is smooth and consistent across browsers,
    // unlike animating the compound "flex" shorthand.
    function layout() {

      // Section not on this page.
      if (!bars || !items.length) return;

      const mobile = isMobile();

      const collapsed =
        mobile ? 64 : 92;

      const n =
        items.length;

      const totalGap =
        GAP * (n - 1);


      if (mobile) {

        const MOBILE_ACTIVE_HEIGHT = 360;


        items.forEach((item, i) => {

          item.style.width = '100%';

          item.style.height =
            (
              i === activeIndex
                ? MOBILE_ACTIVE_HEIGHT
                : collapsed
            ) + 'px';

        });


      } else {

        const containerWidth =
          bars.getBoundingClientRect().width;

        const remaining =
          containerWidth -
          collapsed * (n - 1) -
          totalGap;


        items.forEach((item, i) => {

          item.style.height = '100%';

          item.style.width =
            (
              i === activeIndex
                ? remaining
                : collapsed
            ) + 'px';

        });

      }

    }


    const AUTOPLAY_MS = 3000;

    let autoplayTimer = null;


    function goTo(index) {

      if (activeIndex === index) return;

      activeIndex = index;


      items.forEach(
        (el, idx) =>
          el.classList.toggle(
            'active',
            idx === activeIndex
          )
      );


      layout();

    }


    function next() {

      goTo(
        (activeIndex + 1) %
        items.length
      );

    }


    function startAutoplay() {

      clearInterval(autoplayTimer);

      autoplayTimer =
        setInterval(
          next,
          AUTOPLAY_MS
        );

    }


    function stopAutoplay() {

      clearInterval(autoplayTimer);

    }


    startAutoplay();


    items.forEach((item, i) => {

      item.addEventListener(
        'mouseenter',
        () => {

          stopAutoplay();

          goTo(i);

        }
      );


      item.addEventListener(
        'mouseleave',
        startAutoplay
      );

    });


    window.addEventListener(
      'resize',
      layout
    );


    window.addEventListener(
      'load',
      layout
    );


    layout();


    /* ================= SERVICE CARD ================= */

    const cards =
      document.querySelectorAll(
        ".service-card"
      );


    /*
      Hover/focus interaction:
      the selected section expands and reveals its own image and content.
    */

    cards.forEach((card) => {

      card.addEventListener(
        "mouseenter",
        () => {

          cards.forEach(
            (item) =>
              item.classList.remove(
                "expanded"
              )
          );

          card.classList.add(
            "expanded"
          );

        }
      );


      card.addEventListener(
        "focusin",
        () => {

          cards.forEach(
            (item) =>
              item.classList.remove(
                "expanded"
              )
          );

          card.classList.add(
            "expanded"
          );

        }
      );

    });


    /* Keep the first section open initially. */
    // cards[0].classList.add("expanded");


    /* ================= LUCIDE ================= */

    function createLucideIcons() {
      if (
        window.lucide &&
        typeof window.lucide.createIcons === 'function'
      ) {
        window.lucide.createIcons();
        return true;
      }

      return false;
    }

    if (!createLucideIcons()) {
      window.addEventListener(
        'load',
        createLucideIcons,
        { once: true }
      );
    }
  }

  runHomepageScripts();

}


/* =========================================================
   MANUAL CONTROL
   =========================================================

   The homepage is loaded automatically on DOM ready.

   To load the homepage, call:

       loadHomepageTemplate();

   If template.js is in another location:

       loadHomepageTemplate('./js/template.js');

   ========================================================= */

/* =========================================================
   REUSABLE SECTIONS (INCLUDES)
   =========================================================

   Any page can pull sections out of common.html by name:

       <div data-include="faq"></div>
       <div data-include="hero video-modal"></div>   (several at once)

   Each name matches a data-section="..." attribute in common.html.
   The placeholder is replaced by the section, then initHomepage()
   runs once so sliders, accordions, icons, etc. work.

   common.html is found next to this script. To use another file:

       <div data-include="faq" data-include-src="/path/common.html"></div>

   NOTE: uses fetch(), so open pages through a web server
   (e.g. VS Code Live Server), not by double-clicking (file://).
   ========================================================= */

const COMMON_HTML_URL = (function () {

  const script =
    document.currentScript ||
    document.querySelector('script[src*="common.js"]');

  return script && script.src
    ? new URL('common.html', script.src).href
    : './common/common.html';

})();

const commonHtmlCache = {};

function fetchCommonDoc(url) {

  if (!commonHtmlCache[url]) {

    commonHtmlCache[url] = fetch(url)
      .then(function (response) {

        if (!response.ok) {
          throw new Error(response.status + ' ' + url);
        }

        return response.text();
      })
      .then(function (html) {
        return new DOMParser().parseFromString(html, 'text/html');
      });
  }

  return commonHtmlCache[url];
}

/*
 * Hero background image, chosen on the placeholder:
 *
 *   <div data-include="hero" data-bg-image="banner.webp" data-bg-alt="..."></div>
 *
 * No data-bg-image -> keeps the default image from common.html.
 */
function applyHeroImage(section, options) {

  const image = section.querySelector('[data-hero-image]');

  if (!image) return;

  if (options.bgImage) {
    image.src = options.bgImage;
  }

  if (options.bgAlt) {
    image.alt = options.bgAlt;
  }
}

async function loadCommonSections(root = document) {

  const placeholders =
    Array.from(root.querySelectorAll('[data-include]'));

  await Promise.all(placeholders.map(async function (placeholder) {

    const url = placeholder.dataset.includeSrc
      ? new URL(placeholder.dataset.includeSrc, document.baseURI).href
      : COMMON_HTML_URL;

    const names =
      placeholder.dataset.include.trim().split(/\s+/);

    try {

      const doc = await fetchCommonDoc(url);

      const nodes = names.map(function (name) {

        const section =
          doc.querySelector('[data-section="' + name + '"]');

        if (!section) {
          console.warn('Common section "' + name + '" not found in ' + url);
          return null;
        }

        /*
         * Set the image on a copy inside the parsed (inactive)
         * document first, so only the final image is downloaded.
         */
        const copy = section.cloneNode(true);

        applyHeroImage(copy, placeholder.dataset);

        return document.importNode(copy, true);

      }).filter(Boolean);

      /*
       * Page-specific content: HTML written inside the placeholder
       * replaces the section's [data-slot] element.
       */
      if (placeholder.children.length) {

        const slot = nodes
          .map(function (node) { return node.querySelector('[data-slot]'); })
          .find(Boolean);

        if (slot) {
          slot.replaceChildren(...placeholder.childNodes);
        }
      }

      placeholder.replaceWith(...nodes);

    } catch (error) {

      console.error('Could not load common sections:', error);
      placeholder.remove();

    }

  }));
}

function bootCommon() {

  if (LOAD_HOMEPAGE_TEMPLATE) {
    loadHomepageTemplate();
    return;
  }

  if (document.querySelector('[data-include]')) {
    loadCommonSections().then(initHomepage);
    return;
  }

  initHomepage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootCommon, { once: true });
} else {
  bootCommon();
}