<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Сначала удаляем foreign key constraint
            $table->dropForeign(['user_id']);
            // Затем удаляем столбец
            $table->dropColumn('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Восстанавливаем столбец
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
        });
    }
};
