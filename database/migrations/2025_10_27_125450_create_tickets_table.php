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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movie_session_id')->constrained()->onDelete('cascade');
            $table->foreignId('seat_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['reserved', 'paid', 'cancelled'])->default('reserved');
            $table->decimal('final_price', 10, 2);
            $table->string('unique_code', 50)->unique();
            $table->timestamp('booking_date')->useCurrent();
            $table->timestamp('expires_at')->nullable(); // для бронирований
            $table->timestamps();

            // Уникальный индекс: одно место на сеансе можно забронировать только один раз
            $table->unique(['movie_session_id', 'seat_id']);
            
            // Индексы для оптимизации
            $table->index(['user_id', 'status']);
            $table->index(['unique_code']);
            $table->index(['expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
