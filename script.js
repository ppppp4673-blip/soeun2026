/**
 * 📖 Book Portfolio — Page Flip Controller + Interactions
 * 마우스 휠 / 클릭 / 키보드 / 터치로 페이지 전환
 * 페이지 열릴 때 애니메이션 트리거
 */

(function () {
  "use strict";

  /* ========================================
     Constants
  ======================================== */
  const TOTAL_PAGES = 8;
  const TOTAL_LEAVES = 4;
  const ANIMATION_DURATION = 1200;
  const WHEEL_THRESHOLD = 50;

  /* ========================================
     State
  ======================================== */
  let current_page = 0;
  let is_animating = false;
  let wheel_accumulator = 0;
  let touch_start_x = 0;
  let touch_start_y = 0;

  /* ========================================
     DOM
  ======================================== */
  const pages = document.querySelectorAll(".page");
  const dots = document.querySelectorAll(".page_indicators .dot");
  const prev_btn = document.querySelector(".nav_btn.prev");
  const next_btn = document.querySelector(".nav_btn.next");
  const scroll_hint = document.querySelector(".scroll_hint");

  /* ========================================
     TEXT SPLIT — data-split 속성 가진 요소 처리
  ======================================== */
  function init_text_split() {
    document.querySelectorAll("[data-split]").forEach((el) => {
      const text = el.textContent;
      const delay_base = parseInt(el.dataset.delay) || 0;
      el.textContent = "";
      el.setAttribute("aria-label", text);

      [...text].forEach((char, i) => {
        const span = document.createElement("span");
        span.className = "split_char";
        span.textContent = char === " " ? "\u00A0" : char;
        span.style.transitionDelay = (delay_base + i * 50) + "ms";
        el.appendChild(span);
      });
    });
  }

  /* ========================================
     PAGE VISIBILITY — 어떤 면이 보이는지 계산
  ======================================== */

  /**
   * current_page (0~8) 로부터 보이는 면(face) 인덱스 반환
   * 0 → leaf0 front (page 1)
   * 2 → leaf1 front (page 3)
   * etc.
   *
   * 현재 보이는 면:
   *   - 왼쪽: 직전에 flip된 leaf의 back face
   *   - 오른쪽: 아직 flip 안된 첫 leaf의 front face
   */
  function get_visible_faces() {
    const faces = [];
    const flipped_count = current_page / 2;

    // 왼쪽: 마지막으로 flip된 leaf의 back
    if (flipped_count > 0) {
      const leaf_idx = flipped_count - 1;
      const back_face = pages[leaf_idx].querySelector(".page_back");
      if (back_face) faces.push(back_face);
    }

    // 오른쪽: flip 안된 첫 leaf의 front
    if (flipped_count < TOTAL_LEAVES) {
      const leaf_idx = flipped_count;
      const front_face = pages[leaf_idx].querySelector(".page_front");
      if (front_face) faces.push(front_face);
    }

    return faces;
  }

  function get_all_faces() {
    const faces = [];
    pages.forEach((page) => {
      const front = page.querySelector(".page_front");
      const back = page.querySelector(".page_back");
      if (front) faces.push(front);
      if (back) faces.push(back);
    });
    return faces;
  }

  /* ========================================
     ANIMATION TRIGGER
  ======================================== */

  function activate_animations(face) {
    // 일반 anim 클래스들
    const anim_selectors = ".anim, .anim_fade, .anim_left, .anim_right, .anim_pop, .anim_scale, .anim_bounce, .anim_line";
    face.querySelectorAll(anim_selectors).forEach((el) => {
      const delay = parseInt(el.dataset.delay) || 0;
      setTimeout(() => el.classList.add("active"), delay);
    });

    // 스플릿 글자
    face.querySelectorAll("[data-split]").forEach((el) => {
      el.querySelectorAll(".split_char").forEach((span) => {
        // transitionDelay가 이미 설정되어 있으므로 한번에 active 추가
        setTimeout(() => span.classList.add("active"), 100);
      });
    });

    // 스킬 프로그레스 바 채우기
    face.querySelectorAll(".skill_fill").forEach((bar) => {
      const target_width = bar.dataset.width;
      if (target_width) {
        const delay = parseInt(bar.closest(".skill_item")?.dataset.delay) || 400;
        setTimeout(() => {
          bar.style.width = target_width + "%";
        }, delay);
      }
    });

    // 스킬 퍼센트 카운트업
    face.querySelectorAll(".skill_percent").forEach((el) => {
      const target = parseInt(el.dataset.target) || 0;
      const delay = parseInt(el.closest(".skill_item")?.dataset.delay) || 400;
      setTimeout(() => count_up(el, 0, target, 1000), delay);
    });

    // 타임라인 아이템 글로우
    face.querySelectorAll(".timeline_item").forEach((item) => {
      const delay = parseInt(item.dataset.delay) || 0;
      setTimeout(() => item.classList.add("active"), delay);
    });
  }

  function deactivate_animations(face) {
    const anim_selectors = ".anim, .anim_fade, .anim_left, .anim_right, .anim_pop, .anim_scale, .anim_bounce, .anim_line";
    face.querySelectorAll(anim_selectors).forEach((el) => {
      el.classList.remove("active");
    });

    face.querySelectorAll(".split_char").forEach((span) => {
      span.classList.remove("active");
    });

    // 스킬 바 리셋
    face.querySelectorAll(".skill_fill").forEach((bar) => {
      bar.style.width = "0%";
    });

    // 스킬 퍼센트 리셋
    face.querySelectorAll(".skill_percent").forEach((el) => {
      el.textContent = "0%";
    });

    // 타임라인 아이템 리셋
    face.querySelectorAll(".timeline_item").forEach((item) => {
      item.classList.remove("active");
    });
  }

  /* ========================================
     COUNT UP ANIMATION
  ======================================== */
  function count_up(element, start, end, duration) {
    const start_time = performance.now();

    function update(current_time) {
      const elapsed = current_time - start_time;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current_val = Math.round(start + (end - start) * eased);
      element.textContent = current_val + "%";

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  /* ========================================
     PAGE NAVIGATION
  ======================================== */
  function go_to_page(target_page) {
    if (is_animating) return;
    if (target_page < 0 || target_page > TOTAL_PAGES) return;
    if (target_page === current_page) return;

    is_animating = true;

    // 현재 보이는 면 비활성화
    get_visible_faces().forEach((face) => deactivate_animations(face));

    if (target_page > current_page) {
      for (let i = Math.floor(current_page / 2); i < Math.floor(target_page / 2); i++) {
        flip_leaf(i, true);
      }
    } else {
      for (let i = Math.floor(current_page / 2) - 1; i >= Math.floor(target_page / 2); i--) {
        flip_leaf(i, false);
      }
    }

    current_page = target_page;
    update_indicators();
    update_nav_buttons();

    // 스크롤 힌트 숨김
    if (scroll_hint) scroll_hint.classList.add("hidden");

    // 전환 후 새로운 면 활성화
    setTimeout(() => {
      get_visible_faces().forEach((face) => activate_animations(face));
      is_animating = false;
    }, 800);
  }

  function next_page() {
    const next_target = Math.min(current_page + 2, TOTAL_PAGES);
    const aligned = Math.min(Math.ceil(next_target / 2) * 2, TOTAL_PAGES);
    go_to_page(aligned);
  }

  function prev_page() {
    const prev_target = Math.max(current_page - 2, 0);
    const aligned = Math.max(Math.floor(prev_target / 2) * 2, 0);
    go_to_page(aligned);
  }

  function flip_leaf(leaf_index, flip) {
    if (leaf_index < 0 || leaf_index >= TOTAL_LEAVES) return;
    if (flip) {
      pages[leaf_index].classList.add("flipped");
    } else {
      pages[leaf_index].classList.remove("flipped");
    }
  }

  /* ========================================
     UI UPDATES
  ======================================== */
  function update_indicators() {
    const active_index = current_page / 2;
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === active_index);
    });
  }

  function update_nav_buttons() {
    if (prev_btn) {
      prev_btn.style.opacity = current_page <= 0 ? "0.3" : "1";
      prev_btn.style.pointerEvents = current_page <= 0 ? "none" : "auto";
    }
    if (next_btn) {
      next_btn.style.opacity = current_page >= TOTAL_PAGES ? "0.3" : "1";
      next_btn.style.pointerEvents = current_page >= TOTAL_PAGES ? "none" : "auto";
    }
  }

  /* ========================================
     EVENT: Mouse Wheel
  ======================================== */
  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (is_animating) return;

    wheel_accumulator += e.deltaY;
    if (Math.abs(wheel_accumulator) >= WHEEL_THRESHOLD) {
      if (wheel_accumulator > 0) next_page();
      else prev_page();
      wheel_accumulator = 0;
    }
  }, { passive: false });

  /* ========================================
     EVENT: Click Navigation
  ======================================== */
  if (prev_btn) {
    prev_btn.addEventListener("click", (e) => {
      e.stopPropagation();
      prev_page();
    });
  }

  if (next_btn) {
    next_btn.addEventListener("click", (e) => {
      e.stopPropagation();
      next_page();
    });
  }

  /* ========================================
     EVENT: Dot Indicators
  ======================================== */
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => go_to_page(i * 2));
  });

  /* ========================================
     EVENT: Keyboard
  ======================================== */
  window.addEventListener("keydown", (e) => {
    if (is_animating) return;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case " ":
        e.preventDefault();
        next_page();
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        prev_page();
        break;
    }
  });

  /* ========================================
     EVENT: Touch Swipe
  ======================================== */
  document.addEventListener("touchstart", (e) => {
    touch_start_x = e.touches[0].clientX;
    touch_start_y = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (is_animating) return;
    const touch_end_x = e.changedTouches[0].clientX;
    const touch_end_y = e.changedTouches[0].clientY;
    const diff_x = touch_start_x - touch_end_x;
    const diff_y = touch_start_y - touch_end_y;
    const is_portrait = window.innerHeight > window.innerWidth;

    if (is_portrait) {
      if (Math.abs(diff_y) > 60) {
        if (diff_y > 0) next_page();
        else prev_page();
      }
    } else {
      if (Math.abs(diff_x) > 60) {
        if (diff_x > 0) next_page();
        else prev_page();
      }
    }
  }, { passive: true });

  /* ========================================
     INIT
  ======================================== */
  function init() {
    init_text_split();
    current_page = 0;
    update_indicators();
    update_nav_buttons();

    // 첫 페이지(cover) 애니메이션 지연 시작
    setTimeout(() => {
      get_visible_faces().forEach((face) => activate_animations(face));
    }, 500);
  }

  init();
})();
