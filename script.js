// ==================== INICIALIZACAO ====================
document.documentElement.classList.add('js-enabled');

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

menuToggle?.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    menuToggle.textContent = isOpen ? '×' : '☰';
    window.dispatchEvent(new Event('resize'));
});

document.querySelectorAll('.site-nav a').forEach(link => {
    link.addEventListener('click', () => {
        siteNav.classList.remove('is-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        menuToggle?.setAttribute('aria-label', 'Abrir menu');
        if (menuToggle) menuToggle.textContent = '☰';
        window.dispatchEvent(new Event('resize'));
    });
});

// ==================== BOTOES SOCIAIS ARRASTAVEIS ====================
document.querySelectorAll('.social-floaters').forEach(floaters => {
    const whatsappButton = floaters.querySelector('.whatsapp');
    if (whatsappButton) {
        const whatsappIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        whatsappIcon.setAttribute('viewBox', '0 0 24 24');
        whatsappIcon.setAttribute('aria-hidden', 'true');
        whatsappIcon.setAttribute('focusable', 'false');
        const whatsappPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        whatsappPath.setAttribute('d', 'M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z');
        whatsappIcon.append(whatsappPath);
        whatsappButton.replaceChildren(whatsappIcon);
    }

    floaters.querySelectorAll('a').forEach(socialButton => {
        const platform = socialButton.classList.contains('instagram') ? 'instagram' : 'whatsapp';
        const storageKey = `nakine-${platform}-position`;
        const siteHeader = document.querySelector('.site-header');
        socialButton.title = `Segure e arraste para reposicionar ${platform === 'instagram' ? 'o Instagram' : 'o WhatsApp'}`;
        socialButton.draggable = false;

        const clampPosition = (left, top) => {
            const sideMargin = 8;
            const headerBounds = siteHeader?.getBoundingClientRect();
            const navBounds = siteNav?.classList.contains('is-open') ? siteNav.getBoundingClientRect() : null;
            const headerBottom = Math.max(headerBounds?.bottom ?? 0, navBounds?.bottom ?? 0);
            const minimumTop = headerBottom + sideMargin;
            const maximumTop = Math.max(minimumTop, window.innerHeight - socialButton.offsetHeight - sideMargin);

            return {
                left: Math.min(window.innerWidth - socialButton.offsetWidth - sideMargin, Math.max(sideMargin, left)),
                top: Math.min(maximumTop, Math.max(minimumTop, top))
            };
        };
        const applyPosition = (left, top, save = false) => {
            const position = clampPosition(left, top);
            socialButton.classList.add('is-positioned');
            Object.assign(socialButton.style, {
                position: 'fixed',
                left: `${position.left}px`,
                top: `${position.top}px`,
                right: 'auto',
                bottom: 'auto',
                zIndex: '13'
            });
            if (save) {
                try {
                    localStorage.setItem(storageKey, JSON.stringify(position));
                } catch {}
            }
        };

        try {
            const savedPosition = JSON.parse(localStorage.getItem(storageKey));
            if (Number.isFinite(savedPosition?.left) && Number.isFinite(savedPosition?.top)) {
                applyPosition(savedPosition.left, savedPosition.top);
            }
        } catch {}

        let dragStart;
        let suppressNextClick = false;
        socialButton.addEventListener('pointerdown', event => {
            if (!event.isPrimary || event.button !== 0) return;
            suppressNextClick = false;
            const bounds = socialButton.getBoundingClientRect();
            dragStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top, moved: false };
            socialButton.setPointerCapture(event.pointerId);
            socialButton.classList.add('is-dragging');
        });
        socialButton.addEventListener('pointermove', event => {
            if (!dragStart || event.pointerId !== dragStart.pointerId) return;
            const deltaX = event.clientX - dragStart.x;
            const deltaY = event.clientY - dragStart.y;
            if (Math.abs(deltaX) + Math.abs(deltaY) > 5) dragStart.moved = true;
            if (dragStart.moved) {
                event.preventDefault();
                applyPosition(dragStart.left + deltaX, dragStart.top + deltaY);
            }
        });
        socialButton.addEventListener('pointerup', event => {
            if (!dragStart || event.pointerId !== dragStart.pointerId) return;
            if (dragStart.moved) {
                const bounds = socialButton.getBoundingClientRect();
                applyPosition(bounds.left, bounds.top, true);
                suppressNextClick = true;
            }
            dragStart = null;
            socialButton.classList.remove('is-dragging');
        });
        socialButton.addEventListener('pointercancel', () => {
            dragStart = null;
            socialButton.classList.remove('is-dragging');
        });
        socialButton.addEventListener('click', event => {
            if (!suppressNextClick) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            suppressNextClick = false;
        }, true);
        socialButton.addEventListener('keydown', event => {
            const directions = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
            const direction = directions[event.key];
            if (!direction) return;
            event.preventDefault();
            const bounds = socialButton.getBoundingClientRect();
            const step = event.shiftKey ? 40 : 16;
            applyPosition(bounds.left + direction[0] * step, bounds.top + direction[1] * step, true);
        });

        window.addEventListener('resize', () => {
            if (!socialButton.classList.contains('is-positioned')) return;
            const bounds = socialButton.getBoundingClientRect();
            applyPosition(bounds.left, bounds.top, true);
        });
    });
});

// ==================== BOTAO VOLTAR AO TOPO ====================
const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.type = 'button';
backToTop.setAttribute('aria-label', 'Voltar ao topo da página');
backToTop.title = 'Voltar ao topo';
backToTop.textContent = '↑';
document.body.appendChild(backToTop);

const updateBackToTop = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    backToTop.classList.toggle('is-visible', scrollableHeight > 0 && window.scrollY >= scrollableHeight / 2);
};

