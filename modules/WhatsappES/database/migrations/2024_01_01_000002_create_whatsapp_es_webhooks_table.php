<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('whatsapp_es_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('webhook_id')->unique();
            $table->string('phone_number_id');
            $table->string('from_phone_number');
            $table->string('to_phone_number')->nullable();
            $table->string('message_type')->default('text');
            $table->longText('message_content')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status')->default('received');
            $table->timestamp('received_at');
            $table->timestamps();
            
            $table->index(['phone_number_id', 'status']);
            $table->index(['from_phone_number', 'received_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_es_webhooks');
    }
};
