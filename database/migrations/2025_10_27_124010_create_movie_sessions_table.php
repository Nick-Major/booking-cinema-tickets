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
        Schema::create('movie_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movie_id')->constrained()->onDelete('cascade');
            $table->foreignId('cinema_hall_id')->constrained()->onDelete('cascade');
            $table->datetime('session_start');
            $table->datetime('session_end');
            $table->boolean('is_actual')->default(true);
            $table->decimal('base_price', 10, 2)->default(0);
            $table->timestamps();

            // Индексы для оптимизации запросов
            $table->index(['session_start', 'is_actual']);
            $table->index(['cinema_hall_id', 'session_start']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_sessions');
    }
};
