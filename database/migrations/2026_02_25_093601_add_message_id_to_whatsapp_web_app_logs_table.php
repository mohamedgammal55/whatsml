<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('whatsapp_web_app_logs', function (Blueprint $table) {
            $table->string('tracking_id')->nullable()->index()->after('app_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whatsapp_web_app_logs', function (Blueprint $table) {
            $table->dropColumn('tracking_id');
        });
    }
};
