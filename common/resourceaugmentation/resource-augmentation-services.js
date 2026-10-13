(function () {
  'use strict';

  function initLazyImages() {
    // Modern browsers handle these images without replacing their source URLs.
    if ('loading' in HTMLImageElement.prototype || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const image = entry.target;
        image.src = image.dataset.resourceLazySrc;
        delete image.dataset.resourceLazySrc;
        observer.unobserve(image);
      });
    }, { rootMargin: '120px 0px' });

    document.querySelectorAll('.onsite-augmentation-image img[loading="lazy"], .vendor-transition-image[loading="lazy"]').forEach(function (image) {
      if (image.complete && image.naturalWidth > 0) return;
      image.dataset.resourceLazySrc = image.src;
      image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      observer.observe(image);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyImages, { once: true });
  } else {
    initLazyImages();
  }
})();
