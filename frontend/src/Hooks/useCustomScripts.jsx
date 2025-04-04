import { useEffect } from 'react';
import AOS from 'aos';
import Swiper from 'swiper';
import GLightbox from 'glightbox';
import Isotope from 'isotope-layout';
import imagesLoaded from 'imagesloaded';

const useCustomScripts = () => {
    useEffect(() => {
        // Apply .scrolled class to the body as the page is scrolled down
        const toggleScrolled = () => {
            const selectBody = document.querySelector('body');
            const selectHeader = document.querySelector('#header');
            if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
            window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
        };

        const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');
        const mobileNavToogle = () => {
            document.querySelector('body').classList.toggle('mobile-nav-active');
            mobileNavToggleBtn.classList.toggle('bi-list');
            mobileNavToggleBtn.classList.toggle('bi-x');
        };

        // Adding event listeners
        document.addEventListener('scroll', toggleScrolled);
        window.addEventListener('load', toggleScrolled);
        if (mobileNavToggleBtn) {
            mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
        }

        // Hide mobile nav on same-page/hash links
        document.querySelectorAll('#navmenu a').forEach(navmenu => {
            navmenu.addEventListener('click', () => {
                if (document.querySelector('.mobile-nav-active')) {
                    mobileNavToogle();
                }
            });
        });

        // Toggle mobile nav dropdowns
        document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
            navmenu.addEventListener('click', function (e) {
                e.preventDefault();
                this.parentNode.classList.toggle('active');
                this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
                e.stopImmediatePropagation();
            });
        });

        // Preloader
        const preloader = document.querySelector('#preloader');
        if (preloader) {
            window.addEventListener('load', () => {
                preloader.remove();
            });
        }

        // Scroll top button
        let scrollTop = document.querySelector('.scroll-top');
        const toggleScrollTop = () => {
            if (scrollTop) {
                window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
            }
        };
        if (scrollTop) {
            scrollTop.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
            });
        }

        window.addEventListener('load', toggleScrollTop);
        document.addEventListener('scroll', toggleScrollTop);

        // Initialize AOS (Animation on scroll)
        AOS.init({
            duration: 600,
            easing: 'ease-in-out',
            once: true,
            mirror: false,
        });

        // Init swiper sliders
        const initSwiper = () => {
            document.querySelectorAll('.init-swiper').forEach(function (swiperElement) {
                let config = JSON.parse(
                    swiperElement.querySelector('.swiper-config').innerHTML.trim()
                );
                if (swiperElement.classList.contains('swiper-tab')) {
                    initSwiperWithCustomPagination(swiperElement, config);
                } else {
                    new Swiper(swiperElement, config);
                }
            });
        };

        window.addEventListener('load', initSwiper);

        // Initialize GLightbox
        const glightbox = GLightbox({
            selector: '.glightbox',
        });

        // Initialize Isotope layout and filters
        document.querySelectorAll('.isotope-layout').forEach(function (isotopeItem) {
            let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
            let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
            let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

            let initIsotope;
            imagesLoaded(isotopeItem.querySelector('.isotope-container'), function () {
                initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
                    itemSelector: '.isotope-item',
                    layoutMode: layout,
                    filter: filter,
                    sortBy: sort,
                });
            });

            isotopeItem.querySelectorAll('.isotope-filters li').forEach(function (filters) {
                filters.addEventListener('click', function () {
                    isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
                    this.classList.add('filter-active');
                    initIsotope.arrange({
                        filter: this.getAttribute('data-filter'),
                    });
                    AOS.refresh(); // Refresh AOS animations if needed
                }, false);
            });
        });

        // Correct scrolling position upon page load for URLs containing hash links
        window.addEventListener('load', function () {
            if (window.location.hash) {
                if (document.querySelector(window.location.hash)) {
                    setTimeout(() => {
                        let section = document.querySelector(window.location.hash);
                        let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
                        window.scrollTo({
                            top: section.offsetTop - parseInt(scrollMarginTop),
                            behavior: 'smooth',
                        });
                    }, 100);
                }
            }
        });

        // Navmenu Scrollspy
        const navmenulinks = document.querySelectorAll('.navmenu a');

        const navmenuScrollspy = () => {
            navmenulinks.forEach((navmenulink) => {
                if (!navmenulink.hash) return;
                let section = document.querySelector(navmenulink.hash);
                if (!section) return;
                let position = window.scrollY + 200;
                if (position >= section.offsetTop && position <= section.offsetTop + section.offsetHeight) {
                    document.querySelectorAll('.navmenu a.active').forEach((link) => link.classList.remove('active'));
                    navmenulink.classList.add('active');
                } else {
                    navmenulink.classList.remove('active');
                }
            });
        };

        window.addEventListener('load', navmenuScrollspy);
        document.addEventListener('scroll', navmenuScrollspy);

        // Cleanup event listeners on unmount
        return () => {
            document.removeEventListener('scroll', toggleScrolled);
            window.removeEventListener('load', toggleScrolled);
            if (mobileNavToggleBtn) {
                mobileNavToggleBtn.removeEventListener('click', mobileNavToogle);
            }
            scrollTop && scrollTop.removeEventListener('click', toggleScrollTop);
            window.removeEventListener('load', initSwiper);
            window.removeEventListener('load', navmenuScrollspy);
            document.removeEventListener('scroll', navmenuScrollspy);
        };
    }, []);
};

export default useCustomScripts;
