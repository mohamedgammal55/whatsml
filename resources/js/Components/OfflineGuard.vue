<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import toast from '@/Composables/toastComposable'

// Full-screen ONLY when the page loads already offline (i.e. user refreshed
// while disconnected). A drop during normal use just shows a toaster.
const showScreen = ref(false)
let ready = false

const onOffline = () => {
  if (!ready) return
  toast.danger('انقطع الاتصال بالإنترنت')
}
const onOnline = () => {
  const wasDown = showScreen.value
  showScreen.value = false
  if (ready && wasDown) return // came back from full-screen: no toast needed
  if (ready) toast.success('تم استعادة الاتصال بالإنترنت')
}

onMounted(() => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    showScreen.value = true
  }
  window.addEventListener('offline', onOffline)
  window.addEventListener('online', onOnline)
  ready = true
})
onBeforeUnmount(() => {
  window.removeEventListener('offline', onOffline)
  window.removeEventListener('online', onOnline)
})

const retry = () => window.location.reload()
</script>

<template>
  <Teleport to="body">
    <div v-if="showScreen" class="qz-offline" dir="rtl">
      <div class="qz-offline__card">
        <div class="qz-offline__icon">
          <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h2>لا يوجد اتصال بالإنترنت</h2>
        <p>تأكد من اتصالك بالشبكة وحاول مرة أخرى.</p>
        <button type="button" class="qz-offline__btn" @click="retry">
          إعادة المحاولة
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.qz-offline {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}
.qz-offline__card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 20px;
  padding: 34px 28px;
  text-align: center;
  box-shadow: 0 30px 70px -25px rgba(0, 0, 0, 0.45);
  animation: qz-pop 0.35s cubic-bezier(0.2, 0.8, 0.2, 1.1) both;
}
.qz-offline__icon {
  width: 84px;
  height: 84px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #dc2626;
  background: #fef2f2;
}
.qz-offline__card h2 {
  margin: 0 0 8px;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}
.qz-offline__card p {
  margin: 0 0 24px;
  color: #64748b;
  font-size: 0.98rem;
  line-height: 1.6;
}
.qz-offline__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 24px;
  border: 0;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(180deg, #10b981, #059669);
  box-shadow: 0 12px 26px -10px rgba(16, 185, 129, 0.6);
  transition: transform 0.15s ease;
}
.qz-offline__btn:hover {
  transform: translateY(-2px);
}
@keyframes qz-pop {
  from { opacity: 0; transform: scale(0.9) translateY(10px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-color-scheme: dark) {
  .qz-offline__card { background: #0f172a; }
  .qz-offline__card h2 { color: #f1f5f9; }
  .qz-offline__card p { color: #94a3b8; }
}
</style>
