// =====================================================
// THE HOUSE OF ASTROVASTU - CLEAN FIXED JAVASCRIPT
// =====================================================

window.addEventListener("scroll", () => {
    const hero = document.querySelector(".hero");
    hero.style.height = (100 - window.scrollY/20) + "vh";
  });
  

document.addEventListener('DOMContentLoaded', function () {

    // ================= MOBILE MENU =================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = mobileMenuBtn.querySelector('.menu-icon');
    const closeIcon = mobileMenuBtn.querySelector('.close-icon');

    mobileMenuBtn.addEventListener('click', function () {
        const isOpen = !mobileMenu.classList.contains('hidden');

        if (isOpen) {
            mobileMenu.classList.add('hidden');
            menuIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        } else {
            mobileMenu.classList.remove('hidden');
            menuIcon.classList.add('hidden');
            closeIcon.classList.remove('hidden');
        }
    });

    // Close menu on click
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            menuIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        });
    });

    // ================= SMOOTH SCROLL FIX =================
    // (Avoid interfering with forms)
    document.querySelectorAll('a[href^="#"]:not(.btn)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;

            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const position = target.offsetTop - navbarHeight;

            window.scrollTo({ top: position, behavior: 'smooth' });
        });
    });

    // ================= COUNTER ANIMATION =================

function animateCounters() {
    const counters = document.querySelectorAll(".stat-number");
  
    counters.forEach(counter => {
      const targetText = counter.innerText;
      const number = parseInt(targetText.replace(/\D/g, ""));
      const suffix = targetText.replace(/[0-9]/g, "");
  
      let current = 0;
      const increment = Math.ceil(number / 80);
  
      const update = () => {
        current += increment;
        if (current >= number) {
          counter.innerText = targetText;
        } else {
          counter.innerText = current + suffix;
          requestAnimationFrame(update);
        }
      };
  
      update();
    });
  }
  
  // Trigger only when visible
  const statsSection = document.querySelector(".hero-stats");
  
  if (statsSection) {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateCounters();
        observer.disconnect(); // run only once
      }
    });
  
    observer.observe(statsSection);
  }
  

    // ================= NAVBAR SHADOW =================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.style.boxShadow = window.scrollY > 100 ? "0 4px 20px rgba(0,0,0,0.1)" : "none";
    });

    // ================= SECTION ANIMATION =================
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("animate-visible");
                entry.target.style.opacity = 1;
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".section").forEach(section => {
        section.style.opacity = 0;
        section.style.transform = "translateY(30px)";
        section.style.transition = "0.6s ease";
        observer.observe(section);
    });

    // ================= ACTIVE NAV LINK =================
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a:not(.btn)');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener("scroll", () => {
        let current = "";
        const scrollY = window.scrollY + 150;

        sections.forEach(sec => {
            if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
                current = sec.id;
            }
        });

        navLinks.forEach(link => {
            link.style.color = "";
            if (link.getAttribute("href") === "#" + current) {
                link.style.color = "hsl(38, 80%, 50%)";
            }
        });
    });

    // ================= ABOUT SLIDER =================
    const slides = document.querySelectorAll(".about-slide");
    const dots = document.querySelectorAll(".about-dots .dot");
    const aboutSlider = document.querySelector(".about-slider");
    let currentSlide = 0;
    let paused = false;

    function showSlide(i) {
        slides.forEach(s => s.classList.remove("active"));
        dots.forEach(d => d.classList.remove("active"));
        slides[i].classList.add("active");
        dots[i].classList.add("active");
    }

    dots.forEach((dot, i) => {
        dot.addEventListener("click", () => {
            currentSlide = i;
            showSlide(i);
        });
    });

    setInterval(() => {
        if (!paused) {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }
    }, 7000);

    aboutSlider.addEventListener("mouseenter", () => paused = true);
    aboutSlider.addEventListener("mouseleave", () => paused = false);

    // ================= COUNTRY CODE DETECT (FIXED FOR MULTIPLE FORMS) =================
    async function detectCountry() {
        try {
          const res = await fetch("https://ipapi.co/json/");
          const data = await res.json();
      
          let code = data.country_calling_code;
          if (!code.startsWith("+")) {
            code = "+" + code;
          }
      
          document.querySelectorAll(".countryCode").forEach(e => e.value = code);
      
        } catch (e) {
          console.log("Country detect failed, default +91");
          document.querySelectorAll(".countryCode").forEach(e => e.value = "+91");
        }
      }
      

    detectCountry();

    console.log("AstroVastu JS Loaded Successfully");
});


// ================= LUXURY LOADER + FORM SUBMIT =================
async function sendForm(form) {

    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.innerText = "Sending...";

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    document.getElementById("luxLoader").style.display = "flex";
    document.getElementById("luxText").innerText = "Sending your request...";

    try {
        const res = await fetch("/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        document.getElementById("luxLoader").style.display = "none";

        if (result.status === "success") {
            showToast("✨ Submitted successfully!");
            form.reset();
        } else {
            showToast("❌ Submission failed.");
        }

    } catch (err) {
        console.error(err);
        showToast("⚠️ Server error.");
    }

    btn.disabled = false;
    btn.innerText = "Submit";
}




// Attach Forms
document.getElementById("onlineForm")?.addEventListener("submit", e => {
    e.preventDefault();
    sendForm(e.target);
});

document.getElementById("offlineForm")?.addEventListener("submit", e => {
    e.preventDefault();
    sendForm(e.target);
});


// ================= TOAST =================
function showToast(msg) {
    const toast = document.getElementById("luxToast");
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4000);
}
