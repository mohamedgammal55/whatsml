<?php

use Illuminate\Support\Facades\Route;
use Modules\WhatsappES\App\Http\Controllers\WebhookController;

Route::get('/webhook', [WebhookController::class, 'verify'])->name('webhook');
Route::post('/webhook', [WebhookController::class, 'store']);
