<script setup>
import { useForm } from '@inertiajs/vue3'

const props = defineProps([
  'WHATSAPP_ES_FACEBOOK_CLIENT_ID',
  'WHATSAPP_ES_FACEBOOK_CLIENT_SECRET',
  'WHATSAPP_ES_FACEBOOK_CONFIG_ID',
  'WHATSAPP_ES_WEBHOOK_VERIFY_TOKEN'
])

const form = useForm({
  WHATSAPP_ES_FACEBOOK_CLIENT_ID: props.WHATSAPP_ES_FACEBOOK_CLIENT_ID,
  WHATSAPP_ES_FACEBOOK_CLIENT_SECRET: props.WHATSAPP_ES_FACEBOOK_CLIENT_SECRET,
  WHATSAPP_ES_FACEBOOK_CONFIG_ID: props.WHATSAPP_ES_FACEBOOK_CONFIG_ID,
  WHATSAPP_ES_WEBHOOK_VERIFY_TOKEN: props.WHATSAPP_ES_WEBHOOK_VERIFY_TOKEN
})

function update() {
  form.post(route('admin.whatsapp-es.settings.store'))
}

const whatsappWebhookUrl = route('api.whatsapp-es.webhook').replace('http://', 'https://')
</script>
<template>
  <div class="grid grid-cols-1 lg:grid-cols-12">
    <div class="lg:col-span-5">
      <strong>{{ trans('Whatsapp Embedded Signup Settings') }}</strong>
      <p>{{ trans('Edit Whatsapp Embedded Signup Settings') }}</p>
    </div>
    <div class="lg:col-span-7">
      <form @submit.prevent="update">
        <div class="card">
          <div class="card-body">
            <div class="mb-2">
              <label class="label mb-1">{{ trans('FACEBOOK CLIENT ID') }}</label>
              <input
                type="text"
                v-model="form.WHATSAPP_ES_FACEBOOK_CLIENT_ID"
                required
                class="input"
              />
            </div>
            <div class="mb-2">
              <label class="label mb-1">{{ trans('FACEBOOK CLIENT SECRET') }}</label>
              <input
                type="text"
                v-model="form.WHATSAPP_ES_FACEBOOK_CLIENT_SECRET"
                required
                class="input"
              />
            </div>
            <div class="mb-2">
              <label class="label mb-1">{{ trans('WHATSAPP ES CONFIG ID') }}</label>
              <input
                type="text"
                v-model="form.WHATSAPP_ES_FACEBOOK_CONFIG_ID"
                required
                class="input"
              />
            </div>
            <div class="mb-2">
              <label class="label mb-1">{{ trans('Webhook Callback URL') }}</label>
              <input type="text" :value="whatsappWebhookUrl" class="input" readonly />
            </div>
            <div class="mb-2">
              <label class="label mb-1">{{ trans('Webhook Verify Token') }}</label>
              <input type="text" :value="form.WHATSAPP_ES_WEBHOOK_VERIFY_TOKEN" class="input" />
            </div>

            <div class="mt-3">
              <button 
                type="submit" 
                :disabled="form.processing"
                class="btn btn-primary"
              >
                <span v-if="form.processing">{{ trans('Saving...') }}</span>
                <span v-else>{{ trans('Save Changes') }}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
