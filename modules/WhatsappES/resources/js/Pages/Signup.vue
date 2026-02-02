<script setup>
import 'https://connect.facebook.net/en_US/sdk.js'
import { useForm } from '@inertiajs/vue3'

// Simple toastr replacement
const toastr = {
  danger: (msg) => alert(msg)
}

const props = defineProps(['facebook_client_id', 'whatsapp_es_config_id'])

const form = useForm({
  name: null,
  phone_number_id: null,
  waba_id: null,
  business_id: null,
  auth_code: null
})

// SDK initialization
window.fbAsyncInit = function () {
  FB.init({
    appId: props.facebook_client_id,
    autoLogAppEvents: true,
    xfbml: true,
    version: 'v23.0'
  })
}

// Session logging message event listener
window.addEventListener('message', (event) => {
  if (!event.origin.endsWith('facebook.com')) return
  try {
    const data = JSON.parse(event.data)
   
    if (data.type === 'WA_EMBEDDED_SIGNUP' && data.event === 'FINISH') {
      form.phone_number_id = data.data?.phone_number_id || null
      form.waba_id = data.data?.waba_id || null
      form.business_id = data.data?.business_id || null
    }
  } catch {
   
  }
})

// Response callback
const fbLoginCallback = (response) => {
  if (response.authResponse) {
    const code = response.authResponse.code
   
    form.auth_code = code
    if (form.phone_number_id && form.waba_id && form.business_id) {
      submitForm()
    } else {
      console.error('Missing phone_number_id, waba_id or business_id')
    }
  } else {
    
  }
}

// Launch method and callback registration
const launchWhatsAppSignup = () => {
  if (!form.name) {
    toastr.danger('Please enter a device name first.')
    return
  }

  FB.login(fbLoginCallback, {
    config_id: props.whatsapp_es_config_id,
    response_type: 'code',
    override_default_response_type: true,
    extras: {
      sessionInfoVersion: '3'
    }
  })
}

const submitForm = () => {
  form.post(route('user.whatsapp.platforms.store'))
}
</script>

<template>
  <div class="card mx-auto max-w-2xl p-10 text-center">
    <div v-if="form.processing" class="flex items-center justify-center gap-4">
      <h5>
        {{ trans('Processing your request... Please wait') }}
      </h5>
      <div class="spinner">Loading...</div>
    </div>
    <div v-else>
      <input 
        type="text" 
        v-model="form.name" 
        placeholder="Enter Device Name" 
        required 
        class="input w-full mb-2"
      />
      <button
        class="btn btn-primary mx-auto mt-2 w-full"
        @click="launchWhatsAppSignup"
        :disabled="!form.name"
      >
        {{ trans('Continue with facebook login') }}
      </button>
    </div>
  </div>
</template>
