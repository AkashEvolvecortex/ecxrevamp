/* =========================================================
  services page JavaScript

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


    /* ================= DEFER HERO VIDEO ================= */
    (function () {
      const heroVideo = document.querySelector('[data-hero-video]');
      if (!heroVideo) return;

      function loadHeroVideo() {
        if (heroVideo.dataset.heroLoaded === 'true') return;

        heroVideo.querySelectorAll('source[data-lazy-src]').forEach(function (source) {
          source.src = source.getAttribute('data-lazy-src');
          source.removeAttribute('data-lazy-src');
        });

        heroVideo.dataset.heroLoaded = 'true';
        heroVideo.load();
        heroVideo.play().catch(function () { });
      }

      function scheduleHeroVideo() {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadHeroVideo, { timeout: 1800 });
        } else {
          window.setTimeout(loadHeroVideo, 1200);
        }
      }

      if (document.readyState === 'complete') {
        scheduleHeroVideo();
      } else {
        window.addEventListener('load', scheduleHeroVideo, { once: true });
      }
    })();


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

      wireHoverPause('.industry-card', '.industry-video');


      runWhenIdle(function () {

        document.querySelectorAll('video').forEach(function (video) {

          video.muted = true;
          video.setAttribute('muted', '');
          video.setAttribute('playsinline', '');

          playVideoWhenReady(video);

        });

      }, 1800);

    })();



    /* ================= SWIPER ================= */

    function initSwiperSlider(trackId, dotsId, classNames) {

      const track = document.getElementById(trackId);
      const dots = document.getElementById(dotsId);
      const sliderClasses = classNames || {};
      const wrapperClass = sliderClasses.wrapper || 'industries-track';
      const slideClass = sliderClasses.slide || 'industry-card';

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

        wrapperClass: wrapperClass,

        slideClass: slideClass,

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
        'threePillarsTrack',
        'threePillarsDots',
        {
          wrapper: 'three-pillars-track',
          slide: 'pillar-slide'
        }
      );


      initSwiperSlider(
        'otherSolutionsTrack',
        'otherSolutionsDots'
      );

    }, 1600);


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

      // Section not on this page.
      if (!items.length) return;

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

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    function () {
      if (LOAD_HOMEPAGE_TEMPLATE) {
        loadHomepageTemplate();
      } else {
        initHomepage();
      }
    },
    { once: true }
  );
} else {
  if (LOAD_HOMEPAGE_TEMPLATE) {
    loadHomepageTemplate();
  } else {
    initHomepage();
  }
}
