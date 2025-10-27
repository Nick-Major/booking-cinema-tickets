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
        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cinema_hall_id')->constrained()->onDelete('cascade');
            $table->integer('row_number');
            $table->integer('row_seat_number');
            $table->enum('seat_status', ['regular', 'vip', 'blocked'])->default('regular');
            $table->timestamps();

            // Уникальный индекс: в одном зале не может быть двух мест с одинаковым рядом и номером
            $table->unique(['cinema_hall_id', 'row_number', 'row_seat_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seats');
    }
};
