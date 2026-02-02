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
        Schema::create('whatsapp_es_messages', function (Blueprint $table) {
            $table->id();
            $table->string('message_id')->unique();
            $table->string('conversation_id')->nullable();
            $table->string('phone_number_id');
            $table->string('from_phone_number');
            $table->string('to_phone_number');
            $table->enum('direction', ['inbound', 'outbound']);
            $table->string('message_type')->default('text');
            $table->longText('content')->nullable();
            $table->json('media_data')->nullable();
            $table->string('status')->default('sent');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->json('error_data')->nullable();
            $table->timestamps();
            
            $table->index(['conversation_id', 'sent_at']);
            $table->index(['phone_number_id', 'direction']);
            $table->index(['from_phone_number', 'to_phone_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_es_messages');
    }
};
