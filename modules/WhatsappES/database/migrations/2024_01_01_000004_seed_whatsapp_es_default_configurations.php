<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $defaultConfigurations = [
            [
                'key' => 'facebook_client_id',
                'value' => '',
                'type' => 'string',
                'description' => 'Facebook Client ID for WhatsApp Business API',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'facebook_client_secret',
                'value' => '',
                'type' => 'string',
                'description' => 'Facebook Client Secret for WhatsApp Business API',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'whatsapp_es_config_id',
                'value' => '',
                'type' => 'string',
                'description' => 'WhatsApp Embedded Signup Configuration ID',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'webhook_verify_token',
                'value' => '',
                'type' => 'string',
                'description' => 'Webhook Verify Token for WhatsApp webhooks',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'webhook_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Enable or disable webhook processing',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'auto_reply_enabled',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Enable automatic replies to incoming messages',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('whatsapp_es_configurations')->insert($defaultConfigurations);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('whatsapp_es_configurations')->whereIn('key', [
            'facebook_client_id',
            'facebook_client_secret',
            'whatsapp_es_config_id',
            'webhook_verify_token',
            'webhook_enabled',
            'auto_reply_enabled',
        ])->delete();
    }
};
