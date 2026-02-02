<?php

namespace Modules\WhatsappES\App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    protected string $name = 'WhatsappES';

    /**
     * Called before routes are registered.
     *
     * Register any model bindings or pattern based filters.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Define the routes for the application.
     */
    public function map(): void
    {
        Route::middleware('web')->prefix('user/whatsapp-es')->as('user.whatsapp-es.')->group(module_path($this->name, '/routes/web.php'));
        Route::middleware('api')->prefix('api/whatsapp-es')->as('api.whatsapp-es.')->group(module_path($this->name, '/routes/api.php'));
        Route::middleware(['web', 'auth', 'admin'])->prefix('admin/whatsapp-es')->as('admin.whatsapp-es.')->group(module_path($this->name, '/routes/admin.php'));
    }
}
