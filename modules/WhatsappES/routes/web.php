<?php

use Illuminate\Support\Facades\Route;
use Modules\WhatsappES\App\Http\Controllers\PlatformController;

Route::group(['middleware' => ['auth', 'user', 'access_module:whatsapp-es']], function () {
    Route::resource('platforms', PlatformController::class)->only('create', 'store');
});