<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movie_sessions', function (Blueprint $table) {
            $table->foreignId('hall_schedule_id')
                  ->nullable()
                  ->constrained('hall_schedules')
                  ->onDelete('cascade');
                  
            // Индекс для оптимизации запросов
            $table->index(['hall_schedule_id', 'session_start']);
        });
    }

    public function down(): void
    {
        Schema::table('movie_sessions', function (Blueprint $table) {
            $table->dropForeign(['hall_schedule_id']);
            $table->dropIndex(['hall_schedule_id', 'session_start']);
            $table->dropColumn('hall_schedule_id');
        });
    }
};
