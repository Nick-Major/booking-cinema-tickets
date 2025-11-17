<?php

namespace Database\Seeders;

use App\Models\CinemaHall;
use App\Models\Movie;
use App\Models\MovieSession;
use App\Models\Seat;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Создаем залы
        $hall1 = CinemaHall::firstOrCreate(
            ['hall_name' => 'Основной зал'],
            [
                'row_count' => 8,
                'max_seats_number_in_row' => 10,
                'is_active' => true,
                'regular_price' => 400.00,
                'vip_price' => 600.00,
            ]
        );

        $hall2 = CinemaHall::firstOrCreate(
            ['hall_name' => 'VIP зал'],
            [
                'row_count' => 6,
                'max_seats_number_in_row' => 8,
                'is_active' => true,
                'regular_price' => 500.00,
                'vip_price' => 800.00,
            ]
        );

        // Создаем места для залов
        $this->createSeatsForHall($hall1);
        $this->createSeatsForHall($hall2);

        // Создаем фильмы (с правильными названиями полей)
        $movies = [
            [
                'title' => 'Аватар: Путь воды',
                'movie_description' => 'Фантастический боевик о приключениях на Пандоре',
                'movie_duration' => 192,
                'country' => 'США',
                'is_active' => true,
                'movie_poster' => '/images/client/avatar.jpg',
            ],
            [
                'title' => 'Оппенгеймер',
                'movie_description' => 'Биографический фильм о создателе атомной бомбы',
                'movie_duration' => 180,
                'country' => 'США',
                'is_active' => true,
                'movie_poster' => '/images/client/oppenheimer.jpg',
            ],
            [
                'title' => 'Довод',
                'movie_description' => 'Научно-фантастический боевик о путешествиях во времени',
                'movie_duration' => 150,
                'country' => 'Великобритания',
                'is_active' => true,
                'movie_poster' => '/images/client/tenet.jpg',
            ]
        ];

        foreach ($movies as $movieData) {
            Movie::firstOrCreate(
                ['title' => $movieData['title']],
                $movieData
            );
        }

        // Создаем сеансы
        $movie1 = Movie::where('title', 'Аватар: Путь воды')->first();
        $movie2 = Movie::where('title', 'Оппенгеймер')->first();
        $movie3 = Movie::where('title', 'Довод')->first();

        // Сеансы на сегодня
        $today = Carbon::today();

        // Утренний сеанс
        MovieSession::firstOrCreate(
            [
                'cinema_hall_id' => $hall1->id,
                'movie_id' => $movie1->id,
                'session_start' => $today->copy()->setTime(10, 0),
            ],
            [
                'session_end' => $today->copy()->setTime(13, 12),
                'is_actual' => true,
            ]
        );

        // Дневной сеанс
        MovieSession::firstOrCreate(
            [
                'cinema_hall_id' => $hall1->id,
                'movie_id' => $movie2->id,
                'session_start' => $today->copy()->setTime(14, 0),
            ],
            [
                'session_end' => $today->copy()->setTime(17, 0),
                'is_actual' => true,
            ]
        );

        // Вечерний сеанс
        MovieSession::firstOrCreate(
            [
                'cinema_hall_id' => $hall2->id,
                'movie_id' => $movie3->id,
                'session_start' => $today->copy()->setTime(18, 0),
            ],
            [
                'session_end' => $today->copy()->setTime(20, 30),
                'is_actual' => true,
            ]
        );

        // Сеанс на завтра
        $tomorrow = Carbon::tomorrow();

        MovieSession::firstOrCreate(
            [
                'cinema_hall_id' => $hall1->id,
                'movie_id' => $movie1->id,
                'session_start' => $tomorrow->copy()->setTime(16, 0),
            ],
            [
                'session_end' => $tomorrow->copy()->setTime(19, 12),
                'is_actual' => true,
            ]
        );

        // Создаем тестового пользователя (не админа)
        $testUser = User::firstOrCreate(
            ['email' => 'test@user.ru'],
            [
                'name' => 'Тестовый Пользователь',
                'password' => bcrypt('password123'),
                'is_admin' => false,
            ]
        );

        // Создаем тестовый билет
        $session = MovieSession::first();
        $seat = Seat::where('cinema_hall_id', $session->cinema_hall_id)
                   ->where('seat_status', 'regular')
                   ->first();

        if ($session && $seat) {
            Ticket::firstOrCreate(
                [
                    'movie_session_id' => $session->id,
                    'seat_id' => $seat->id,
                ],
                [
                    'user_id' => $testUser->id,
                    'status' => 'paid',
                    'final_price' => $seat->getPriceAttribute(),
                    'unique_code' => Ticket::generateUniqueCode(),
                    'expires_at' => null,
                ]
            );
        }

        $this->command->info('Тестовые данные созданы успешно!');
        $this->command->info('Залы: ' . CinemaHall::count());
        $this->command->info('Места: ' . Seat::count());
        $this->command->info('Фильмы: ' . Movie::count());
        $this->command->info('Сеансы: ' . MovieSession::count());
        $this->command->info('Билеты: ' . Ticket::count());
    }

    private function createSeatsForHall(CinemaHall $hall): void
    {
        for ($row = 1; $row <= $hall->row_count; $row++) {
            for ($seatNumber = 1; $seatNumber <= $hall->max_seats_number_in_row; $seatNumber++) {
                // Первые 2 ряда - VIP, остальные - обычные
                $status = $row <= 2 ? 'vip' : 'regular';
                
                // Случайно блокируем несколько мест (5% chance)
                if (rand(1, 20) === 1) {
                    $status = 'blocked';
                }

                Seat::firstOrCreate(
                    [
                        'cinema_hall_id' => $hall->id,
                        'row_number' => $row,
                        'row_seat_number' => $seatNumber,
                    ],
                    [
                        'seat_status' => $status,
                    ]
                );
            }
        }
    }
}
