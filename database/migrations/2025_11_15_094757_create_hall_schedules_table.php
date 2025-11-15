<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('hall_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cinema_hall_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
            
            // Уникальность: один зал может иметь только одно расписание на дату
            $table->unique(['cinema_hall_id', 'date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('hall_schedules');
    }
};
