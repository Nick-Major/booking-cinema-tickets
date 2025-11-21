<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Упрощаем ENUM, убираем 'paid'
        DB::statement("ALTER TABLE tickets MODIFY status ENUM('reserved','cancelled') NOT NULL DEFAULT 'reserved'");
        
        // Обновляем существующие записи с 'paid' на 'reserved'
        DB::table('tickets')->where('status', 'paid')->update(['status' => 'reserved']);
    }

    public function down()
    {
        // Возвращаем обратно все статусы
        DB::statement("ALTER TABLE tickets MODIFY status ENUM('reserved','paid','cancelled') NOT NULL DEFAULT 'reserved'");
    }
};
