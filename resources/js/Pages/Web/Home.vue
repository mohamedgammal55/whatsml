<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useForm, usePage, router } from '@inertiajs/vue3'
import BlankLayout from '@/Layouts/BlankLayout.vue'
import SeoMeta from '@/Components/Web/SeoMeta.vue'
import trans from '@/Composables/transComposable'

defineOptions({ layout: BlankLayout })
const props = defineProps(['home', 'testimonials', 'partner_logos', 'faqs', 'plans'])

const t = (s) => trans(s)
const page = usePage()
const primary = computed(() => page.props.primaryData || {})
const hero = computed(() => props.home?.hero_banner || {})
const year = new Date().getFullYear()

/* ---- i18n ---- */
const locale = computed(() => page.props.locale || 'en')
const isRtl = computed(() => ['ar', 'he', 'fa', 'ur'].includes(locale.value))
const languages = computed(() => page.props.languages || { en: 'English' })
const hasLangs = computed(() => Object.keys(languages.value).length > 1)
const setLocale = (code) => {
  if (code === locale.value) return
  router.patch('/set-locale/' + code, {}, { preserveScroll: true, preserveState: false })
}

/* ---- first-visit loader ---- */
const showLoader = ref(false)
const hideLoader = ref(false)

/* ---- theme ---- */
const theme = ref('light')
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  try { localStorage.setItem('qz-theme', theme.value) } catch (e) {}
}

const phoneDigits = computed(() => String(primary.value.contact_phone || '201066616839').replace(/[^0-9]/g, ''))
const waLink = computed(() => `https://wa.me/${phoneDigits.value}`)

/* ---- features / steps (marketing copy, translatable) ---- */
const features = [
  { icon: 'fa-comments', title: 'Personalized Conversations', desc: 'Engage every customer personally and effectively with tailored conversations that fit their needs.' },
  { icon: 'fa-robot', title: 'Smart Chatbots', desc: 'Automate common replies and deliver 24/7 support with AI-powered chatbots.' },
  { icon: 'fa-chart-line', title: 'Advanced Analytics', desc: 'Track campaign performance, engagement and conversions from one comprehensive dashboard.' },
  { icon: 'fa-bullhorn', title: 'Bulk Messaging', desc: 'Send notifications, promotions and important updates to your whole list in a single click.' },
  { icon: 'fa-cogs', title: 'Easy Integration', desc: 'Connect WhatsApp with your existing CRM, marketing and sales tools effortlessly.' },
  { icon: 'fa-lock', title: 'Advanced Security', desc: 'Protect customer data and conversations with end-to-end encryption and robust security.' }
]
const steps = [
  { n: 1, title: 'Create your account', desc: 'Sign up, connect your WhatsApp number and set up your business profile in minutes.' },
  { n: 2, title: 'Choose your plan', desc: 'Pick the plan that fits you — from small business to large enterprise scale.' },
  { n: 3, title: 'Start communicating', desc: 'Build message templates and start engaging customers through an easy interface.' }
]

/* ---- real plans (grouped by billing period) ---- */
const periodName = (days) => (days == 30 ? 'Monthly' : days == 365 ? 'Yearly' : 'Lifetime')
const periodSuffix = (days) => (days == 30 ? '/mo' : days == 365 ? '/yr' : '')
const off = (v) => v === false || v === 0 || v === '0' || v === '' || v === null
const allPlans = computed(() =>
  (props.plans || []).map((p) => {
    let d = p.data
    if (typeof d === 'string') { try { d = JSON.parse(d) } catch (e) { d = {} } }
    const feats = d && typeof d === 'object' ? Object.values(d).map((f) => ({ text: f.overview ?? f.title ?? '', on: !off(f.value) })) : []
    return {
      id: p.id,
      name: p.title,
      price: p.price_format ?? p.price,
      suffix: periodSuffix(p.days),
      period: periodName(p.days),
      desc: p.short_description,
      items: feats,
      trial: !!p.is_trial,
      trialDays: p.trial_days,
      popular: !!(p.is_recommended || p.is_featured)
    }
  })
)
const periodOrder = ['Monthly', 'Yearly', 'Lifetime']
const periods = computed(() => periodOrder.filter((pn) => allPlans.value.some((p) => p.period === pn)))
const activePeriod = ref(null)
const effectivePeriod = computed(() => activePeriod.value || periods.value[0])
const plans = computed(() => allPlans.value.filter((p) => p.period === effectivePeriod.value))

/* ---- testimonials ---- */
const stripTags = (s) => (s ? String(s).replace(/<[^>]*>/g, '') : '')
const reviews = computed(() => {
  const arr = props.testimonials || []
  if (arr.length) {
    return arr.map((r) => ({
      text: stripTags(r.description),
      name: r.name,
      position: [r.designation, r.location].filter(Boolean).join(', '),
      image: r.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(r.name || 'QZ') + '&background=10b981&color=fff'
    }))
  }
  return [
    { text: 'Using QuickZap raised our customer engagement by 70%. Automation saved the team hours every week.', name: 'Omar Al-Farouq', position: 'Customer Service Manager, Al-Nour Trading', image: 'https://randomuser.me/api/portraits/men/12.jpg' },
    { text: 'Sales conversions improved by 45% after switching to QuickZap. Clients love the direct approach.', name: 'Khaled Mansour', position: 'Sales Manager, Cairo Tech', image: 'https://randomuser.me/api/portraits/men/24.jpg' },
    { text: 'The integration was smooth and support was excellent. Customer satisfaction is up 60%.', name: 'Mona Al-Sayed', position: 'CTO, Riyadh E-commerce', image: 'https://randomuser.me/api/portraits/women/45.jpg' }
  ]
})

