<?php

return [
    'name' => 'WhatsappES',
    'facebook_client_id' => env('WHATSAPP_ES_FACEBOOK_CLIENT_ID'),
    'facebook_client_secret' => env('WHATSAPP_ES_FACEBOOK_CLIENT_SECRET'),
    'whatsapp_es_config_id' => env('WHATSAPP_ES_FACEBOOK_CONFIG_ID'),
    'webhook_verify_token' => env('WHATSAPP_ES_WEBHOOK_VERIFY_TOKEN', '123456'),
];
