import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePage } from '@inertiajs/vue3'
import axios from 'axios'

/**
 * Infinite scroll for a Laravel paginator passed as an Inertia prop.
 *
 *   const { list, loading, sentinel } = useInfiniteScroll(() => props.apps, 'apps')
 *
 * - `list`     : accumulated items across pages (use in v-for)
 * - `sentinel` : ref bound to a bottom element (triggers the next page)
 * - `loading`  : true while the next page is being fetched
 *
 * The next page is fetched as an Inertia PARTIAL request via axios, so the
 * browser URL never changes (no ?page=2). A refresh always reloads page 1.
 */
export default function useInfiniteScroll(getPaginator, propKey) {
  const page = usePage()
  const list = ref([])
  const pageNum = ref(1)
  const lastPage = ref(1)
  const loading = ref(false)
  const sentinel = ref(null)
  let observer = null

  const sync = (p, { append = false } = {}) => {
    if (!p) return
    const cur = p.current_page || 1
    if (append && cur > 1) list.value = [...list.value, ...(p.data || [])]
    else list.value = [...(p.data || [])]
    pageNum.value = cur
    lastPage.value = p.last_page || 1
  }

  const loadMore = async () => {
    if (loading.value || pageNum.value >= lastPage.value) return
    loading.value = true
    try {
      const params = Object.fromEntries(new URLSearchParams(window.location.search))
      params.page = pageNum.value + 1
      const res = await axios.get(window.location.pathname, {
        params,
        headers: {
          'X-Inertia': true,
          'X-Inertia-Partial-Data': propKey,
          'X-Inertia-Partial-Component': page.component,
          'X-Inertia-Version': page.version || ''
        }
      })
      const next = res.data?.props?.[propKey]
      if (next) sync(next, { append: true })
    } catch (e) {
      // silent — keep whatever we already have
      console.error('infinite-scroll load failed', e?.response?.status || e?.message)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    sync(getPaginator())
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px' }
    )
    watch(
      sentinel,
      (el, old) => {
        if (old) observer.unobserve(old)
        if (el) observer.observe(el)
      },
      { immediate: true }
    )
    // If the prop itself changes (e.g. a filter reload), reset to page 1.
    watch(getPaginator, (p) => sync(p))
  })

  onBeforeUnmount(() => observer && observer.disconnect())

  return { list, page: pageNum, lastPage, loading, sentinel, loadMore }
}