window.addEventListener('scroll', updateBackToTop, { passive: true });
window.addEventListener('resize', updateBackToTop);
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
updateBackToTop();

// ==================== CARROSSEL PRINCIPAL ====================
const heroCarousel = document.querySelector('[data-hero-carousel]');
if (heroCarousel) {
    const slides = Array.from(heroCarousel.querySelectorAll('.hero-slide'));
    const track = heroCarousel.querySelector('.hero-slides');
    const pagination = heroCarousel.querySelector('.hero-pagination');
    let activeSlide = 0;
    let trackIndex = 1;
    let autoplay;

    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    [firstClone, lastClone].forEach(clone => {
        clone.classList.remove('is-active');
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
    });
    track.prepend(lastClone);
    track.append(firstClone);

    const updateActiveSlide = () => {
        activeSlide = (trackIndex - 1 + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeSlide;
            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', String(!isActive));
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === activeSlide);
            dot.setAttribute('aria-pressed', String(dotIndex === activeSlide));
        });
    };

    const setTrackPosition = animate => {
        if (!animate) track.style.transition = 'none';
        track.style.transform = `translateX(-${trackIndex * 100}%)`;
        if (!animate) requestAnimationFrame(() => { track.style.transition = ''; });
    };

    const dots = slides.map((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-dot';
        dot.setAttribute('aria-label', `Mostrar destaque ${index + 1}`);
        dot.addEventListener('click', () => {
            trackIndex = index + 1;
            updateActiveSlide();
            setTrackPosition(true);
            startAutoplay();
        });
        pagination.appendChild(dot);
        return dot;
    });

    const moveSlide = direction => {
        trackIndex += direction;
        updateActiveSlide();
        setTrackPosition(true);
    };

    const startAutoplay = () => {
        window.clearInterval(autoplay);
        autoplay = window.setInterval(() => moveSlide(1), 5700);
    };

    heroCarousel.querySelector('.hero-arrow-prev').addEventListener('click', () => {
        moveSlide(-1);
        startAutoplay();
    });
    heroCarousel.querySelector('.hero-arrow-next').addEventListener('click', () => {
        moveSlide(1);
        startAutoplay();
    });
    track.addEventListener('transitionend', event => {
        if (event.target !== track || event.propertyName !== 'transform') return;
        if (trackIndex === 0) {
            trackIndex = slides.length;
            setTrackPosition(false);
        } else if (trackIndex === slides.length + 1) {
            trackIndex = 1;
            setTrackPosition(false);
        }
    });
    heroCarousel.addEventListener('mouseenter', () => window.clearInterval(autoplay));
    heroCarousel.addEventListener('mouseleave', startAutoplay);
    heroCarousel.addEventListener('focusin', () => window.clearInterval(autoplay));
    heroCarousel.addEventListener('focusout', startAutoplay);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) window.clearInterval(autoplay);
        else startAutoplay();
    });

    updateActiveSlide();
    setTrackPosition(false);
    startAutoplay();
}

// ==================== CARROSSEIS DE PRODUTOS ====================
document.querySelectorAll('[data-product-carousel]').forEach(carousel => {
    const windowElement = carousel.querySelector('.product-carousel-window');
    const track = carousel.querySelector('.product-carousel-track');
    const cards = Array.from(track.children);
    const previous = carousel.querySelector('.product-carousel-arrow.previous');
    const next = carousel.querySelector('.product-carousel-arrow.next');
    let index = 0;
    let touchStart = 0;

    const visibleCards = () => {
        if (window.matchMedia('(max-width: 620px)').matches) return 2;
        if (window.matchMedia('(max-width: 900px)').matches) return 3;
        return 4;
    };

    const updateCarousel = () => {
        const maxIndex = Math.max(0, cards.length - visibleCards());
        index = Math.min(index, maxIndex);
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const cardWidth = cards[0].getBoundingClientRect().width;
        track.style.transform = `translateX(-${(cardWidth + gap) * index}px)`;
        previous.disabled = maxIndex === 0;
        next.disabled = maxIndex === 0;
    };

    const move = direction => {
        const maxIndex = Math.max(0, cards.length - visibleCards());
        index = (index + direction + maxIndex + 1) % (maxIndex + 1);
        updateCarousel();
    };

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    window.addEventListener('resize', updateCarousel);
    windowElement.addEventListener('touchstart', event => {
        touchStart = event.changedTouches[0].clientX;
    }, { passive: true });
    windowElement.addEventListener('touchend', event => {
        const distance = event.changedTouches[0].clientX - touchStart;
        if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
    }, { passive: true });

    updateCarousel();
});

// ==================== ANIMACAO DE ENTRADA ====================
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: .12 }) : null;

document.querySelectorAll('.reveal').forEach(element => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('is-visible');
});

// ==================== FILTRO DO CATALOGO ====================
const filterButtons = document.querySelectorAll('[data-filter]');
const productCards = document.querySelectorAll('[data-product-category]');
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(item => item.classList.remove('is-active'));
        button.classList.add('is-active');
        const filter = button.dataset.filter;
        productCards.forEach(card => {
            card.hidden = filter !== 'todos' && card.dataset.productCategory !== filter;
        });
    });
});

// ==================== FORMULARIO DE CONTATO ====================
const form = document.querySelector('[data-contact-form]');
const formFeedback = document.querySelector('.form-feedback');
form?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const message = `Olá! Meu nome é ${data.get('nome')}. Gostaria de solicitar um orçamento para ${data.get('interesse')}. ${data.get('mensagem')}`;
    const whatsappUrl = `https://wa.me/554291211496?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    formFeedback.classList.add('is-visible');
    formFeedback.textContent = 'Seu WhatsApp será aberto para concluir o atendimento.';
});