const faqList = computed(() => props.faqs || [])
const openFaq = ref(0)

/* ---- API tabs (real QuickZap send-message API) ---- */
const apiTab = ref('curl')
const apiUrl = (typeof window !== 'undefined' ? window.location.origin : '') + '/api/whatsapp/message'
const apiDocs = computed(() => ({
  curl: { title: 'cURL', code: `curl --location --request POST '${apiUrl}' \\
  --form 'appkey="YOUR_APP_KEY"' \\
  --form 'authkey="YOUR_AUTH_KEY"' \\
  --form 'to="RECEIVER_NUMBER"' \\
  --form 'message="Example message"'` },
  php: { title: 'PHP', code: `$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => '${apiUrl}',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS => array(
    'appkey'  => 'YOUR_APP_KEY',
    'authkey' => 'YOUR_AUTH_KEY',
    'to'      => 'RECEIVER_NUMBER',
    'message' => 'Example message',
  ),
));
echo curl_exec($curl); curl_close($curl);` },
  javascript: { title: 'JavaScript', code: `const form = new FormData();
form.append('appkey', 'YOUR_APP_KEY');
form.append('authkey', 'YOUR_AUTH_KEY');
form.append('to', 'RECEIVER_NUMBER');
form.append('message', 'Example message');

fetch('${apiUrl}', { method: 'POST', body: form })
  .then(r => r.json()).then(console.log);` },
  python: { title: 'Python', code: `import requests

url = "${apiUrl}"
payload = {
    'appkey': 'YOUR_APP_KEY',
    'authkey': 'YOUR_AUTH_KEY',
    'to': 'RECEIVER_NUMBER',
    'message': 'Example message',
}
print(requests.post(url, data=payload).text)` }
}))
const apiParams = [
  { name: 'appkey', desc: 'Authorizes a transaction for the connected app (from your dashboard).' },
  { name: 'authkey', desc: 'Authorizes the request for a valid user (your account Auth Key).' },
  { name: 'to', desc: 'Receiver WhatsApp number — full number including country code.' },
  { name: 'message', desc: 'The message body (max 1000 characters).' }
]
const copied = ref(false)
const copyCode = async () => {
  const text = apiDocs.value[apiTab.value].code
  try { await navigator.clipboard.writeText(text) } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}

/* ---- counters ---- */
const stats = reactive([
  { value: 0, target: 98, suffix: '%', label: 'Message Open Rate' },
  { value: 0, target: 60, suffix: 'M+', label: 'Messages Sent Monthly' },
  { value: 0, target: 60, suffix: '%', label: 'Higher Conversion Rate' }
])
let counted = false
const runCounters = () => {
  if (counted) return
  counted = true
  stats.forEach((s) => {
    const step = s.target / 90
    const tick = () => { s.value = Math.min(s.target, s.value + step); if (s.value < s.target) requestAnimationFrame(tick); else s.value = s.target }
    tick()
  })
}

/* ---- UI state ---- */
const scrolled = ref(false)
const showTop = ref(false)
const mobileOpen = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 50; showTop.value = window.scrollY > 300 }
const scrollTo = (id) => {
  mobileOpen.value = false
  const el = document.querySelector(id)
  if (!el) return
  window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 76, behavior: 'smooth' })
}
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

onMounted(() => {
  try { theme.value = localStorage.getItem('qz-theme') || 'light' } catch (e) {}
  // first-visit loader (shows once, then never again)
  let seen = false
  try { seen = !!localStorage.getItem('qz-visited') } catch (e) {}
  if (!seen) {
    showLoader.value = true
    document.documentElement.style.overflow = 'hidden'
    try { localStorage.setItem('qz-visited', '1') } catch (e) {}
    setTimeout(() => { hideLoader.value = true }, 1300)
    setTimeout(() => { showLoader.value = false; document.documentElement.style.overflow = '' }, 1900)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  const statsEl = document.getElementById('qz-stats')
  if (statsEl && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) { runCounters(); io.disconnect() } }) }, { threshold: 0.4 })
    io.observe(statsEl)
  } else runCounters()
  if (!document.querySelector('script[data-lottie]')) {
    const s = document.createElement('script'); s.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js'; s.setAttribute('data-lottie', '1'); document.body.appendChild(s)
  }
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

/* ---- contact form ---- */
const form = useForm({ name: '', email: '', company: '', subject: '', message: '' })
const submitContact = () => {
  useForm({
    name: form.name,
    email: form.email,
    subject: form.subject,
    message: (form.company ? `[${form.company}] ` : '') + form.message
  }).post('/contact-us', { preserveScroll: true, onSuccess: () => form.reset() })
}
</script>

