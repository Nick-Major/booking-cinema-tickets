<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('hall_schedules', function (Blueprint $table) {
            $table->boolean('overnight')->default(false)->after('end_time');
        });
    }

    public function down()
    {
        Schema::table('hall_schedules', function (Blueprint $table) {
            $table->dropColumn('overnight');
        });
    }
};
