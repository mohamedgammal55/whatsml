<script setup>
import { ref } from 'vue'
defineProps(['hero_banner'])

const email = ref('')
const goRegister = () => {
  window.location.href = '/register?email=' + email.value
}
</script>

<template>
  <section class="qz-hero">
    <!-- electric backdrop -->
    <div class="qz-hero__mesh"></div>
    <div class="qz-hero__grid"></div>
    <span class="qz-bolt qz-bolt--1"></span>
    <span class="qz-bolt qz-bolt--2"></span>

    <div class="container position-relative" style="z-index: 3">
      <div class="qz-hero__inner">
        <span class="qz-eyebrow">
          <span class="qz-eyebrow__zap">⚡</span>
          {{ hero_banner.feature_item_one || 'WhatsApp Marketing, automated' }}
        </span>

        <h1 class="qz-title">
          <span class="qz-title__line">{{ hero_banner.title }}</span>
        </h1>

        <p class="qz-sub">{{ hero_banner.subtitle }}</p>

        <form @submit.prevent="goRegister" class="qz-form">
          <div class="qz-field">
            <input type="email" v-model="email" class="qz-input" placeholder="you@company.com" required />
            <button type="submit" class="qz-cta">
              {{ hero_banner.btn_text || 'Start free' }}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </form>

        <ul class="qz-trust">
          <li v-if="hero_banner.feature_item_one">✓ {{ hero_banner.feature_item_one }}</li>
          <li v-if="hero_banner.feature_item_two">✓ {{ hero_banner.feature_item_two }}</li>
        </ul>
      </div>

      <div class="qz-shot-wrap">
        <div class="qz-shot-glow"></div>
        <img
          :src="sanitizeHtml(hero_banner.bg_img_overflow ?? hero_banner.bg_image ?? '/assets/frontend/images/graphics/screen_16.png')"
          alt="" class="qz-shot" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.qz-hero {
  position: relative;
  overflow: hidden;
  padding: 200px 0 120px;
  background: #06140d;
  color: #e8f0ec;
}
@media (max-width: 991px) { .qz-hero { padding: 150px 0 70px; } }

/* gradient mesh + grain backdrop */
.qz-hero__mesh {
  position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(60% 50% at 78% -5%, rgba(21,179,100,.55), transparent 60%),
    radial-gradient(45% 40% at 8% 8%, rgba(245,180,0,.20), transparent 60%),
    radial-gradient(80% 60% at 50% 120%, rgba(21,179,100,.35), transparent 60%);
}
.qz-hero__grid {
  position: absolute; inset: 0; z-index: 1; opacity: .35;
  background-image:
    linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 52px 52px;
  -webkit-mask-image: radial-gradient(900px 520px at 50% 10%, #000 35%, transparent 78%);
  mask-image: radial-gradient(900px 520px at 50% 10%, #000 35%, transparent 78%);
}
.qz-bolt { position: absolute; z-index: 1; filter: blur(2px); opacity: .5; }
.qz-bolt--1 { top: 18%; left: 6%; width: 2px; height: 120px; background: linear-gradient(#f5b400, transparent); transform: rotate(18deg); }
.qz-bolt--2 { top: 30%; right: 9%; width: 2px; height: 90px; background: linear-gradient(#15b364, transparent); transform: rotate(-12deg); }

.qz-hero__inner { position: relative; z-index: 3; max-width: 880px; margin: 0 auto; text-align: center; }

.qz-eyebrow {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 8px 18px; border-radius: 999px;
  background: rgba(255,255,255,.06); color: #aef0c9;
  border: 1px solid rgba(21,179,100,.4);
  font-weight: 600; font-size: 14px; backdrop-filter: blur(6px);
  animation: qz-fade .8s ease both;
}
.qz-eyebrow__zap { filter: drop-shadow(0 0 6px rgba(245,180,0,.8)); }

.qz-title {
  margin: 30px 0 0;
  font-family: 'Bricolage Grotesque','Sora',sans-serif;
  font-weight: 800; line-height: .98; letter-spacing: -2px;
  font-size: clamp(46px, 7vw, 88px);
}
.qz-title__line {
  display: inline-block;
  background: linear-gradient(180deg, #ffffff 35%, #8ff0bd 130%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: qz-rise .9s cubic-bezier(.2,.7,.2,1) both;
}
.qz-sub {
  margin: 24px auto 0; max-width: 600px;
  font-size: clamp(17px, 2vw, 20px); line-height: 1.6; color: #9fb4ab; font-weight: 500;
  animation: qz-rise .9s .15s cubic-bezier(.2,.7,.2,1) both;
}

.qz-form { margin: 38px auto 0; max-width: 520px; animation: qz-rise .9s .3s cubic-bezier(.2,.7,.2,1) both; }
.qz-field {
  display: flex; gap: 8px; padding: 8px;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12);
  border-radius: 18px; backdrop-filter: blur(10px);
}
.qz-input {
  flex: 1; min-width: 0; border: 0; outline: none; background: transparent;
  padding: 0 16px; font-size: 16px; color: #fff;
}
.qz-input::placeholder { color: #6f857c; }
.qz-cta {
  display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;
  border: 0; cursor: pointer; border-radius: 12px; padding: 14px 26px;
  font-weight: 700; font-size: 16px; color: #06140d;
  background: linear-gradient(180deg, #2ee585, #15b364);
  box-shadow: 0 0 0 1px rgba(255,255,255,.1), 0 12px 30px -8px rgba(46,229,133,.6);
  transition: transform .15s ease, box-shadow .15s ease;
}
.qz-cta:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(255,255,255,.18), 0 18px 40px -8px rgba(46,229,133,.75); }

.qz-trust {
  list-style: none; padding: 0; margin: 22px 0 0;
  display: flex; flex-wrap: wrap; gap: 22px; justify-content: center;
  color: #8aa399; font-weight: 500; font-size: 15px;
  animation: qz-fade 1s .5s ease both;
}

.qz-shot-wrap { position: relative; z-index: 3; margin: 72px auto 0; max-width: 1020px; animation: qz-rise 1s .45s cubic-bezier(.2,.7,.2,1) both; }
.qz-shot {
  width: 100%; height: auto; display: block; border-radius: 16px;
  border: 1px solid rgba(255,255,255,.1);
  box-shadow: 0 50px 120px -40px rgba(0,0,0,.8);
}
.qz-shot-glow {
  position: absolute; inset: -10% 12% auto 12%; height: 65%;
  background: radial-gradient(closest-side, rgba(46,229,133,.5), transparent);
  filter: blur(50px); z-index: -1;
}

@keyframes qz-rise { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
@keyframes qz-fade { from { opacity: 0; } to { opacity: 1; } }
</style>
