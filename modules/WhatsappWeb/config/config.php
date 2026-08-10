<?php

return [
    'name' => 'WhatsappWeb',

    'base_url' => env('WHATSAPP_WEB_API_BASE_URL', 'http://localhost:3000'),

    // PUBLIC url of the Node socket.io server (browser-reachable). Leave empty
    // to disable realtime (the UI falls back to polling/refresh).
    'socket_url' => env('WHATSAPP_WEB_SOCKET_URL', ''),

    // Shared secret with the Node server (same value as its SOCKET_SECRET).
    // Used to sign the short-lived, per-user socket auth token.
    'socket_secret' => env('WHATSAPP_WEB_SOCKET_SECRET', ''),
];
