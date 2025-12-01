<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Делаем user_id nullable
            $table->foreignId('user_id')->nullable()->change();
            
            // Добавляем поля для гостей
            $table->string('guest_email')->nullable()->after('user_id');
            $table->string('guest_phone')->nullable()->after('guest_email');
            $table->string('guest_name')->nullable()->after('guest_phone');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['guest_email', 'guest_phone', 'guest_name']);
        });
    }
};
