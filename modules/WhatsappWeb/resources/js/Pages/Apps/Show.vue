<script setup>
import { ref } from 'vue'

import UserLayout from '@/Layouts/User/UserLayout.vue'

defineOptions({ layout: UserLayout })
const props = defineProps(['app', 'authKey'])
const activeTab = ref('curl')
const activeSubTab = ref('text')

const tabLists = [
  {
    title: 'cUrl',
    value: 'curl'
  },
  {
    title: 'Php',
    value: 'php'
  },
  {
    title: 'NodeJs',
    value: 'nodejs'
  },
  {
    title: 'Python',
    value: 'python'
  }
]

const subTypes = [
  {
    title: 'Text',
    value: 'text'
  },
  /*
  {
    title: 'Media (URL)',
    value: 'media_url'
  },
  {
    title: 'Media (Upload)',
    value: 'media_upload'
  }
  */
]

const integrations = {
  curl: {
    text: `curl --location --request POST '${route('user.whatsapp-web.api.send-message')}' \n
--form 'app_key="${props.app.key}"' \n
--form 'auth_key="${props.authKey}"' \n
--form 'to="RECEIVER_NUMBER"' \n
--form 'message="Example message"' \n
--form 'generate_link_preview="true"'`,
    media_url: `curl --location --request POST '${route('user.whatsapp-web.api.send-message')}' \n
--form 'app_key="${props.app.key}"' \n
--form 'auth_key="${props.authKey}"' \n
--form 'to="RECEIVER_NUMBER"' \n
--form 'message_type="image"' \n
--form 'media_url="https://example.com/image.jpg"' \n
--form 'caption="Optional caption"'`,
    media_upload: `curl --location --request POST '${route('user.whatsapp-web.api.send-message')}' \n
--form 'app_key="${props.app.key}"' \n
--form 'auth_key="${props.authKey}"' \n
--form 'to="RECEIVER_NUMBER"' \n
--form 'message_type="image"' \n
--form 'file=@"/path/to/your/file.jpg"' \n
--form 'caption="Optional caption"'`
  },
  php: {
    text: `$curl = curl_init();
      curl_setopt_array($curl, array(
      CURLOPT_URL => '${route('user.whatsapp-web.api.send-message')}',
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_POSTFIELDS => array(
      'app_key' => '${props.app.key}',
      'auth_key' => '${props.authKey}',
      'to' => 'RECEIVER_NUMBER',
      'message' => 'Example message',
      'generate_link_preview' => true,
      ),
    ));

    $response = curl_exec($curl);

    curl_close($curl);
    echo $response;`,
    media_url: `$curl = curl_init();
      curl_setopt_array($curl, array(
      CURLOPT_URL => '${route('user.whatsapp-web.api.send-message')}',
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_POSTFIELDS => array(
      'app_key' => '${props.app.key}',
      'auth_key' => '${props.authKey}',
      'to' => 'RECEIVER_NUMBER',
      'message_type' => 'image',
      'media_url' => 'https://example.com/image.jpg',
      'caption' => 'Optional caption'
      ),
    ));

    $response = curl_exec($curl);

    curl_close($curl);
    echo $response;`,
    media_upload: `$curl = curl_init();
      curl_setopt_array($curl, array(
      CURLOPT_URL => '${route('user.whatsapp-web.api.send-message')}',
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_POSTFIELDS => array(
      'app_key' => '${props.app.key}',
      'auth_key' => '${props.authKey}',
      'to' => 'RECEIVER_NUMBER',
      'message_type' => 'image',
      'file' => new CURLFILE('/path/to/your/file.jpg'),
      'caption' => 'Optional caption'
      ),
    ));

    $response = curl_exec($curl);

    curl_close($curl);
    echo $response;`
  },
  nodejs: {
    text: `var request = require('request');
    var options = {
      'method': 'POST',
      'url': '${route('user.whatsapp-web.api.send-message')}',
      'headers': {
      },
      formData: {
        'app_key': '${props.app.key}',
        'auth_key': '${props.authKey}',
        'to': 'RECEIVER_NUMBER',
        'message': 'Example message',
        'generate_link_preview': true
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });`,
    media_url: `var request = require('request');
    var options = {
      'method': 'POST',
      'url': '${route('user.whatsapp-web.api.send-message')}',
      'headers': {
      },
      formData: {
        'app_key': '${props.app.key}',
        'auth_key': '${props.authKey}',
        'to': 'RECEIVER_NUMBER',
        'message_type': 'image',
        'media_url': 'https://example.com/image.jpg',
        'caption': 'Optional caption'
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });`,
    media_upload: `var request = require('request');
    var fs = require('fs');
    var options = {
      'method': 'POST',
      'url': '${route('user.whatsapp-web.api.send-message')}',
      'headers': {
      },
      formData: {
        'app_key': '${props.app.key}',
        'auth_key': '${props.authKey}',
        'to': 'RECEIVER_NUMBER',
        'message_type': 'image',
        'file': {
          'value': fs.createReadStream('/path/to/your/file.jpg'),
          'options': {
            'filename': 'file.jpg',
            'contentType': null
          }
        },
        'caption': 'Optional caption'
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });`
  },
  python: {
    text: `import requests

    url = "${route('user.whatsapp-web.api.send-message')}"

    payload={
    'app_key': '${props.app.key}',
    'auth_key': '${props.authKey}',
    'to': 'RECEIVER_NUMBER',
    'message': 'Example message',
    'generate_link_preview': True
    }
    files=[]
    headers = {}
    response = requests.request("POST", url, headers=headers, data=payload, files=files)
    print(response.text)`,
    media_url: `import requests

    url = "${route('user.whatsapp-web.api.send-message')}"

    payload={
    'app_key': '${props.app.key}',
    'auth_key': '${props.authKey}',
    'to': 'RECEIVER_NUMBER',
    'message_type': 'image',
    'media_url': 'https://example.com/image.jpg',
    'caption': 'Optional caption'
    }
    files=[]
    headers = {}
    response = requests.request("POST", url, headers=headers, data=payload, files=files)
    print(response.text)`,
    media_upload: `import requests

    url = "${route('user.whatsapp-web.api.send-message')}"

    payload={
    'app_key': '${props.app.key}',
    'auth_key': '${props.authKey}',
    'to': 'RECEIVER_NUMBER',
    'message_type': 'image',
    'caption': 'Optional caption'
    }
    files=[
      ('file',('file.jpg',open('/path/to/your/file.jpg','rb'),'image/jpeg'))
    ]
    headers = {}
    response = requests.request("POST", url, headers=headers, data=payload, files=files)
    print(response.text)`
  }
}

