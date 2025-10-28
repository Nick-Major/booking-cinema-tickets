<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('cinema_halls', function (Blueprint $table) {
            $table->decimal('regular_price', 10, 2)->default(300);
            $table->decimal('vip_price', 10, 2)->default(500);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cinema_halls', function (Blueprint $table) {
            $table->dropColumn(['regular_price', 'vip_price']);
        });
    }
};