<template>
  <SeoMeta />
  <div class="qz2" :class="{ dark: theme === 'dark', rtl: isRtl }" :dir="isRtl ? 'rtl' : 'ltr'">
    <!-- ===== First-visit loader ===== -->
    <div v-if="showLoader" class="qz-loader" :class="{ out: hideLoader }">
      <div class="qz-loader__box">
        <img src="/assets/quickzap/mark.png?v=3" alt="QuickZap" />
        <span class="qz-loader__ring"></span>
      </div>
      <p>Quick<b>Zap</b></p>
    </div>

    <!-- ===== Header ===== -->
    <header class="qz-hd" :class="{ scrolled }">
      <div class="qz-wrap qz-hd__in">
        <a href="/" class="qz-brand">
          <img src="/assets/quickzap/mark.png?v=3" alt="QuickZap" />
          <span>Quick<b>Zap</b></span>
        </a>
        <nav class="qz-nav">
          <a @click.prevent="scrollTo('#features')" href="#features">{{ t('Features') }}</a>
          <a @click.prevent="scrollTo('#how')" href="#how">{{ t('How it works') }}</a>
          <a @click.prevent="scrollTo('#pricing')" href="#pricing">{{ t('Pricing') }}</a>
          <a @click.prevent="scrollTo('#api')" href="#api">{{ t('API') }}</a>
          <a @click.prevent="scrollTo('#contact')" href="#contact">{{ t('Contact') }}</a>
        </nav>
        <div class="qz-hd__cta">
          <button class="qz-icobtn" @click="toggleTheme" :title="t('Toggle theme')">
            <i :class="theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
          </button>
          <div v-if="hasLangs" class="qz-lang">
            <button class="qz-icobtn"><i class="fas fa-globe"></i> {{ locale.toUpperCase() }}</button>
            <ul>
              <li v-for="(label, code) in languages" :key="code" :class="{ on: code === locale }" @click="setLocale(code)">{{ label }}</li>
            </ul>
          </div>
          <a href="/login" class="qz-link">{{ t('Login') }}</a>
          <a href="/register" class="qz-btn">{{ t('Get Started') }}</a>
        </div>
        <button class="qz-burger" @click="mobileOpen = !mobileOpen" aria-label="Menu">
          <i :class="mobileOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
        </button>
      </div>
      <div class="qz-mobile" v-show="mobileOpen">
        <a @click.prevent="scrollTo('#features')" href="#features">{{ t('Features') }}</a>
        <a @click.prevent="scrollTo('#how')" href="#how">{{ t('How it works') }}</a>
        <a @click.prevent="scrollTo('#pricing')" href="#pricing">{{ t('Pricing') }}</a>
        <a @click.prevent="scrollTo('#api')" href="#api">{{ t('API') }}</a>
        <a @click.prevent="scrollTo('#contact')" href="#contact">{{ t('Contact') }}</a>
        <div class="qz-mobile__row">
          <button class="qz-icobtn" @click="toggleTheme"><i :class="theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i></button>
          <button v-for="(label, code) in languages" :key="code" class="qz-icobtn" :class="{ on: code === locale }" @click="setLocale(code)">{{ code.toUpperCase() }}</button>
        </div>
        <a href="/register" class="qz-btn qz-btn--block">{{ t('Get Started') }}</a>
      </div>
    </header>

    <!-- ===== Hero ===== -->
    <section class="qz-hero">
      <div class="qz-wrap qz-hero__grid">
        <div class="qz-hero__copy">
          <h1>{{ hero.title || t('Connect with your customers via') }} <span>QuickZap</span></h1>
          <p>{{ hero.subtitle || t('Communicate with your customers effectively and personally on the platform they already love — WhatsApp.') }}</p>
          <div class="qz-hero__btns">
            <a href="/register" class="qz-btn qz-btn--lg"><i class="fas fa-rocket"></i> {{ t('Get Started') }}</a>
            <a :href="waLink" target="_blank" class="qz-btn-ghost qz-btn--lg"><i class="fab fa-whatsapp"></i> {{ t('Talk to us') }}</a>
          </div>
        </div>
        <div class="qz-hero__art">
          <lottie-player src="/assets/quickzap/whatsapp.json" background="transparent" speed="1" loop autoplay style="width:100%;height:420px"></lottie-player>
        </div>
      </div>
    </section>

    <!-- ===== Stats ===== -->
    <section id="qz-stats" class="qz-stats">
      <div class="qz-wrap qz-stats__grid">
        <div v-for="(s, i) in stats" :key="i" class="qz-stat">
          <div class="qz-stat__num">{{ Math.round(s.value) }}{{ s.suffix }}</div>
          <p>{{ t(s.label) }}</p>
        </div>
      </div>
    </section>

    <!-- ===== Features ===== -->
    <section id="features" class="qz-sec qz-sec--gray">
      <div class="qz-wrap">
        <div class="qz-head">
          <h2>{{ t('QuickZap business features') }}</h2>
          <p>{{ t('Leverage the power of QuickZap to grow your business and elevate your customer experience.') }}</p>
        </div>
        <div class="qz-grid-3">
          <div v-for="(f, i) in features" :key="i" class="qz-card qz-feature">
            <div class="qz-feature__icon"><i :class="'fas ' + f.icon"></i></div>
            <h3>{{ t(f.title) }}</h3>
            <p>{{ t(f.desc) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== How it works ===== -->
    <section id="how" class="qz-sec">
      <div class="qz-wrap">
        <div class="qz-head">
          <h2>{{ t('How it works') }}</h2>
          <p>{{ t("Getting started with QuickZap is quick and easy. Here's how to begin.") }}</p>
        </div>
        <div class="qz-grid-3 qz-steps">
          <div v-for="s in steps" :key="s.n" class="qz-card qz-step">
            <div class="qz-step__n">{{ s.n }}</div>
            <h3>{{ t(s.title) }}</h3>
            <p>{{ t(s.desc) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Pricing (real plans) ===== -->
    <section v-if="allPlans.length" id="pricing" class="qz-sec qz-sec--gray">
      <div class="qz-wrap">
        <div class="qz-head">
          <h2>{{ t('Subscriptions') }}</h2>
          <p>{{ t('Choose the plan that suits your needs. Every plan includes technical support.') }}</p>
        </div>
        <div v-if="periods.length > 1" class="qz-toggle">
          <button v-for="pn in periods" :key="pn" type="button" :class="{ active: effectivePeriod === pn }" @click="activePeriod = pn">{{ t(pn) }}</button>
        </div>
        <div class="qz-grid-3 qz-pricing">
          <div v-for="(p, i) in plans" :key="i" class="qz-card qz-plan" :class="{ popular: p.popular }">
            <div v-if="p.popular" class="qz-plan__badge">{{ t('Most Popular') }}</div>
            <div class="qz-plan__head">
              <h3>{{ p.name }}</h3>
              <div class="qz-plan__price">{{ p.price }}<small v-if="p.suffix">{{ p.suffix }}</small></div>
              <p v-if="p.desc" class="qz-plan__desc">{{ p.desc }}</p>
            </div>
            <ul class="qz-plan__list" v-if="p.items.length">
              <li v-for="(it, k) in p.items" :key="k" :class="{ off: !it.on }">
                <i :class="it.on ? 'fas fa-check' : 'fas fa-times'"></i> {{ it.text }}
              </li>
            </ul>
            <a :href="'/register?plan_id=' + p.id" class="qz-plan__btn">
              {{ p.trial ? (p.trialDays ? t('Free trial') + ' — ' + p.trialDays + ' ' + t('days') : t('Start free trial')) : t('Subscribe') }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== API ===== -->
    <section id="api" class="qz-sec">
      <div class="qz-wrap">
        <div class="qz-head">
          <h2>{{ t('API documentation') }}</h2>
          <p>{{ t('Send WhatsApp messages straight from your apps with the QuickZap API.') }}</p>
        </div>
        <div class="qz-api">
          <ul class="qz-api__nav">
            <li v-for="(d, key) in apiDocs" :key="key">
              <a href="#" :class="{ active: apiTab === key }" @click.prevent="apiTab = key">{{ d.title }}</a>
            </li>
          </ul>
          <div class="qz-api__panel">
            <div class="qz-endpoint"><span class="qz-method">POST</span><code>{{ apiUrl }}</code></div>
            <div class="qz-codewrap">
              <button type="button" class="qz-copy" @click="copyCode" :class="{ done: copied }">
                <i :class="copied ? 'fas fa-check' : 'far fa-copy'"></i> {{ copied ? t('Copied') : t('Copy') }}
              </button>
              <pre class="qz-code"><code>{{ apiDocs[apiTab].code }}</code></pre>
            </div>
            <table class="qz-params">
              <thead><tr><th>{{ t('Parameter') }}</th><th>{{ t('Description') }}</th></tr></thead>
              <tbody>
                <tr v-for="p in apiParams" :key="p.name"><td><code>{{ p.name }}</code></td><td>{{ t(p.desc) }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Testimonials ===== -->
    <section class="qz-sec qz-sec--gray">
      <div class="qz-wrap">
        <div class="qz-head">
          <h2>{{ t('What our clients say') }}</h2>
          <p>{{ t('Hear from businesses that transformed customer communication with QuickZap.') }}</p>
        </div>
        <div class="qz-grid-3">
          <div v-for="(r, i) in reviews" :key="i" class="qz-card qz-quote">
            <p class="qz-quote__txt">"{{ r.text }}"</p>
            <div class="qz-quote__by">
              <img :src="r.image" :alt="r.name" />
              <div><strong>{{ r.name }}</strong><small>{{ r.position }}</small></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== FAQ ===== -->
    <section v-if="faqList.length" class="qz-sec">
      <div class="qz-wrap qz-faq-wrap">
        <div class="qz-head qz-head--left">
          <h2>{{ home?.faq_section_one?.title || t('Frequently asked questions') }}</h2>
          <p>{{ t('Everything you need to know about QuickZap.') }}</p>
        </div>
        <div class="qz-faq">
          <div v-for="(f, i) in faqList" :key="i" class="qz-faq__item" :class="{ open: openFaq === i }">
            <button @click="openFaq = openFaq === i ? -1 : i">
              <span>{{ f.question }}</span><i>{{ openFaq === i ? '−' : '+' }}</i>
            </button>
            <div class="qz-faq__a"><div v-html="sanitizeHtml(f.answer)"></div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Contact ===== -->
    <section id="contact" class="qz-sec qz-contact">
      <div class="qz-wrap">
        <div class="qz-head">
          <h2>{{ t('Contact us') }}</h2>
          <p>{{ t('Have questions or ready to start? Reach our team for personalized help.') }}</p>
        </div>
        <div class="qz-contact__grid">
          <div class="qz-card qz-contact__info">
            <h3><i class="fas fa-info-circle"></i> {{ t('Contact information') }}</h3>
            <ul>
              <li v-if="primary.contact_address"><i class="fas fa-map-marker-alt"></i> {{ primary.contact_address }}</li>
              <li v-if="primary.contact_phone"><i class="fas fa-phone-alt"></i> {{ primary.contact_phone }}</li>
              <li v-if="primary.contact_email"><i class="fas fa-envelope"></i> {{ primary.contact_email }}</li>
            </ul>
            <a :href="waLink" target="_blank" class="qz-btn qz-btn--lg"><i class="fab fa-whatsapp"></i> {{ t('Chat on WhatsApp') }}</a>
          </div>
          <div class="qz-card qz-contact__form">
            <form @submit.prevent="submitContact">
              <div class="qz-2col">
                <div><label>{{ t('Full name') }}</label><input v-model="form.name" type="text" required /></div>
                <div><label>{{ t('Email') }}</label><input v-model="form.email" type="email" required /></div>
              </div>
              <label>{{ t('Company') }}</label><input v-model="form.company" type="text" />
              <label>{{ t('Subject') }}</label><input v-model="form.subject" type="text" required />
              <label>{{ t('Message') }}</label><textarea v-model="form.message" rows="5" required></textarea>
              <button type="submit" class="qz-btn qz-btn--block qz-btn--lg" :disabled="form.processing">
                <i class="fas fa-paper-plane"></i> {{ t('Send message') }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Footer ===== -->
    <footer class="qz-ft">
      <div class="qz-wrap">
        <div class="qz-ft__top">
          <a href="/" class="qz-brand qz-brand--lg">
            <img src="/assets/quickzap/logo-white.png?v=3" alt="QuickZap" />
          </a>
          <div class="qz-ft__contact">
            <span v-if="primary.contact_phone"><i class="fas fa-phone-alt"></i> {{ primary.contact_phone }}</span>
            <span v-if="primary.contact_email"><i class="fas fa-envelope"></i> {{ primary.contact_email }}</span>
          </div>
        </div>
        <div class="qz-ft__bottom">
          <p>© {{ year }} QuickZap. {{ t('All rights reserved.') }}</p>
          <div class="qz-ft__social">
            <a v-if="primary.facebook" :href="primary.facebook" target="_blank"><i class="fab fa-facebook-f"></i></a>
            <a v-if="primary.twitter" :href="primary.twitter" target="_blank"><i class="fab fa-x-twitter"></i></a>
            <a v-if="primary.instagram" :href="primary.instagram" target="_blank"><i class="fab fa-instagram"></i></a>
            <a v-if="primary.linkedin" :href="primary.linkedin" target="_blank"><i class="fab fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>
    </footer>

    <button class="qz-totop" :class="{ show: showTop }" @click="toTop"><i class="fas fa-arrow-up"></i></button>
    <a :href="waLink" target="_blank" class="qz-wafloat"><i class="fab fa-whatsapp"></i></a>
  </div>
</template>

<style scoped>
.qz2 {
  --green: #10b981;
  --green-d: #047857;
  --green-l: #d1fae5;
  --gold: #ffd700;
  /* themed surfaces (light defaults) */
  --bg: #ffffff;
  --surface: #ffffff;
  --section: #f9fafb;
  --text: #111827;
  --muted: #6b7280;
  --border: #e5e7eb;
  --hd-bg: rgba(255, 255, 255, .9);
  --hero-bg: linear-gradient(120deg, #ecfdf5, #d1fae5);
  --input-bg: #ffffff;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
  transition: background .3s, color .3s;
}
.qz2.dark {
  --bg: #0b1220;
  --surface: #111a2b;
  --section: #0e1626;
  --text: #e8edf5;
  --muted: #94a3b8;
  --border: #1e2a3d;
  --green-l: rgba(16, 185, 129, .14);
  --hd-bg: rgba(11, 18, 32, .85);
  --hero-bg: linear-gradient(120deg, #0e1f1a, #0b1220);
  --input-bg: #0e1626;
}
.qz2.rtl { direction: rtl; text-align: right; }

/* first-visit loader */
.qz-loader { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; background: radial-gradient(80% 60% at 50% 40%, #ecfdf5, #ffffff 70%); transition: opacity .5s ease, visibility .5s ease; }
.qz2.dark .qz-loader { background: radial-gradient(80% 60% at 50% 40%, #0e1f1a, #0b1220 70%); }
.qz-loader.out { opacity: 0; visibility: hidden; }
.qz-loader__box { position: relative; display: grid; place-items: center; }
.qz-loader__box img { width: 84px; height: 84px; position: relative; z-index: 2; animation: qz-pop .6s cubic-bezier(.2,.8,.2,1.2) both; }
.qz-loader__ring { position: absolute; width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--green-l); border-top-color: var(--green); animation: qz-spin .9s linear infinite; }
.qz-loader p { font-size: 1.6rem; font-weight: 800; color: var(--text); letter-spacing: -.02em; }
.qz-loader p b { color: var(--green); }
@keyframes qz-spin { to { transform: rotate(360deg); } }
@keyframes qz-pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.qz-wrap { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 20px; position: relative; }
.qz2 h1, .qz2 h2, .qz2 h3 { font-family: 'Plus Jakarta Sans', sans-serif !important; color: var(--text); margin: 0; letter-spacing: -0.02em; }

/* buttons */
.qz-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; background: var(--green); color: #fff; font-weight: 600; border-radius: 8px; border: 0; cursor: pointer; transition: .25s; box-shadow: 0 4px 12px rgba(16,185,129,.25); }
.qz-btn:hover { background: var(--green-d); transform: translateY(-2px); box-shadow: 0 8px 18px rgba(16,185,129,.35); color: #fff; }
.qz-btn--lg { padding: 14px 30px; font-size: 1.05rem; }
.qz-btn--block { width: 100%; }
.qz-btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 14px 30px; border: 2px solid var(--green); color: var(--green); font-weight: 600; border-radius: 8px; background: transparent; transition: .25s; }
.qz-btn-ghost:hover { background: var(--green-l); transform: translateY(-2px); }

/* header */
.qz-hd { position: fixed; inset: 0 0 auto 0; z-index: 50; background: var(--hd-bg); backdrop-filter: blur(10px); box-shadow: 0 1px 0 rgba(0,0,0,.06); padding: 14px 0; transition: padding .3s, box-shadow .3s, background .3s; }
.qz-hd.scrolled { padding: 8px 0; box-shadow: 0 6px 20px -10px rgba(0,0,0,.25); }
.qz-hd__in { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.qz-brand { display: flex; align-items: center; gap: 10px; font-size: 1.5rem; font-weight: 700; color: var(--text); }
.qz-brand img { height: 46px; width: auto; }
.qz-brand b { color: var(--green); font-weight: 800; }
.qz-nav { display: flex; gap: 26px; }
.qz-nav a { position: relative; color: var(--muted); font-weight: 500; cursor: pointer; }
.qz-nav a::after { content: ''; position: absolute; left: 0; bottom: -5px; height: 2px; width: 0; background: var(--green); transition: width .3s; }
.qz-nav a:hover { color: var(--green); }
.qz-nav a:hover::after { width: 100%; }
.qz-hd__cta { display: flex; align-items: center; gap: 12px; }
.qz-link { color: var(--text); font-weight: 600; }
.qz-link:hover { color: var(--green); }
.qz-icobtn { display: inline-flex; align-items: center; gap: 6px; background: var(--green-l); color: var(--green-d); border: 0; border-radius: 8px; padding: 8px 12px; font-weight: 600; cursor: pointer; transition: .2s; font-size: .9rem; }
.qz-icobtn:hover { background: var(--green); color: #fff; }
.qz-icobtn.on { background: var(--green); color: #fff; }
.qz2.dark .qz-icobtn { color: #6ee7b7; }
.qz-lang { position: relative; }
.qz-lang ul { position: absolute; top: 110%; right: 0; min-width: 150px; max-height: 260px; overflow: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 12px 30px -10px rgba(0,0,0,.25); list-style: none; padding: 6px; margin: 0; opacity: 0; visibility: hidden; transform: translateY(6px); transition: .2s; z-index: 5; }
.qz-lang:hover ul { opacity: 1; visibility: visible; transform: none; }
.qz-lang li { padding: 8px 12px; border-radius: 7px; cursor: pointer; color: var(--text); font-weight: 500; font-size: .92rem; }
.qz-lang li:hover, .qz-lang li.on { background: var(--green-l); color: var(--green-d); }
.qz-burger { display: none; background: none; border: 0; font-size: 1.4rem; color: var(--text); cursor: pointer; }
.qz-mobile { display: none; flex-direction: column; gap: 6px; padding: 14px 20px 6px; }
.qz-mobile a { padding: 9px 0; border-bottom: 1px solid var(--border); color: var(--text); font-weight: 500; }
.qz-mobile__row { display: flex; gap: 8px; padding: 10px 0; }

/* hero */
.qz-hero { padding: 150px 0 80px; background: var(--hero-bg); }
.qz-hero__grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 40px; }
.qz-hero__copy h1 { font-size: clamp(2.2rem, 4.5vw, 3.3rem); font-weight: 800; line-height: 1.1; }
.qz-hero__copy h1 span { color: var(--green); }
.qz-hero__copy p { margin: 20px 0 30px; font-size: 1.2rem; color: var(--muted); }
.qz-hero__btns { display: flex; flex-wrap: wrap; gap: 14px; }
.qz-hero__art { min-height: 300px; }

/* stats */
.qz-stats { padding: 56px 0; background: var(--bg); }
.qz-stats__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; text-align: center; }
.qz-stat__num { font-size: 2.8rem; font-weight: 800; color: var(--green); }
.qz-stat p { color: var(--muted); margin: 4px 0 0; }

/* sections */
.qz-sec { padding: 72px 0; }
.qz-sec--gray { background: var(--section); }
.qz-head { text-align: center; max-width: 620px; margin: 0 auto 48px; }
.qz-head--left { text-align: start; margin: 0; }
.qz-head h2 { font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 800; }
.qz-head p { margin: 14px 0 0; color: var(--muted); font-size: 1.05rem; }
.qz-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.qz-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 30px; box-shadow: 0 4px 14px rgba(0,0,0,.05); transition: .3s; }

/* features */
.qz-feature:hover { transform: translateY(-5px); box-shadow: 0 14px 30px rgba(0,0,0,.1); }
.qz-feature__icon { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; background: var(--green-l); color: var(--green); font-size: 1.3rem; margin-bottom: 16px; }
.qz-feature h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
.qz-feature p, .qz-step p, .qz-quote__txt { color: var(--muted); }

/* steps */
.qz-steps { margin-top: 20px; }
.qz-step { position: relative; overflow: visible; }
.qz-step__n { position: absolute; top: -18px; inset-inline-start: 26px; width: 42px; height: 42px; border-radius: 50%; background: var(--green); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 1.2rem; box-shadow: 0 6px 14px rgba(16,185,129,.4); }
.qz-step h3 { margin: 14px 0 8px; font-size: 1.2rem; font-weight: 700; }

/* pricing */
.qz-toggle { display: flex; width: fit-content; gap: 4px; padding: 5px; background: var(--section); border: 1px solid var(--border); border-radius: 999px; margin: -28px auto 40px; }
.qz-toggle button { border: 0; background: transparent; padding: 9px 22px; border-radius: 999px; font-weight: 600; color: var(--muted); cursor: pointer; transition: .2s; }
.qz-toggle button.active { background: var(--surface); color: var(--green-d); box-shadow: 0 2px 6px rgba(0,0,0,.08); }
.qz2.dark .qz-toggle button.active { color: #6ee7b7; }
.qz-pricing { align-items: stretch; }
.qz-pricing .qz-plan { height: 100%; }
.qz-plan { position: relative; overflow: hidden; display: flex; flex-direction: column; }
.qz-plan.popular { border: 2px solid var(--green); }
.qz-plan__badge { position: absolute; top: 16px; inset-inline-end: -34px; background: var(--green); color: #fff; font-size: .8rem; font-weight: 700; padding: 5px 40px; transform: rotate(45deg); }
.qz2.rtl .qz-plan__badge { transform: rotate(-45deg); }
.qz-plan__head { text-align: center; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.qz-plan__head h3 { font-size: 1.4rem; font-weight: 700; }
.qz-plan__price { font-size: 3rem; font-weight: 800; margin-top: 8px; color: var(--text); }
.qz-plan__price small { font-size: 1rem; color: var(--muted); font-weight: 500; }
.qz-plan__desc { color: var(--muted); font-size: .92rem; margin: 8px 0 0; }
.qz-plan__list { list-style: none; padding: 22px 0; margin: 0; flex: 1; }
.qz-plan__list li { display: flex; align-items: center; gap: 10px; padding: 7px 0; color: var(--text); }
.qz-plan__list li i { color: var(--green); }
.qz-plan__list li.off { color: var(--muted); }
.qz-plan__list li.off i.fa-times { color: #cbd5e1; }
.qz-plan__btn { display: block; text-align: center; padding: 12px; border-radius: 8px; font-weight: 700; background: var(--green-l); color: var(--green-d); border: 2px solid var(--green); transition: .25s; margin-top: auto; }
.qz2.dark .qz-plan__btn { color: #6ee7b7; }
.qz-plan__btn:hover { background: var(--green); color: #fff; }

/* api */
.qz-api { display: grid; grid-template-columns: 240px 1fr; gap: 28px; }
.qz-api__nav { list-style: none; padding: 0; margin: 0; position: sticky; top: 90px; align-self: start; }
.qz-api__nav a { display: block; padding: 10px 14px; border-radius: 8px; color: var(--muted); font-weight: 500; }
.qz-api__nav a.active, .qz-api__nav a:hover { background: var(--green-l); color: var(--green-d); }
.qz2.dark .qz-api__nav a.active, .qz2.dark .qz-api__nav a:hover { color: #6ee7b7; }
.qz-endpoint { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.qz-method { background: var(--green); color: #fff; font-weight: 700; font-size: .8rem; padding: 4px 12px; border-radius: 6px; letter-spacing: .04em; }
.qz-endpoint code { background: var(--section); border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; color: var(--text); font-size: .9rem; word-break: break-all; }
.qz-codewrap { position: relative; }
.qz-code { background: #0b1220; color: #e5e7eb; border-radius: 12px; padding: 20px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: .9rem; margin: 0; direction: ltr; text-align: left; }
.qz-copy { position: absolute; top: 12px; inset-inline-end: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: .8rem; font-weight: 600; color: #e5e7eb; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15); border-radius: 8px; cursor: pointer; transition: .2s; }
.qz-copy:hover { background: rgba(255,255,255,.16); }
.qz-copy.done { color: #06140d; background: var(--green); border-color: var(--green); }
.qz-params { width: 100%; margin-top: 20px; border-collapse: collapse; }
.qz-params th, .qz-params td { text-align: start; padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: .92rem; color: var(--text); vertical-align: top; }
.qz-params th { color: var(--muted); font-weight: 600; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; }
.qz-params code { background: var(--green-l); color: var(--green-d); padding: 2px 8px; border-radius: 6px; font-weight: 600; }

/* testimonials */
.qz-quote__txt { font-style: italic; margin-bottom: 20px; }
.qz-quote__by { display: flex; align-items: center; gap: 12px; }
.qz-quote__by img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
.qz-quote__by strong { display: block; color: var(--text); }
.qz-quote__by small { color: var(--muted); }

/* faq */
.qz-faq-wrap { display: grid; grid-template-columns: .8fr 1.2fr; gap: 40px; align-items: start; }
.qz-faq__item { border: 1px solid var(--border); border-radius: 12px; margin-bottom: 12px; overflow: hidden; background: var(--surface); }
.qz-faq__item.open { border-color: var(--green); }
.qz-faq__item button { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 18px 20px; background: transparent; border: 0; cursor: pointer; font-weight: 600; font-size: 1.02rem; text-align: start; color: var(--text); }
.qz-faq__item i { color: var(--green); font-style: normal; font-size: 1.4rem; }
.qz-faq__a { max-height: 0; overflow: hidden; transition: max-height .3s ease; }
.qz-faq__item.open .qz-faq__a { max-height: 500px; }
.qz-faq__a > div { padding: 0 20px 18px; color: var(--muted); }

/* contact */
.qz-contact { background: var(--section); }
.qz-contact__grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 28px; }
.qz-contact__info h3 { color: var(--green-d); font-size: 1.4rem; display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
.qz2.dark .qz-contact__info h3 { color: #6ee7b7; }
.qz-contact__info ul { list-style: none; padding: 0; margin: 0 0 26px; }
.qz-contact__info li { display: flex; align-items: center; gap: 14px; padding: 10px 0; color: var(--text); }
.qz-contact__info li i { color: var(--green); width: 18px; }
.qz-contact__form label { display: block; margin: 14px 0 6px; font-weight: 500; color: var(--text); }
.qz-contact__form input, .qz-contact__form textarea { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-family: inherit; background: var(--input-bg); color: var(--text); transition: .2s; }
.qz-contact__form input:focus, .qz-contact__form textarea:focus { outline: none; border-color: var(--green); box-shadow: 0 0 0 3px rgba(16,185,129,.12); }
.qz-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.qz-contact__form button { margin-top: 18px; }

/* footer */
.qz-ft { background: #0b1220; color: #94a3b8; padding: 50px 0 30px; }
.qz-ft__top { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; padding-bottom: 26px; }
.qz-brand--lg img { height: 54px; width: auto; }
.qz-ft__contact { display: flex; gap: 24px; flex-wrap: wrap; color: #94a3b8; }
.qz-ft__bottom { border-top: 1px solid #1e2a3d; padding-top: 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.qz-ft__bottom p { color: #94a3b8; margin: 0; }
.qz-ft__social { display: flex; gap: 12px; }
.qz-ft__social a { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.08); display: grid; place-items: center; color: #cbd5e1; transition: .25s; }
.qz-ft__social a:hover { background: var(--green); color: #fff; }

/* floating */
.qz-totop { position: fixed; bottom: 24px; inset-inline-end: 24px; width: 46px; height: 46px; border-radius: 50%; border: 0; background: var(--green); color: #fff; cursor: pointer; opacity: 0; visibility: hidden; transition: .3s; z-index: 40; box-shadow: 0 6px 16px rgba(0,0,0,.2); }
.qz-totop.show { opacity: 1; visibility: visible; }
.qz-totop:hover { background: var(--green-d); transform: translateY(-4px); }
.qz-wafloat { position: fixed; bottom: 24px; inset-inline-start: 24px; width: 54px; height: 54px; border-radius: 50%; background: #25d366; color: #fff; display: grid; place-items: center; font-size: 1.6rem; z-index: 40; box-shadow: 0 6px 18px rgba(0,0,0,.22); transition: .25s; }
.qz-wafloat:hover { transform: scale(1.1); }

/* responsive */
@media (max-width: 900px) {
  .qz-nav, .qz-hd__cta { display: none; }
  .qz-burger { display: block; }
  .qz-mobile { display: flex; }
  .qz-hero__grid, .qz-grid-3, .qz-api, .qz-faq-wrap, .qz-contact__grid, .qz-stats__grid { grid-template-columns: 1fr; }
  .qz-hero__art { display: none; }
  .qz-2col { grid-template-columns: 1fr; }
  .qz-plan.popular { transform: none; }
}
</style>
