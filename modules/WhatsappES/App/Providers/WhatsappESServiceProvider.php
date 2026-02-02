<?php

namespace Modules\WhatsappES\App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Nwidart\Modules\Traits\PathNamespace;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class WhatsappESServiceProvider extends ServiceProvider
{
    use PathNamespace;

    protected string $name = 'WhatsappES';

    protected string $nameLower = 'whatsappes';

    /**
     * Boot the application events.
     */
    public function boot(): void
    {
        $this->registerCommands();
        $this->registerCommandSchedules();
        $this->registerTranslations();
        $this->registerConfig();
        $this->registerViews();
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));
        
        // Auto-deploy module when activated (migrations + assets)
        $this->autoDeployModule();
    }

    /**
     * Register the service provider.
     */
    public function register(): void
    {
        $this->app->register(EventServiceProvider::class);
        $this->app->register(RouteServiceProvider::class);
    }

    /**
     * Register commands in the format of Command::class
     */
    protected function registerCommands(): void
    {
        $this->commands([
            \Modules\WhatsappES\App\Console\Commands\MigrateWhatsappESCommand::class,
        ]);
    }

    /**
     * Register command Schedules.
     */
    protected function registerCommandSchedules(): void
    {
      
    }

    /**
     * Register translations.
     */
    public function registerTranslations(): void
    {
        $langPath = resource_path('lang/modules/' . $this->nameLower);

        if (is_dir($langPath)) {
            $this->loadTranslationsFrom($langPath, $this->nameLower);
            $this->loadJsonTranslationsFrom($langPath);
        } else {
            $this->loadTranslationsFrom(module_path($this->name, 'lang'), $this->nameLower);
            $this->loadJsonTranslationsFrom(module_path($this->name, 'lang'));
        }
    }

    /**
     * Register config.
     */
    protected function registerConfig(): void
    {
        $relativeConfigPath = config('modules.paths.generator.config.path');
        $configPath = module_path($this->name, $relativeConfigPath);

        if (is_dir($configPath)) {
            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($configPath));

            foreach ($iterator as $file) {
                if ($file->isFile() && $file->getExtension() === 'php') {
                    $relativePath = str_replace($configPath . DIRECTORY_SEPARATOR, '', $file->getPathname());
                    $configKey = $this->nameLower . '.' . str_replace([DIRECTORY_SEPARATOR, '.php'], ['.', ''], $relativePath);
                    $key = ($relativePath === 'config.php') ? $this->nameLower : $configKey;

                    $this->publishes([$file->getPathname() => config_path($relativePath)], 'config');
                    $this->mergeConfigFrom($file->getPathname(), $key);
                }
            }
        }
    }

    /**
     * Register views.
     */
    public function registerViews(): void
    {
        $viewPath = resource_path('views/modules/' . $this->nameLower);
        $sourcePath = module_path($this->name, 'resources/views');

        $this->publishes([$sourcePath => $viewPath], ['views', $this->nameLower . '-module-views']);

        $this->loadViewsFrom(array_merge($this->getPublishableViewPaths(), [$sourcePath]), $this->nameLower);

        $componentNamespace = $this->module_namespace($this->name, $this->app_path(config('modules.paths.generator.component-class.path')));
        Blade::componentNamespace($componentNamespace, $this->nameLower);
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [];
    }

    private function getPublishableViewPaths(): array
    {
        $paths = [];
        foreach (config('view.paths') as $path) {
            if (is_dir($path . '/modules/' . $this->nameLower)) {
                $paths[] = $path . '/modules/' . $this->nameLower;
            }
        }

        return $paths;
    }

    /**
     * Auto-deploy module when activated (migrations and assets)
     */
    protected function autoDeployModule(): void
    {
        // Always copy assets first (doesn't require database)
        try {
            $this->copyPreCompiledAssets();
        } catch (\Exception $e) {
            $this->logError('WhatsappES assets deployment failed: ' . $e->getMessage());
        }
        
        // Then run migrations if in console mode
        if ($this->app->runningInConsole() && !$this->app->environment('testing')) {
            try {
                if ($this->shouldRunMigrations()) {
                    $this->logInfo('Running WhatsappES migrations...');
                    Artisan::call('migrate', [
                        '--path' => 'Modules/WhatsappES/database/migrations',
                        '--force' => true
                    ]);
                    $this->logInfo('WhatsappES migrations completed.');
                }
            } catch (\Exception $e) {
                // Log the error but don't break the application
                $this->logError('WhatsappES migrations failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Copy pre-compiled assets from module to public directory
     */
    protected function copyPreCompiledAssets(): void
    {
        $modulePath = module_path($this->name);
        $sourceDir = $modulePath . '/public/build-modules/WhatsappES';
        $targetDir = public_path('build-modules/WhatsappES');
        
        // Check if source exists
        if (!is_dir($sourceDir)) {
            $this->logError('Pre-compiled assets not found in module. Source: ' . $sourceDir);
            return;
        }
        
        // Check if assets need update by comparing manifest modification time
        $sourceManifest = $sourceDir . '/manifest.json';
        $targetManifest = $targetDir . '/manifest.json';
        
        if (file_exists($targetManifest) && file_exists($sourceManifest)) {
            $sourceTime = filemtime($sourceManifest);
            $targetTime = filemtime($targetManifest);
            
            if ($sourceTime <= $targetTime) {
                $this->logInfo('WhatsappES assets already up-to-date.');
                return;
            }
        }
        
        $this->logInfo('Copying pre-compiled WhatsappES assets from: ' . $sourceDir);
        
        // Create target directory if it doesn't exist
        if (!is_dir(public_path('build-modules'))) {
            mkdir(public_path('build-modules'), 0755, true);
        }
        
        // Remove old assets if they exist
        if (is_dir($targetDir)) {
            $this->recursiveDelete($targetDir);
        }
        
        // Copy the entire directory
        $this->recursiveCopy($sourceDir, $targetDir);
        
        $this->logInfo('WhatsappES assets deployed successfully to: ' . $targetDir);
    }

    /**
     * Recursively copy directory
     */
    protected function recursiveCopy(string $source, string $destination): void
    {
        if (!is_dir($destination)) {
            mkdir($destination, 0755, true);
        }
        
        $dir = opendir($source);
        while (($file = readdir($dir)) !== false) {
            if ($file != '.' && $file != '..') {
                $srcPath = $source . '/' . $file;
                $destPath = $destination . '/' . $file;
                
                if (is_dir($srcPath)) {
                    $this->recursiveCopy($srcPath, $destPath);
                } else {
                    copy($srcPath, $destPath);
                }
            }
        }
        closedir($dir);
    }

    /**
     * Recursively delete directory
     */
    protected function recursiveDelete(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }
        
        $dir = opendir($directory);
        while (($file = readdir($dir)) !== false) {
            if ($file != '.' && $file != '..') {
                $path = $directory . '/' . $file;
                
                if (is_dir($path)) {
                    $this->recursiveDelete($path);
                } else {
                    unlink($path);
                }
            }
        }
        closedir($dir);
        rmdir($directory);
    }

    /**
     * Check if migrations should be run
     */
    protected function shouldRunMigrations(): bool
    {
        try {
            // Check if the main configuration table exists
            return !Schema::hasTable('whatsapp_es_configurations');
        } catch (\Exception $e) {
            return true; // If we can't check, assume we need to run migrations
        }
    }

    /**
     * Log info message
     */
    protected function logInfo(string $message): void
    {
        if (function_exists('logger')) {
            logger()->info("[WhatsappES] $message");
        }
    }

    /**
     * Log error message
     */
    protected function logError(string $message): void
    {
        if (function_exists('logger')) {
            logger()->error("[WhatsappES] $message");
        }
    }
}
