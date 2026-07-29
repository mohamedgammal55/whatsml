import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { router } from '@inertiajs/vue3'

/**
 * Infinite scroll for a Laravel paginator passed as an Inertia prop.
 *
 *   const { list, loading, sentinel } = useInfiniteScroll(() => props.apps, 'apps')
 *
 * - `list`     : accumulated items across pages (use in v-for)
 * - `sentinel` : ref to bind on a bottom element (triggers the next page)
 * - `loading`  : true while the next page is being fetched
 *
 * It preserves current query params (filters), preserves scroll & component
 * state, and appends each page as it arrives.
 */
export default function useInfiniteScroll(getPaginator, propKey) {
  const list = ref([])
  const page = ref(1)
  const lastPage = ref(1)
  const loading = ref(false)
  const sentinel = ref(null)
  let observer = null

  const sync = (p) => {
    if (!p) return
    const cur = p.current_page || 1
    if (cur <= 1) list.value = [...(p.data || [])]
    else list.value = [...list.value, ...(p.data || [])]
    page.value = cur
    lastPage.value = p.last_page || 1
    loading.value = false
  }

  const loadMore = () => {
    if (loading.value || page.value >= lastPage.value) return
    loading.value = true
    const params = Object.fromEntries(new URLSearchParams(window.location.search))
    params.page = page.value + 1
    router.get(window.location.pathname, params, {
      only: [propKey],
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onFinish: () => {
        loading.value = false
      }
    })
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
    watch(getPaginator, (p) => sync(p))
  })

  onBeforeUnmount(() => observer && observer.disconnect())

  return { list, page, lastPage, loading, sentinel, loadMore }
}