function formattedCurlCommand(text) {
  return text.replace(/\\n/g, '\n')
}

const apiParameters = [
  {
    value: 'app_key',
    type: 'string',
    required: 'Yes',
    description: 'Used to authorize a transaction for the app'
  },
  {
    value: 'auth_key',
    type: 'string',
    required: 'Yes',
    description: 'Used to authorize a transaction for the is valid user'
  },
  {
    value: 'to',
    type: 'string',
    required: 'Yes',
    description: 'Recipient Whatsapp number should be full number with country code'
  },
  {
    value: 'message',
    type: 'string',
    required: 'Optional',
    description: 'The message text to be sent'
  },
  {
    value: 'message_type',
    type: 'string (text, image, video, audio, document, voice)',
    required: 'Optional (Default: text)',
    description: 'The type of message to be sent'
  },
  {
    value: 'media_url',
    type: 'string (URL)',
    required: 'Required if message_type is media and file is not provided',
    description: 'The URL of the media to be sent'
  },
  {
    value: 'file',
    type: 'file',
    required: 'Required if message_type is media and media_url is not provided',
    description: 'The file to be uploaded and sent'
  },
  {
    value: 'caption',
    type: 'string',
    required: 'Optional',
    description: 'Optional caption for media messages'
  },
  {
    value: 'generate_link_preview',
    type: 'boolean (true/false)',
    required: 'Optional (Default: false)',
    description: 'If true, automatically adds a clickable button and link preview for URLs in the message.'
  }
]
</script>

