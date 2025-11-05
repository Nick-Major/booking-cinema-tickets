<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('movie_sessions', function (Blueprint $table) {
            $table->integer('order_column')->default(0)->after('is_actual');
        });
    }

    public function down()
    {
        Schema::table('movie_sessions', function (Blueprint $table) {
            $table->dropColumn('order_column');
        });
    }
};
