<?php

namespace Modules\WhatsappES\App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class MigrateWhatsappESCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'whatsapp-es:migrate {--force : Force the operation to run when in production}';

    /**
     * The console command description.
     */
    protected $description = 'Run WhatsappES module migrations';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Running WhatsappES module migrations...');

        try {
            $exitCode = Artisan::call('migrate', [
                '--path' => 'Modules/WhatsappES/database/migrations',
                '--force' => $this->option('force')
            ]);

            if ($exitCode === 0) {
                $this->info('WhatsappES migrations completed successfully!');
                return self::SUCCESS;
            } else {
                $this->error('WhatsappES migrations failed!');
                return self::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error('Error running WhatsappES migrations: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