<template>
  <div class="flex flex-col items-center justify-between gap-2 xl:flex-row">
    <div class="card max-w-max p-1">
      <button
        v-for="tab in tabLists"
        :key="tab.value"
        class="btn w-full px-14 py-2 md:w-auto"
        :class="{ 'btn-primary': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        <span class="text-xs md:text-sm">{{ tab.title }}</span>
      </button>
    </div>

    <div class="card max-w-max p-1">
      <button
        v-for="tab in subTypes"
        :key="tab.value"
        class="btn w-full px-14 py-2 md:w-auto"
        :class="{ 'btn-primary': activeSubTab === tab.value }"
        @click="activeSubTab = tab.value"
      >
        <span class="text-xs md:text-sm">{{ tab.title }}</span>
      </button>
    </div>
  </div>

  <div class="mt-8 space-y-8">
    <div class="space-y-8" v-if="activeTab === 'curl'">
      <div class="card card-body">
        <p class="mb-5 font-semibold">{{ trans('Send Message') }}</p>
        <pre class="overflow-x-auto rounded bg-gray-100 p-2 dark:bg-dark-900">{{
          formattedCurlCommand(integrations.curl[activeSubTab])
        }}</pre>
      </div>
    </div>
    <div class="space-y-8" v-if="activeTab === 'php'">
      <div class="card card-body">
        <p class="mb-5 font-semibold">{{ trans('Send Message') }}</p>
        <pre class="overflow-x-auto rounded bg-gray-100 p-2 dark:bg-dark-900">{{
          formattedCurlCommand(integrations.php[activeSubTab])
        }}</pre>
      </div>
    </div>
    <div class="space-y-8" v-if="activeTab === 'nodejs'">
      <div class="card card-body">
        <p class="mb-5 font-semibold">{{ trans('Send Message') }}</p>
        <pre class="overflow-x-auto rounded bg-gray-100 p-2 dark:bg-dark-900">{{
          formattedCurlCommand(integrations.nodejs[activeSubTab])
        }}</pre>
      </div>
    </div>

    <div class="space-y-8" v-if="activeTab === 'python'">
      <div class="card card-body">
        <p class="mb-5 font-semibold">{{ trans('Send Message') }}</p>
        <pre class="overflow-x-auto rounded bg-gray-100 p-2 dark:bg-dark-900">{{
          formattedCurlCommand(integrations.python[activeSubTab])
        }}</pre>
      </div>
    </div>

    <div class="card card-body">
      <p class="mb-2 font-semibold">{{ trans('Successful Json Callback') }}</p>
      <pre class="rounded bg-gray-100 p-2 dark:bg-dark-900">
{
  "status": "Success",
  "data": {
    "from": "SENDER_NUMBER",
    "to": "RECEIVER_NUMBER",
    "status_code": 200
  }
}      </pre
      >
    </div>

    <div class="table-responsive mt-6 w-full">
      <table class="table">
        <thead>
          <tr>
            <th>
              {{ trans('S/N') }}
            </th>
            <th>{{ trans('VALUE') }}</th>
            <th>{{ trans('TYPE') }}</th>
            <th>
              {{ trans('REQUIRED') }}
            </th>
            <th>
              {{ trans('DESCRIPTION') }}
            </th>
          </tr>
        </thead>
        <tbody class="tbody">
          <tr v-for="(params, index) in apiParameters" :key="params.sn">
            <td>
              {{ index + 1 }}
            </td>
            <td>
              {{ params.value }}
            </td>
            <td>
              {{ params.type }}
            </td>
            <td>
              {{ params.required }}
            </td>
            <td>
              {{ params.description }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
