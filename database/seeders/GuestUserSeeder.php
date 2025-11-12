<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class GuestUserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'guest@cinema.ru'],
            [
                'name' => 'Гость',
                'password' => Hash::make('guest_password'),
                'is_admin' => false,
            ]
        );
    }
}