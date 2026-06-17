<script setup>
const props = defineProps({
  items: Array,
  grid: {
    type: Number,
    default: 4
  }
})
const gridClass = (grid) => `lg:grid-cols-${grid}`

// Cohesive QuickZap accent rotation (green-forward with a yellow spark)
const accents = [
  { chip: 'from-primary-500 to-primary-600', glow: 'rgba(21,179,100,.35)', bar: 'bg-primary-500' },
  { chip: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,.32)', bar: 'bg-emerald-500' },
  { chip: 'from-accent-400 to-accent-500', glow: 'rgba(245,180,0,.35)', bar: 'bg-accent-400' },
  { chip: 'from-teal-500 to-primary-600', glow: 'rgba(20,184,166,.3)', bar: 'bg-teal-500' }
]
const accent = (i) => accents[i % accents.length]
</script>

<template>
  <section v-if="items.length" :class="gridClass(grid)" class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="qz-stat group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 transition-all duration-200 hover:-translate-y-1 dark:border-slate-700/60 dark:bg-slate-800"
      :style="{ '--glow': accent(index).glow }"
    >
      <!-- top accent bar -->
      <span class="absolute inset-x-0 top-0 h-1 w-full rounded-b-full" :class="accent(index).bar"></span>
      <!-- ambient glow on hover -->
      <span
        class="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        :style="{ background: accent(index).glow }"
      ></span>

      <div class="relative flex items-start justify-between">
        <div class="flex flex-col">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {{ item.title }}
          </p>
          <h3 class="mt-2 font-display text-3xl font-extrabold leading-none text-slate-800 dark:text-white">
            {{ item.value }}
          </h3>
        </div>
        <div
          class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white"
          :class="accent(index).chip"
          :style="{ boxShadow: '0 10px 22px -8px ' + accent(index).glow }"
        >
          <Icon :icon="item.icon" class="text-2xl" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.qz-stat:hover {
  box-shadow: 0 26px 50px -28px var(--glow, rgba(21, 179, 100, 0.35));
  border-color: var(--glow, rgba(21, 179, 100, 0.4));
}
</style>
